import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { APP_CONFIG } from '@core/config/app-config.token';
import { environment } from '@env/environment';
import { AppPreloadingStrategy } from '@core/config/app-preloading.strategy';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { jwtInterceptor } from '@core/interceptors/jwt.interceptor';
import { loadingInterceptor } from '@core/interceptors/loading.interceptor';
import { GlobalErrorHandler } from '@core/error-handling/global-error-handler';
import { AuthService } from '@core/authentication/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { AppStore } from '@core/stores/app.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withPreloading(AppPreloadingStrategy),
      withComponentInputBinding(),
    ),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([loadingInterceptor, authInterceptor, jwtInterceptor, errorInterceptor]),
    ),
    { provide: APP_CONFIG, useValue: environment },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideAppInitializer(() => {
      inject(ThemeService).initialize();

      const authService = inject(AuthService);
      const appStore = inject(AppStore);

      authService.initializeFromStorage();
      appStore.markInitialized();

      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => appStore.setOnline(true));
        window.addEventListener('offline', () => appStore.setOnline(false));
      }
    }),
  ],
};
