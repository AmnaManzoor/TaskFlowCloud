import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '@core/config/app-config.token';
import { SKIP_LOADING } from '@core/interceptors/loading.interceptor';

export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  headers?: Record<string, string>;
  skipLoading?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiBaseService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  protected get baseUrl(): string {
    return this.config.apiBaseUrl.replace(/\/$/, '');
  }

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), {
      params: this.toParams(options?.params),
      context: this.buildContext(options),
    });
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body, {
      params: this.toParams(options?.params),
      context: this.buildContext(options),
    });
  }

  put<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body, {
      params: this.toParams(options?.params),
      context: this.buildContext(options),
    });
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.buildUrl(path), body, {
      params: this.toParams(options?.params),
      context: this.buildContext(options),
    });
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path), {
      params: this.toParams(options?.params),
      context: this.buildContext(options),
    });
  }

  private buildContext(options?: ApiRequestOptions): HttpContext | undefined {
    if (!options?.skipLoading) {
      return undefined;
    }

    return new HttpContext().set(SKIP_LOADING, true);
  }

  protected buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private toParams(
    params?: Record<string, string | number | boolean | readonly (string | number | boolean)[]>,
  ): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          httpParams = httpParams.append(key, String(entry));
        });
      } else {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return httpParams;
  }
}
