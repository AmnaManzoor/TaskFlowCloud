using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class ActivityHistoryConfiguration : IEntityTypeConfiguration<ActivityHistory>
{
    public void Configure(EntityTypeBuilder<ActivityHistory> builder)
    {
        builder.ToTable("ActivityHistory");

        builder.HasKey(entry => entry.Id);

        builder.Property(entry => entry.UserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(entry => entry.ActivityType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entry => entry.EntityType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(entry => entry.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.HasIndex(entry => entry.UserId);
        builder.HasIndex(entry => entry.EntityType);
        builder.HasIndex(entry => entry.EntityId);
        builder.HasIndex(entry => entry.CreatedAt);
        builder.HasIndex(entry => new { entry.UserId, entry.CreatedAt });
        builder.HasIndex(entry => new { entry.EntityType, entry.EntityId, entry.CreatedAt });

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(entry => entry.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
