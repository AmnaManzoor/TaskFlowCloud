import { HttpEventType } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, Subscription, tap } from 'rxjs';
import { extractApiErrorMessage } from '@core/authentication/utils/api-error.util';
import { NotificationService } from '@core/services/notification.service';
import { AttachmentApiService } from '@features/collaboration/services/attachment-api.service';
import { MAX_ATTACHMENT_SIZE_BYTES } from '@features/collaboration/models/collaboration.enums';
import type { Attachment, UploadProgressState } from '@features/collaboration/models/collaboration.models';

@Injectable({ providedIn: 'root' })
export class AttachmentStore {
  private readonly attachmentApi = inject(AttachmentApiService);
  private readonly notification = inject(NotificationService);

  private readonly _taskId = signal<string | null>(null);
  private readonly _items = signal<Attachment[]>([]);
  private readonly _selected = signal<Attachment | null>(null);
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _page = signal(1);
  private readonly _pageSize = signal(20);
  private readonly _totalCount = signal(0);
  private readonly _uploads = signal<Record<string, UploadProgressState>>({});
  private readonly uploadSubscriptions = new Map<string, Subscription>();

  readonly taskId = this._taskId.asReadonly();
  readonly items = this._items.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly error = this._error.asReadonly();
  readonly uploads = this._uploads.asReadonly();
  readonly hasMore = computed(() => this._items().length < this._totalCount());

  loadForTask(taskId: string): void {
    this._taskId.set(taskId);
    this._page.set(1);
    this._items.set([]);
    this.loadAttachments();
  }

  loadAttachments(append = false): void {
    const taskId = this._taskId();
    if (!taskId) return;

    if (append) {
      this._loadingMore.set(true);
    } else {
      this._loading.set(true);
    }
    this._error.set(null);

    this.attachmentApi
      .listByTask(taskId, {
        page: this._page(),
        pageSize: this._pageSize(),
        sortBy: 'createdAt',
        sortDescending: true,
      })
      .pipe(
        tap((result) => {
          this._totalCount.set(result.totalCount);
          this._items.update((current) => (append ? [...current, ...result.items] : result.items));
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to load attachments'));
          return of(null);
        }),
        finalize(() => {
          this._loading.set(false);
          this._loadingMore.set(false);
        }),
      )
      .subscribe();
  }

  loadMore(): void {
    if (!this.hasMore() || this._loadingMore()) return;
    this._page.update((page) => page + 1);
    this.loadAttachments(true);
  }

  select(attachment: Attachment | null): void {
    this._selected.set(attachment);
  }

  uploadFiles(files: File[]): void {
    const taskId = this._taskId();
    if (!taskId) return;

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        this.notification.error(`${file.name} exceeds the 25 MB limit`);
        continue;
      }

      const uploadId = `${file.name}-${file.lastModified}`;
      this._uploads.update((current) => ({
        ...current,
        [uploadId]: { fileName: file.name, progress: 0, status: 'uploading' },
      }));

      const sub = this.attachmentApi.upload(taskId, file).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const progress = Math.round((event.loaded / event.total) * 100);
            this._uploads.update((current) => ({
              ...current,
              [uploadId]: { ...current[uploadId], progress, status: 'uploading' },
            }));
          }

          if (event.type === HttpEventType.Response && event.body) {
            this._items.update((items) => [event.body!, ...items]);
            this._totalCount.update((count) => count + 1);
            this._uploads.update((current) => ({
              ...current,
              [uploadId]: { fileName: file.name, progress: 100, status: 'completed' },
            }));
            this.notification.success(`${file.name} uploaded`);
            this.uploadSubscriptions.delete(uploadId);
          }
        },
        error: (error) => {
          this._uploads.update((current) => ({
            ...current,
            [uploadId]: {
              fileName: file.name,
              progress: current[uploadId]?.progress ?? 0,
              status: 'error',
              error: extractApiErrorMessage(error, 'Upload failed'),
            },
          }));
          this.uploadSubscriptions.delete(uploadId);
        },
      });

      this.uploadSubscriptions.set(uploadId, sub);
    }
  }

  cancelUpload(uploadId: string): void {
    this.uploadSubscriptions.get(uploadId)?.unsubscribe();
    this.uploadSubscriptions.delete(uploadId);
    this._uploads.update((current) => ({
      ...current,
      [uploadId]: { ...current[uploadId], status: 'cancelled' },
    }));
  }

  retryUpload(uploadId: string, file: File): void {
    this._uploads.update((current) => {
      const next = { ...current };
      delete next[uploadId];
      return next;
    });
    this.uploadFiles([file]);
  }

  replace(id: string, file: File): void {
    this.attachmentApi
      .replace(id, file)
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.Response && event.body) {
            this._items.update((items) => items.map((item) => (item.id === id ? event.body! : item)));
            this.notification.success('Attachment updated');
          }
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to update attachment'));
          return of(null);
        }),
      )
      .subscribe();
  }

  delete(id: string): void {
    this.attachmentApi
      .remove(id)
      .pipe(
        tap(() => {
          this._items.update((items) => items.filter((item) => item.id !== id));
          if (this._selected()?.id === id) {
            this._selected.set(null);
          }
          this.notification.success('Attachment deleted');
        }),
        catchError((error) => {
          this._error.set(extractApiErrorMessage(error, 'Failed to delete attachment'));
          return of(null);
        }),
      )
      .subscribe();
  }

  downloadUrl(attachment: Attachment): string {
    return this.attachmentApi.downloadUrl(attachment);
  }

  clear(): void {
    this.uploadSubscriptions.forEach((sub) => sub.unsubscribe());
    this.uploadSubscriptions.clear();
    this._taskId.set(null);
    this._items.set([]);
    this._selected.set(null);
    this._uploads.set({});
    this._error.set(null);
    this._page.set(1);
    this._totalCount.set(0);
  }
}
