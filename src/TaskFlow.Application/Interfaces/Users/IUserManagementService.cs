using TaskFlow.Application.Common.Models;
using TaskFlow.Application.DTOs.Users;

namespace TaskFlow.Application.Interfaces.Users;

public interface IUserManagementService
{
    Task<UserDetailResponse> GetCurrentUserAsync(string currentUserId, CancellationToken cancellationToken = default);

    Task<UserDetailResponse> GetByIdAsync(string currentUserId, string userId, CancellationToken cancellationToken = default);

    Task<PagedResult<UserSummaryResponse>> GetAllAsync(string currentUserId, UserListQuery query, CancellationToken cancellationToken = default);

    Task<UserDetailResponse> UpdateProfileAsync(string currentUserId, string userId, UpdateUserProfileRequest request, CancellationToken cancellationToken = default);

    Task ActivateAsync(string currentUserId, string userId, CancellationToken cancellationToken = default);

    Task DeactivateAsync(string currentUserId, string userId, CancellationToken cancellationToken = default);

    Task LockAsync(string currentUserId, string userId, CancellationToken cancellationToken = default);

    Task UnlockAsync(string currentUserId, string userId, CancellationToken cancellationToken = default);

    Task<string> UploadProfileImageAsync(string currentUserId, string userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);

    Task DeleteProfileImageAsync(string currentUserId, string userId, CancellationToken cancellationToken = default);
}

public interface IProfileImageStorage
{
    Task<string> SaveAsync(string userId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);

    Task DeleteAsync(string? imageUrl, CancellationToken cancellationToken = default);
}
