import { HttpClient, HttpContext, HttpEvent } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import { SKIP_LOADING } from '@core/interceptors/loading.interceptor';
import type {
  Attachment,
  AttachmentListQuery,
  PagedResult,
} from '@features/collaboration/models/collaboration.models';

@Injectable({ providedIn: 'root' })
export class AttachmentApiService extends ApiBaseService {
  private readonly rawHttp = inject(HttpClient);

  listByTask(taskId: string, query: AttachmentListQuery = {}): Observable<PagedResult<Attachment>> {
    return this.get<PagedResult<Attachment>>(`/tasks/${taskId}/attachments`, {
      params: this.buildParams(query),
      skipLoading: true,
    });
  }

  getById(id: string): Observable<Attachment> {
    return this.get<Attachment>(`/attachments/${id}`, { skipLoading: true });
  }

  upload(taskId: string, file: File): Observable<HttpEvent<Attachment>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.rawHttp.post<Attachment>(this.buildUrl(`/tasks/${taskId}/attachments`), formData, {
      reportProgress: true,
      observe: 'events',
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

  replace(id: string, file: File): Observable<HttpEvent<Attachment>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.rawHttp.put<Attachment>(this.buildUrl(`/attachments/${id}`), formData, {
      reportProgress: true,
      observe: 'events',
      context: new HttpContext().set(SKIP_LOADING, true),
    });
  }

  remove(id: string): Observable<void> {
    return super.delete(`/attachments/${id}`);
  }

  downloadUrl(attachment: Attachment): string {
    const path = attachment.downloadUrl.startsWith('/api')
      ? attachment.downloadUrl.replace(/^\/api/, '')
      : attachment.downloadUrl;
    return this.buildUrl(path.startsWith('/') ? path.slice(1) : path);
  }

  private buildParams(query: AttachmentListQuery): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params[key] = value as string | number | boolean;
      }
    }
    return params;
  }
}
