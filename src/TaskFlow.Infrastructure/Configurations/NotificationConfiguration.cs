using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(notification => notification.Id);

        builder.Property(notification => notification.UserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(notification => notification.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(notification => notification.Message)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(notification => notification.ReferenceType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(notification => notification.IsRead)
            .HasDefaultValue(false);

        builder.HasIndex(notification => notification.UserId);
        builder.HasIndex(notification => notification.IsRead);
        builder.HasIndex(notification => notification.CreatedAt);
        builder.HasIndex(notification => new { notification.UserId, notification.IsRead, notification.CreatedAt });

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(notification => notification.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
