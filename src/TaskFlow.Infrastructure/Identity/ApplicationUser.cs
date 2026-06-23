using Microsoft.AspNetCore.Identity;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Identity;

/// <summary>
/// Application user persisted through ASP.NET Core Identity.
/// </summary>
public sealed class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? ProfileImageUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }

    public DateTimeOffset? LastLoginAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];

    public ICollection<OrganizationMember> OrganizationMembers { get; set; } = [];

    public ICollection<TeamMember> TeamMembers { get; set; } = [];
}
