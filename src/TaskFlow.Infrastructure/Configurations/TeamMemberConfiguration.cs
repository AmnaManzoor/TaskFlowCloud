using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class TeamMemberConfiguration : IEntityTypeConfiguration<TeamMember>
{
    public void Configure(EntityTypeBuilder<TeamMember> builder)
    {
        builder.ToTable("TeamMembers");

        builder.HasKey(member => member.Id);

        builder.Property(member => member.UserId)
            .HasMaxLength(450)
            .IsRequired();

        builder.HasIndex(member => new { member.TeamId, member.UserId })
            .IsUnique();

        builder.HasOne<ApplicationUser>()
            .WithMany(user => user.TeamMembers)
            .HasForeignKey(member => member.UserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
