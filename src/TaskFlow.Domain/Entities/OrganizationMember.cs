using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

/// <summary>
/// Links a user to an organization with a specific role.
/// </summary>
public sealed class OrganizationMember
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid OrganizationId { get; private set; }

    public string UserId { get; private set; } = string.Empty;

    public OrganizationMemberRole Role { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    public Organization Organization { get; private set; } = null!;

    private OrganizationMember()
    {
    }

    public static OrganizationMember Create(Guid organizationId, string userId, OrganizationMemberRole role)
    {
        return new OrganizationMember
        {
            OrganizationId = organizationId,
            UserId = userId,
            Role = role,
            JoinedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateRole(OrganizationMemberRole role)
    {
        Role = role;
    }
}
