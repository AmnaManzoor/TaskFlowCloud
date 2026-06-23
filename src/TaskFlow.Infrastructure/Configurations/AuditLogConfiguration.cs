using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(entry => entry.Id);

        builder.Property(entry => entry.UserId)
            .HasMaxLength(450);

        builder.Property(entry => entry.Action)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entry => entry.EntityType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(entry => entry.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(entry => entry.OldValues)
            .HasColumnType("nvarchar(max)");

        builder.Property(entry => entry.NewValues)
            .HasColumnType("nvarchar(max)");

        builder.Property(entry => entry.IPAddress)
            .HasMaxLength(64);

        builder.Property(entry => entry.UserAgent)
            .HasMaxLength(512);

        builder.Property(entry => entry.CorrelationId)
            .HasMaxLength(100);

        builder.HasIndex(entry => entry.UserId);
        builder.HasIndex(entry => entry.EntityType);
        builder.HasIndex(entry => entry.EntityId);
        builder.HasIndex(entry => entry.Action);
        builder.HasIndex(entry => entry.CreatedAt);
        builder.HasIndex(entry => new { entry.EntityType, entry.EntityId, entry.CreatedAt });
        builder.HasIndex(entry => new { entry.UserId, entry.CreatedAt });

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(entry => entry.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
