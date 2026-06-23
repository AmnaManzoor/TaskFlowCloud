export enum CommentSortOrder {
  NewestFirst = 'newest',
  OldestFirst = 'oldest',
}

export enum AttachmentFileCategory {
  Image = 'image',
  Pdf = 'pdf',
  Word = 'word',
  Excel = 'excel',
  PowerPoint = 'powerpoint',
  Zip = 'zip',
  Text = 'text',
  Json = 'json',
  Csv = 'csv',
  Markdown = 'markdown',
  Other = 'other',
}

export const MAX_COMMENT_LENGTH = 10_000;
export const MAX_ATTACHMENT_SIZE_BYTES = 26_214_400;
