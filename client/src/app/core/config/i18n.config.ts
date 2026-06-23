/** Placeholder for future i18n configuration (e.g. @angular/localize). */
export const I18N_CONFIG = {
  defaultLocale: 'en-US',
  supportedLocales: ['en-US'] as const,
};

export type SupportedLocale = (typeof I18N_CONFIG.supportedLocales)[number];
