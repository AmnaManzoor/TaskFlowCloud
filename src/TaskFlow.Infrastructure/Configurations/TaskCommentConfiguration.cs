using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class TaskCommentConfiguration : IEntityTypeConfiguration<TaskComment>
{
    public void Configure(EntityTypeBuilder<TaskComment> builder)
    {
        builder.ToTable("TaskComments");

        builder.HasKey(comment => comment.Id);

        builder.Property(comment => comment.UserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(comment => comment.Content)
            .HasMaxLength(10000)
            .IsRequired();

        builder.Property(comment => comment.IsDeleted)
            .HasDefaultValue(false);

        builder.HasOne(comment => comment.Task)
            .WithMany(task => task.Comments)
            .HasForeignKey(comment => comment.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(comment => comment.ParentComment)
            .WithMany(comment => comment.Replies)
            .HasForeignKey(comment => comment.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(comment => comment.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(comment => comment.TaskId);
        builder.HasIndex(comment => comment.UserId);
        builder.HasIndex(comment => comment.ParentCommentId);
    }
}
