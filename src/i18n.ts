import { getRequestConfig } from 'next-intl/server';

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

export default getRequestConfig(async ({ locale }) => {
  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
