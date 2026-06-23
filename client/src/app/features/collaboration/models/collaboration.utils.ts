import { AttachmentFileCategory } from '@features/collaboration/models/collaboration.enums';
import type { Comment, CommentTreeNode, Mention } from '@features/collaboration/models/collaboration.models';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown']);

export function authorDisplayName(comment: Pick<Comment, 'authorFirstName' | 'authorLastName' | 'authorEmail'>): string {
  const name = `${comment.authorFirstName} ${comment.authorLastName}`.trim();
  return name || comment.authorEmail;
}

export function mentionDisplayName(mention: Mention): string {
  const name = `${mention.firstName} ${mention.lastName}`.trim();
  return name || mention.email;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileCategory(extension: string, contentType: string): AttachmentFileCategory {
  const ext = extension.toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext) || contentType.startsWith('image/')) return AttachmentFileCategory.Image;
  if (ext === '.pdf' || contentType === 'application/pdf') return AttachmentFileCategory.Pdf;
  if (ext === '.doc' || ext === '.docx') return AttachmentFileCategory.Word;
  if (ext === '.xls' || ext === '.xlsx') return AttachmentFileCategory.Excel;
  if (ext === '.ppt' || ext === '.pptx') return AttachmentFileCategory.PowerPoint;
  if (ext === '.zip') return AttachmentFileCategory.Zip;
  if (ext === '.csv') return AttachmentFileCategory.Csv;
  if (ext === '.json' || contentType === 'application/json') return AttachmentFileCategory.Json;
  if (MARKDOWN_EXTENSIONS.has(ext)) return AttachmentFileCategory.Markdown;
  if (ext === '.txt' || contentType.startsWith('text/')) return AttachmentFileCategory.Text;
  return AttachmentFileCategory.Other;
}

export function fileIcon(category: AttachmentFileCategory): string {
  switch (category) {
    case AttachmentFileCategory.Image:
      return 'image';
    case AttachmentFileCategory.Pdf:
      return 'picture_as_pdf';
    case AttachmentFileCategory.Word:
      return 'description';
    case AttachmentFileCategory.Excel:
      return 'table_chart';
    case AttachmentFileCategory.PowerPoint:
      return 'slideshow';
    case AttachmentFileCategory.Zip:
      return 'folder_zip';
    case AttachmentFileCategory.Json:
      return 'data_object';
    case AttachmentFileCategory.Csv:
      return 'grid_on';
    case AttachmentFileCategory.Markdown:
      return 'article';
    case AttachmentFileCategory.Text:
      return 'notes';
    default:
      return 'insert_drive_file';
  }
}

export function isPreviewable(category: AttachmentFileCategory): boolean {
  return (
    category === AttachmentFileCategory.Image ||
    category === AttachmentFileCategory.Pdf ||
    category === AttachmentFileCategory.Text ||
    category === AttachmentFileCategory.Markdown ||
    category === AttachmentFileCategory.Json
  );
}

export function renderMarkdownPreview(content: string): string {
  let html = escapeHtml(content);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

export function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  const byParent = new Map<string | null, Comment[]>();
  for (const comment of comments) {
    const key = comment.parentCommentId;
    const bucket = byParent.get(key) ?? [];
    bucket.push(comment);
    byParent.set(key, bucket);
  }

  const sortFn = (a: Comment, b: Comment) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

  function buildLevel(parentId: string | null): CommentTreeNode[] {
    const items = (byParent.get(parentId) ?? []).sort(sortFn);
    return items.map((comment) => ({
      comment,
      replies: buildLevel(comment.id),
      collapsed: false,
    }));
  }

  return buildLevel(null);
}

export function flattenCommentTree(nodes: CommentTreeNode[]): Comment[] {
  const result: Comment[] = [];
  for (const node of nodes) {
    result.push(node.comment);
    result.push(...flattenCommentTree(node.replies));
  }
  return result;
}

export function activityIcon(activityType: string): string {
  const normalized = activityType.toLowerCase();
  if (normalized.includes('comment')) return 'chat_bubble_outline';
  if (normalized.includes('attach')) return 'attach_file';
  if (normalized.includes('mention')) return 'alternate_email';
  return 'history';
}

export function isCollaborationActivity(activityType: string): boolean {
  const normalized = activityType.toLowerCase();
  return normalized.includes('comment') || normalized.includes('attach') || normalized.includes('mention');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function draftStorageKey(taskId: string, parentCommentId?: string | null): string {
  return `taskflow:comment-draft:${taskId}:${parentCommentId ?? 'root'}`;
}
