import type { CommentSortOrder } from '@features/collaboration/models/collaboration.enums';

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface Mention {
  id: string;
  mentionedUserId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  authorEmail: string;
  authorFirstName: string;
  authorLastName: string;
  parentCommentId: string | null;
  content: string;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string | null;
  mentions: Mention[];
  replyCount: number;
}

export interface CommentThread {
  root: Comment;
  replies: Comment[];
}

export interface Attachment {
  id: string;
  taskId: string;
  uploadedBy: string;
  uploaderEmail: string;
  originalFileName: string;
  fileExtension: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
  mentionedUserIds?: string[];
}

export interface UpdateCommentRequest {
  content: string;
}

export interface ReplyCommentRequest {
  content: string;
  mentionedUserIds?: string[];
}

export interface AddMentionsRequest {
  mentionedUserIds: string[];
}

export interface CommentListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  includeReplies?: boolean;
}

export interface AttachmentListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface ActivityHistoryItem {
  id: string;
  userId: string;
  activityType: string;
  entityType: string;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export interface ActivityListQuery {
  page?: number;
  pageSize?: number;
  entityType?: string;
  entityId?: string;
  sortDescending?: boolean;
}

export interface CommentTreeNode {
  comment: Comment;
  replies: CommentTreeNode[];
  collapsed: boolean;
}

export interface UploadProgressState {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export interface MentionUserOption {
  id: string;
  label: string;
  email: string;
}

export interface CommentEditorDraft {
  content: string;
  mentionedUserIds: string[];
  updatedAt: string;
}

export interface CollaborationViewState {
  sortOrder: CommentSortOrder;
}
