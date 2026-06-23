import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  appName: 'TaskFlow (Dev)',
  apiBaseUrl: '/api',
  apiVersion: 'v1',
  defaultPageSize: 20,
  maxPageSize: 100,
  tokenStorageKey: 'taskflow_access_token',
  refreshTokenStorageKey: 'taskflow_refresh_token',
  accessTokenExpiresAtStorageKey: 'taskflow_access_token_expires_at',
  rememberMeStorageKey: 'taskflow_remember_me',
  themeStorageKey: 'taskflow_theme',
  logLevel: 'debug',
  enableDebugTools: true,
  i18n: {
    defaultLocale: 'en-US',
    supportedLocales: ['en-US'],
  },
};
