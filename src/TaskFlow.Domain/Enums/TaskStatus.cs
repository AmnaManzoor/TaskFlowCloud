namespace TaskFlow.Domain.Enums;

public enum TaskStatus
{
    Backlog = 0,
    Todo = 1,
    InProgress = 2,
    InReview = 3,
    Blocked = 4,
    Completed = 5,
    Cancelled = 6
}
