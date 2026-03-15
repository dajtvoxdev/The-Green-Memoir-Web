// Define supported locales
export const locales = ['vi', 'en'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'vi';

// Locale names for display
export const localeNames: Record<Locale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};
