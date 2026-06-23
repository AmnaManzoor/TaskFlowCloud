namespace TaskFlow.Domain.Entities;

/// <summary>
/// Represents a team within an organization.
/// </summary>
public sealed class Team
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid OrganizationId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public bool IsDeleted { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public Organization Organization { get; private set; } = null!;

    public ICollection<TeamMember> Members { get; private set; } = [];

    private Team()
    {
    }

    public static Team Create(Guid organizationId, string name, string? description)
    {
        return new Team
        {
            OrganizationId = organizationId,
            Name = name,
            Description = description,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
