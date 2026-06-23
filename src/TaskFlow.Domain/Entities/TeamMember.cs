namespace TaskFlow.Domain.Entities;

/// <summary>
/// Links a user to a team.
/// </summary>
public sealed class TeamMember
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid TeamId { get; private set; }

    public string UserId { get; private set; } = string.Empty;

    public DateTimeOffset JoinedAt { get; private set; }

    public Team Team { get; private set; } = null!;

    private TeamMember()
    {
    }

    public static TeamMember Create(Guid teamId, string userId)
    {
        return new TeamMember
        {
            TeamId = teamId,
            UserId = userId,
            JoinedAt = DateTimeOffset.UtcNow
        };
    }
}
