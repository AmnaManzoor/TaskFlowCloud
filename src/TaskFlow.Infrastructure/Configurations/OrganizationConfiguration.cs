using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("Organizations");

        builder.HasKey(organization => organization.Id);

        builder.Property(organization => organization.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(organization => organization.Name)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.Property(organization => organization.Description)
            .HasMaxLength(2000);

        builder.Property(organization => organization.LogoUrl)
            .HasMaxLength(500);

        builder.Property(organization => organization.IsActive)
            .HasDefaultValue(true);

        builder.Property(organization => organization.IsDeleted)
            .HasDefaultValue(false);

        builder.HasQueryFilter(organization => !organization.IsDeleted);

        builder.HasMany(organization => organization.Members)
            .WithOne(member => member.Organization)
            .HasForeignKey(member => member.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(organization => organization.Teams)
            .WithOne(team => team.Organization)
            .HasForeignKey(team => team.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(organization => organization.Projects)
            .WithOne(project => project.Organization)
            .HasForeignKey(project => project.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
