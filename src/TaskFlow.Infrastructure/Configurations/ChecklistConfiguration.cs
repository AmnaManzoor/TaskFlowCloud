using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class ChecklistConfiguration : IEntityTypeConfiguration<Checklist>
{
    public void Configure(EntityTypeBuilder<Checklist> builder)
    {
        builder.ToTable("Checklists");

        builder.HasKey(checklist => checklist.Id);

        builder.Property(checklist => checklist.Title)
            .HasMaxLength(500)
            .IsRequired();

        builder.HasIndex(checklist => new { checklist.TaskId, checklist.Order });
    }
}
