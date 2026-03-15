import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/index';

// Root layout redirects to default locale
export default function RootLayout() {
  redirect(`/${defaultLocale}`);
}