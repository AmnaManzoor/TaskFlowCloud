using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Domain.Entities;
using TaskFlow.Infrastructure.Identity;

namespace TaskFlow.Infrastructure.Configurations;

internal sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("Projects");

        builder.HasKey(project => project.Id);

        builder.Property(project => project.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(project => project.Code)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(project => project.Code)
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.HasIndex(project => new { project.OrganizationId, project.Name })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0");

        builder.Property(project => project.Description)
            .HasMaxLength(4000);

        builder.Property(project => project.OwnerId)
            .HasMaxLength(450)
            .IsRequired();

        builder.Property(project => project.IsArchived)
            .HasDefaultValue(false);

        builder.Property(project => project.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(project => project.RowVersion)
            .IsRowVersion();

        builder.HasQueryFilter(project => !project.IsDeleted);

        builder.HasOne(project => project.Organization)
            .WithMany(organization => organization.Projects)
            .HasForeignKey(project => project.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(project => project.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(project => project.Members)
            .WithOne(member => member.Project)
            .HasForeignKey(member => member.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(project => project.Tasks)
            .WithOne(task => task.Project)
            .HasForeignKey(task => task.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
