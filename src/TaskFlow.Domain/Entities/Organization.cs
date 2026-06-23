namespace TaskFlow.Domain.Entities;

/// <summary>
/// Represents a tenant organization in TaskFlow.
/// </summary>
public sealed class Organization
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public string Name { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public string? LogoUrl { get; private set; }

    public bool IsActive { get; private set; } = true;

    public bool IsDeleted { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public ICollection<OrganizationMember> Members { get; private set; } = [];

    public ICollection<Team> Teams { get; private set; } = [];

    public ICollection<Project> Projects { get; private set; } = [];

    private Organization()
    {
    }

    public static Organization Create(string name, string? description, string? logoUrl)
    {
        return new Organization
        {
            Name = name,
            Description = description,
            LogoUrl = logoUrl,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, string? description, string? logoUrl, bool isActive)
    {
        Name = name;
        Description = description;
        LogoUrl = logoUrl;
        IsActive = isActive;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        IsActive = false;
        DeletedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
