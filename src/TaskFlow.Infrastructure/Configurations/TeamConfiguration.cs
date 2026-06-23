using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.ToTable("Teams");

        builder.HasKey(team => team.Id);

        builder.Property(team => team.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(team => team.Description)
            .HasMaxLength(2000);

        builder.HasIndex(team => new { team.OrganizationId, team.Name })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.Property(team => team.IsDeleted)
            .HasDefaultValue(false);

        builder.HasQueryFilter(team => !team.IsDeleted);

        builder.HasMany(team => team.Members)
            .WithOne(member => member.Team)
            .HasForeignKey(member => member.TeamId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
