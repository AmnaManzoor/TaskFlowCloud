using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class TaskLabelConfiguration : IEntityTypeConfiguration<TaskLabel>
{
    public void Configure(EntityTypeBuilder<TaskLabel> builder)
    {
        builder.ToTable("TaskLabels");

        builder.HasKey(label => label.Id);

        builder.Property(label => label.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(label => label.Name)
            .IsUnique();

        builder.Property(label => label.Color)
            .HasMaxLength(20)
            .IsRequired();
    }
}

internal sealed class TaskItemLabelConfiguration : IEntityTypeConfiguration<TaskItemLabel>
{
    public void Configure(EntityTypeBuilder<TaskItemLabel> builder)
    {
        builder.ToTable("TaskItemLabels");

        builder.HasKey(link => new { link.TaskId, link.LabelId });

        builder.HasOne(link => link.Label)
            .WithMany(label => label.Tasks)
            .HasForeignKey(link => link.LabelId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
