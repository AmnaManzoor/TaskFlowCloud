using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Domain;

public class ProjectTests
{
    [Fact]
    public void Update_WhenArchived_ThrowsInvalidOperationException()
    {
        var project = Project.Create(
            Guid.NewGuid(),
            "Test",
            "TEST",
            null,
            ProjectStatus.Active,
            ProjectPriority.Medium,
            null,
            null,
            null,
            "owner-id");

        project.Archive();

        Assert.Throws<InvalidOperationException>(() =>
            project.Update("New Name", null, null, null, null));
    }

    [Fact]
    public void Archive_SetsStatusToArchived()
    {
        var project = Project.Create(
            Guid.NewGuid(),
            "Test",
            "TEST",
            null,
            ProjectStatus.Active,
            ProjectPriority.Medium,
            null,
            null,
            null,
            "owner-id");

        project.Archive();

        Assert.True(project.IsArchived);
        Assert.Equal(ProjectStatus.Archived, project.Status);
    }
}
