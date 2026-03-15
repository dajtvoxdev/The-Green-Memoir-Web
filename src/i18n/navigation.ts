import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './index';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale,
});
