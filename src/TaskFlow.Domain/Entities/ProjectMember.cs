using TaskFlow.Domain.Enums;

namespace TaskFlow.Domain.Entities;

public sealed class ProjectMember
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid ProjectId { get; private set; }

    public string UserId { get; private set; } = string.Empty;

    public ProjectRole Role { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    public Project Project { get; private set; } = null!;

    private ProjectMember()
    {
    }

    public static ProjectMember Create(Guid projectId, string userId, ProjectRole role)
    {
        return new ProjectMember
        {
            ProjectId = projectId,
            UserId = userId,
            Role = role,
            JoinedAt = DateTimeOffset.UtcNow
        };
    }

    public void UpdateRole(ProjectRole role)
    {
        Role = role;
    }
}
