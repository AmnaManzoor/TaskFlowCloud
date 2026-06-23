export interface Environment {
  production: boolean;
  appName: string;
  apiBaseUrl: string;
  apiVersion: string;
  defaultPageSize: number;
  maxPageSize: number;
  tokenStorageKey: string;
  refreshTokenStorageKey: string;
  accessTokenExpiresAtStorageKey: string;
  rememberMeStorageKey: string;
  themeStorageKey: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableDebugTools: boolean;
  i18n: {
    defaultLocale: string;
    supportedLocales: readonly string[];
  };
}
