using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public sealed class Project
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid OrganizationId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Code { get; private set; } = string.Empty;

    public string? Description { get; private set; }

    public ProjectStatus Status { get; private set; } = ProjectStatus.Draft;

    public ProjectPriority Priority { get; private set; } = ProjectPriority.Medium;

    public DateOnly? StartDate { get; private set; }

    public DateOnly? EndDate { get; private set; }

    public DateOnly? EstimatedCompletionDate { get; private set; }

    public string OwnerId { get; private set; } = string.Empty;

    public bool IsArchived { get; private set; }

    public bool IsDeleted { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? UpdatedAt { get; private set; }

    public DateTimeOffset? DeletedAt { get; private set; }

    public byte[] RowVersion { get; private set; } = [];

    public Organization Organization { get; private set; } = null!;

    public ICollection<ProjectMember> Members { get; private set; } = [];

    public ICollection<TaskItem> Tasks { get; private set; } = [];

    private Project()
    {
    }

    public static Project Create(
        Guid organizationId,
        string name,
        string code,
        string? description,
        ProjectStatus status,
        ProjectPriority priority,
        DateOnly? startDate,
        DateOnly? endDate,
        DateOnly? estimatedCompletionDate,
        string ownerId)
    {
        return new Project
        {
            OrganizationId = organizationId,
            Name = name,
            Code = code.ToUpperInvariant(),
            Description = description,
            Status = status,
            Priority = priority,
            StartDate = startDate,
            EndDate = endDate,
            EstimatedCompletionDate = estimatedCompletionDate,
            OwnerId = ownerId,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string name,
        string? description,
        DateOnly? startDate,
        DateOnly? endDate,
        DateOnly? estimatedCompletionDate)
    {
        EnsureNotArchived();
        Name = name;
        Description = description;
        StartDate = startDate;
        EndDate = endDate;
        EstimatedCompletionDate = estimatedCompletionDate;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ChangeStatus(ProjectStatus status)
    {
        EnsureNotArchived();
        Status = status;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ChangePriority(ProjectPriority priority)
    {
        EnsureNotArchived();
        Priority = priority;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void TransferOwnership(string newOwnerId)
    {
        EnsureNotArchived();
        OwnerId = newOwnerId;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Archive()
    {
        if (IsArchived)
        {
            return;
        }

        IsArchived = true;
        Status = ProjectStatus.Archived;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void Restore()
    {
        if (!IsArchived)
        {
            return;
        }

        IsArchived = false;
        Status = ProjectStatus.Draft;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTimeOffset.UtcNow;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    private void EnsureNotArchived()
    {
        if (IsArchived)
        {
            throw new InvalidOperationException("Archived projects cannot be modified.");
        }
    }
}
