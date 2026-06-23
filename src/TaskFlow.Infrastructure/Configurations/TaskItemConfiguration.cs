using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("Tasks");

        builder.HasKey(task => task.Id);

        builder.Property(task => task.Title)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(task => task.Description)
            .HasMaxLength(8000);

        builder.Property(task => task.EstimatedHours)
            .HasPrecision(10, 2);

        builder.Property(task => task.ActualHours)
            .HasPrecision(10, 2);

        builder.Property(task => task.CreatedBy)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(task => task.UpdatedBy)
            .HasMaxLength(450);

        builder.Property(task => task.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(task => task.RowVersion)
            .IsRowVersion();

        builder.HasQueryFilter(task => !task.IsDeleted);

        builder.HasOne(task => task.Project)
            .WithMany(project => project.Tasks)
            .HasForeignKey(task => task.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(task => task.ParentTask)
            .WithMany(task => task.Subtasks)
            .HasForeignKey(task => task.ParentTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(task => task.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(task => task.Assignments)
            .WithOne(assignment => assignment.Task)
            .HasForeignKey(assignment => assignment.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(task => task.Labels)
            .WithOne(link => link.Task)
            .HasForeignKey(link => link.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(task => task.Dependencies)
            .WithOne(dependency => dependency.Task)
            .HasForeignKey(dependency => dependency.TaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(task => task.DependentTasks)
            .WithOne(dependency => dependency.DependsOnTask)
            .HasForeignKey(dependency => dependency.DependsOnTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(task => task.Checklists)
            .WithOne(checklist => checklist.Task)
            .HasForeignKey(checklist => checklist.TaskId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
