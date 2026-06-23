import { buildCommentTree, fileCategory, renderMarkdownPreview } from '@features/collaboration/models/collaboration.utils';
import { AttachmentFileCategory } from '@features/collaboration/models/collaboration.enums';
import type { Comment } from '@features/collaboration/models/collaboration.models';

describe('collaboration.utils', () => {
  it('should categorize pdf files', () => {
    expect(fileCategory('.pdf', 'application/pdf')).toBe(AttachmentFileCategory.Pdf);
  });

  it('should render markdown preview', () => {
    expect(renderMarkdownPreview('**bold**')).toContain('<strong>bold</strong>');
  });

  it('should build comment tree', () => {
    const comments: Comment[] = [
      {
        id: '1',
        taskId: 't',
        userId: 'u',
        authorEmail: 'a@test.com',
        authorFirstName: 'A',
        authorLastName: 'B',
        parentCommentId: null,
        content: 'root',
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        createdAt: '2026-01-01',
        updatedAt: null,
        mentions: [],
        replyCount: 1,
      },
      {
        id: '2',
        taskId: 't',
        userId: 'u',
        authorEmail: 'a@test.com',
        authorFirstName: 'A',
        authorLastName: 'B',
        parentCommentId: '1',
        content: 'reply',
        isEdited: false,
        editedAt: null,
        isDeleted: false,
        createdAt: '2026-01-02',
        updatedAt: null,
        mentions: [],
        replyCount: 0,
      },
    ];

    const tree = buildCommentTree(comments);
    expect(tree.length).toBe(1);
    expect(tree[0].replies.length).toBe(1);
  });
});
