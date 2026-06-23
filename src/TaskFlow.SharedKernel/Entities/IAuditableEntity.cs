namespace TaskFlow.SharedKernel.Entities;

/// <summary>
/// Marks an entity that tracks creation and modification metadata.
/// </summary>
public interface IAuditableEntity
{
    DateTimeOffset CreatedAt { get; }

    DateTimeOffset? UpdatedAt { get; }
}
