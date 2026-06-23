using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TaskFlow.Application.Common.Configuration;
using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Users;
using TaskFlow.Application.Interfaces.Organizations;
using TaskFlow.Application.Interfaces.Users;
using TaskFlow.Application.Interfaces.Audit;
using TaskFlow.Domain.Constants;
using TaskFlow.Infrastructure.Identity;
using TaskFlow.Infrastructure.Persistence;

namespace TaskFlow.Infrastructure.Services;

public sealed class UserManagementService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IOrganizationAccessService accessService,
    IProfileImageStorage profileImageStorage,
    IOptions<FileStorageOptions> fileStorageOptions,
    IAuditTriggerService auditTriggers,
    ILogger<UserManagementService> logger) : IUserManagementService
{
    private readonly FileStorageOptions _fileStorageOptions = fileStorageOptions.Value;

    public async Task<UserDetailResponse> GetCurrentUserAsync(
        string currentUserId,
        CancellationToken cancellationToken = default) =>
        await GetByIdAsync(currentUserId, currentUserId, cancellationToken);

    public async Task<UserDetailResponse> GetByIdAsync(
        string currentUserId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanViewUserAsync(currentUserId, userId, cancellationToken);

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        return await MapUserDetailAsync(user);
    }

    public async Task<PagedResult<UserSummaryResponse>> GetAllAsync(
        string currentUserId,
        UserListQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureIsSystemOrOrganizationAdminAsync(currentUserId, cancellationToken);

        var users = userManager.Users.AsNoTracking().AsQueryable();

        if (!await accessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            var organizationIds = await dbContext.OrganizationMembers
                .Where(member =>
                    member.UserId == currentUserId &&
                    (member.Role == Domain.Enums.OrganizationMemberRole.Owner ||
                     member.Role == Domain.Enums.OrganizationMemberRole.Administrator))
                .Select(member => member.OrganizationId)
                .ToListAsync(cancellationToken);

            var memberUserIds = dbContext.OrganizationMembers
                .Where(member => organizationIds.Contains(member.OrganizationId))
                .Select(member => member.UserId);

            users = users.Where(user => memberUserIds.Contains(user.Id));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            users = users.Where(user =>
                user.Email!.Contains(search) ||
                user.FirstName.Contains(search) ||
                user.LastName.Contains(search));
        }

        if (query.IsActive.HasValue)
        {
            users = users.Where(user => user.IsActive == query.IsActive.Value);
        }

        users = ApplySorting(users, query.SortBy, query.SortDescending);

        var totalCount = await users.CountAsync(cancellationToken);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await users
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var summaries = new List<UserSummaryResponse>();
        foreach (var user in items)
        {
            summaries.Add(await MapUserSummaryAsync(user));
        }

        return new PagedResult<UserSummaryResponse>(summaries, page, pageSize, totalCount);
    }

    public async Task<UserDetailResponse> UpdateProfileAsync(
        string currentUserId,
        string userId,
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        if (currentUserId != userId)
        {
            await EnsureIsSystemOrOrganizationAdminAsync(currentUserId, cancellationToken);
        }

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var previousProfile = new { user.FirstName, user.LastName, user.ProfileImageUrl };

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.ProfileImageUrl = request.ProfileImageUrl;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await userManager.UpdateAsync(user);

        await auditTriggers.LogProfileUpdatedAsync(
            userId,
            previousProfile,
            new { request.FirstName, request.LastName, request.ProfileImageUrl },
            cancellationToken);

        return await MapUserDetailAsync(user);
    }

    public async Task ActivateAsync(string currentUserId, string userId, CancellationToken cancellationToken = default)
    {
        await EnsureCanManageUserAsync(currentUserId, userId, cancellationToken);

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = true;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        logger.LogInformation("User {UserId} activated by {CurrentUserId}", userId, currentUserId);
    }

    public async Task DeactivateAsync(string currentUserId, string userId, CancellationToken cancellationToken = default)
    {
        await EnsureCanManageUserAsync(currentUserId, userId, cancellationToken);

        if (currentUserId == userId)
        {
            throw new InvalidOperationException("You cannot deactivate your own account.");
        }

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        logger.LogInformation("User {UserId} deactivated by {CurrentUserId}", userId, currentUserId);
    }

    public async Task LockAsync(string currentUserId, string userId, CancellationToken cancellationToken = default)
    {
        await EnsureCanManageUserAsync(currentUserId, userId, cancellationToken);

        if (currentUserId == userId)
        {
            throw new InvalidOperationException("You cannot lock your own account.");
        }

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        logger.LogInformation("User {UserId} locked by {CurrentUserId}", userId, currentUserId);
    }

    public async Task UnlockAsync(string currentUserId, string userId, CancellationToken cancellationToken = default)
    {
        await EnsureCanManageUserAsync(currentUserId, userId, cancellationToken);

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        await userManager.SetLockoutEndDateAsync(user, null);
        logger.LogInformation("User {UserId} unlocked by {CurrentUserId}", userId, currentUserId);
    }

    public async Task<string> UploadProfileImageAsync(
        string currentUserId,
        string userId,
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        if (currentUserId != userId)
        {
            await EnsureIsSystemOrOrganizationAdminAsync(currentUserId, cancellationToken);
        }

        if (fileStream.Length > _fileStorageOptions.MaxProfileImageSizeBytes)
        {
            throw new InvalidOperationException("Profile image exceeds the maximum allowed size.");
        }

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        await profileImageStorage.DeleteAsync(user.ProfileImageUrl, cancellationToken);
        var imageUrl = await profileImageStorage.SaveAsync(userId, fileStream, fileName, cancellationToken);

        user.ProfileImageUrl = imageUrl;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        return imageUrl;
    }

    public async Task DeleteProfileImageAsync(
        string currentUserId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        if (currentUserId != userId)
        {
            await EnsureIsSystemOrOrganizationAdminAsync(currentUserId, cancellationToken);
        }

        var user = await userManager.FindByIdAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        await profileImageStorage.DeleteAsync(user.ProfileImageUrl, cancellationToken);
        user.ProfileImageUrl = null;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);
    }

    private async Task EnsureCanViewUserAsync(
        string currentUserId,
        string userId,
        CancellationToken cancellationToken)
    {
        if (currentUserId == userId)
        {
            return;
        }

        await EnsureIsSystemOrOrganizationAdminAsync(currentUserId, cancellationToken);
    }

    private async Task EnsureCanManageUserAsync(
        string currentUserId,
        string userId,
        CancellationToken cancellationToken)
    {
        if (currentUserId == userId)
        {
            throw new UnauthorizedAccessException("You cannot perform this action on your own account.");
        }

        await EnsureIsSystemOrOrganizationAdminAsync(currentUserId, cancellationToken);
    }

    private async Task EnsureIsSystemOrOrganizationAdminAsync(
        string currentUserId,
        CancellationToken cancellationToken)
    {
        if (await accessService.IsSuperAdminAsync(currentUserId, cancellationToken))
        {
            return;
        }

        var isOrgAdmin = await dbContext.OrganizationMembers.AnyAsync(
            member =>
                member.UserId == currentUserId &&
                (member.Role == Domain.Enums.OrganizationMemberRole.Owner ||
                 member.Role == Domain.Enums.OrganizationMemberRole.Administrator),
            cancellationToken);

        if (!isOrgAdmin)
        {
            throw new UnauthorizedAccessException("You do not have permission to manage users.");
        }
    }

    private static IQueryable<ApplicationUser> ApplySorting(
        IQueryable<ApplicationUser> query,
        string? sortBy,
        bool sortDescending) =>
        (sortBy?.ToLowerInvariant()) switch
        {
            "firstname" => sortDescending
                ? query.OrderByDescending(user => user.FirstName)
                : query.OrderBy(user => user.FirstName),
            "lastname" => sortDescending
                ? query.OrderByDescending(user => user.LastName)
                : query.OrderBy(user => user.LastName),
            "createdat" => sortDescending
                ? query.OrderByDescending(user => user.CreatedAt)
                : query.OrderBy(user => user.CreatedAt),
            _ => sortDescending
                ? query.OrderByDescending(user => user.Email)
                : query.OrderBy(user => user.Email)
        };

    private async Task<UserSummaryResponse> MapUserSummaryAsync(ApplicationUser user)
    {
        var isLockedOut = await userManager.IsLockedOutAsync(user);
        return new UserSummaryResponse(
            user.Id,
            user.Email!,
            user.FirstName,
            user.LastName,
            user.ProfileImageUrl,
            user.IsActive,
            user.EmailConfirmed,
            isLockedOut,
            user.CreatedAt,
            user.LastLoginAt);
    }

    private async Task<UserDetailResponse> MapUserDetailAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var isLockedOut = await userManager.IsLockedOutAsync(user);

        return new UserDetailResponse(
            user.Id,
            user.Email!,
            user.FirstName,
            user.LastName,
            user.ProfileImageUrl,
            user.IsActive,
            user.EmailConfirmed,
            isLockedOut,
            roles.ToList(),
            user.CreatedAt,
            user.UpdatedAt,
            user.LastLoginAt);
    }
}
