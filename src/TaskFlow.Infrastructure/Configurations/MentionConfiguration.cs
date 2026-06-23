using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class MentionConfiguration : IEntityTypeConfiguration<Mention>
{
    public void Configure(EntityTypeBuilder<Mention> builder)
    {
        builder.ToTable("Mentions");

        builder.HasKey(mention => mention.Id);

        builder.Property(mention => mention.MentionedUserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.HasIndex(mention => new { mention.CommentId, mention.MentionedUserId })
            .IsUnique();

        builder.HasOne(mention => mention.Comment)
            .WithMany(comment => comment.Mentions)
            .HasForeignKey(mention => mention.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(mention => mention.MentionedUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
