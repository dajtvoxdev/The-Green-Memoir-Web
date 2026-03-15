import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/index';

// Root page redirects to default locale
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
