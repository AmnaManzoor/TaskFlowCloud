using TaskFlow.Domain.Entities;
using TaskFlow.Domain.Enums;

namespace TaskFlow.UnitTests.Domain;

public class NotificationTests
{
    [Fact]
    public void MarkAsRead_SetsReadAt()
    {
        var notification = Notification.Create(
            "user-id",
            NotificationType.TaskAssigned,
            "Title",
            "Message",
            "Task",
            Guid.NewGuid());

        notification.MarkAsRead();

        Assert.True(notification.IsRead);
        Assert.NotNull(notification.ReadAt);
    }

    [Fact]
    public void MarkAsUnread_ClearsReadAt()
    {
        var notification = Notification.Create(
            "user-id",
            NotificationType.TaskAssigned,
            "Title",
            "Message",
            "Task",
            Guid.NewGuid());

        notification.MarkAsRead();
        notification.MarkAsUnread();

        Assert.False(notification.IsRead);
        Assert.Null(notification.ReadAt);
    }
}
