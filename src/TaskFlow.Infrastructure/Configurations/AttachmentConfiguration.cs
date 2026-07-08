using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.ToTable("Attachments");

        builder.HasKey(attachment => attachment.Id);

        builder.Property(attachment => attachment.UploadedBy)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(attachment => attachment.OriginalFileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(attachment => attachment.StoredFileName)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(attachment => attachment.FileExtension)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(attachment => attachment.ContentType)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(attachment => attachment.BlobPath)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(attachment => attachment.ContentHash)
            .HasMaxLength(128);

        builder.HasIndex(attachment => attachment.TaskId);
        builder.HasIndex(attachment => attachment.UploadedBy);
        builder.HasIndex(attachment => new { attachment.TaskId, attachment.ContentHash });

        builder.HasOne(attachment => attachment.Task)
            .WithMany(task => task.Attachments)
            .HasForeignKey(attachment => attachment.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(attachment => attachment.UploadedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
