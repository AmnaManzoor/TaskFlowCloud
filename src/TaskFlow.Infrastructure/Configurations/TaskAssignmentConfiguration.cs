using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class TaskAssignmentConfiguration : IEntityTypeConfiguration<TaskAssignment>
{
    public void Configure(EntityTypeBuilder<TaskAssignment> builder)
    {
        builder.ToTable("TaskAssignments");

        builder.HasKey(assignment => assignment.Id);

        builder.Property(assignment => assignment.UserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(assignment => assignment.AssignedBy)
            .HasMaxLength(450)
            .IsRequired();

        builder.HasIndex(assignment => new { assignment.TaskId, assignment.UserId })
            .IsUnique();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(assignment => assignment.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
