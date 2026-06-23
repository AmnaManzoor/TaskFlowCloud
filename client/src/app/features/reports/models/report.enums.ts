export enum TaskType {
  Feature = 0,
  Bug = 1,
  Improvement = 2,
  Epic = 3,
  Story = 4,
  Spike = 5,
}

export enum ReportType {
  Dashboard = 'dashboard',
  Tasks = 'tasks',
  Projects = 'projects',
  Organizations = 'organizations',
  Users = 'users',
  Workload = 'workload',
  Productivity = 'productivity',
  Completion = 'completion',
  Overdue = 'overdue',
  Priority = 'priority',
  Status = 'status',
  Activity = 'activity',
  Audit = 'audit',
}

export enum ExportFormat {
  Csv = 'csv',
  Excel = 'excel',
  Pdf = 'pdf',
}

export enum ExportStatus {
  Idle = 'idle',
  Preparing = 'preparing',
  Downloading = 'downloading',
  Complete = 'complete',
  Error = 'error',
}

export enum DateRangePreset {
  All = 'all',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
  Custom = 'custom',
}
