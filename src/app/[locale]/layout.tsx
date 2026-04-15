import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/index';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import { AuthProvider } from '@/contexts/AuthContext';
import '../globals.css';

import { Nunito, Playfair_Display } from 'next/font/google';

const nunito = Nunito({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-nunito',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-playfair',
  display: 'swap',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'layoutMeta' });
  const keywords =
    locale === 'vi'
      ? ['game', 'nông trại', 'việt nam', '2d', 'pixel art']
      : ['game', 'farming', 'vietnam', '2d', 'pixel art'];

  return {
    title: {
      default: t('defaultTitle'),
      template: '%s | The Green Memoir',
    },
    description: t('description'),
    keywords,
    authors: [{ name: 'Moonlit Garden' }],
    openGraph: {
      title: 'The Green Memoir',
      description: t('openGraphDescription'),
      images: ['/images/og-image.png'],
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${nunito.variable} ${playfair.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cherry+Bomb+One&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col font-body">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <PageViewTracker />
            <Header />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
