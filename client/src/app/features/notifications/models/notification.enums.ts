export enum NotificationType {
  TaskAssigned = 0,
  TaskUnassigned = 1,
  TaskUpdated = 2,
  TaskCompleted = 3,
  TaskReopened = 4,
  TaskPriorityChanged = 5,
  TaskDueDateChanged = 6,
  TaskCommentAdded = 7,
  MentionedInComment = 8,
  ProjectCreated = 9,
  ProjectUpdated = 10,
  ProjectArchived = 11,
  ProjectOwnershipTransferred = 12,
  OrganizationInvitation = 13,
  RoleChanged = 14,
  TeamMemberAdded = 15,
  SystemNotification = 16,
}

export enum NotificationReadFilter {
  All = 'all',
  Unread = 'unread',
  Read = 'read',
}

export enum NotificationCategoryFilter {
  All = 'all',
  Mentions = 'mentions',
  Tasks = 'tasks',
  Projects = 'projects',
  Organization = 'organization',
  System = 'system',
}

export enum NotificationSortField {
  CreatedAt = 'createdAt',
  Type = 'type',
}

export enum NotificationPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
}

export enum ActivityScope {
  All = 'all',
  Personal = 'personal',
  Project = 'project',
  Organization = 'organization',
}

export enum ActivityEntityFilter {
  All = 'all',
  Task = 'Task',
  Project = 'Project',
  Organization = 'Organization',
  Comment = 'Comment',
  User = 'User',
}
