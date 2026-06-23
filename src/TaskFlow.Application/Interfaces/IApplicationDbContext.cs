namespace TaskFlow.Application.Interfaces;

/// <summary>
/// Abstraction over the application's persistence context.
/// </summary>
public interface IApplicationDbContext
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
