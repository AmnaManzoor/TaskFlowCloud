using Microsoft.EntityFrameworkCore;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Application.Interfaces;

/// <summary>
/// Abstraction over the application's persistence context.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<TaskItem> Tasks { get; }

    DbSet<Attachment> Attachments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
