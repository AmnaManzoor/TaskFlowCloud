namespace TaskFlow.Domain.Entities;

public sealed class Mention
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid CommentId { get; private set; }

    public string MentionedUserId { get; private set; } = string.Empty;

    public TaskComment Comment { get; private set; } = null!;

    private Mention()
    {
    }

    public static Mention Create(Guid commentId, string mentionedUserId)
    {
        return new Mention
        {
            CommentId = commentId,
            MentionedUserId = mentionedUserId
        };
    }
}
