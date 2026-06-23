namespace TaskFlow.SharedKernel.Entities;

/// <summary>
/// Base type for domain entities with a strongly typed identifier.
/// </summary>
public abstract class BaseEntity<TId> where TId : notnull
{
    public TId Id { get; protected set; } = default!;
}
