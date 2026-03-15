import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/index';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import '../globals.css';

// Google Fonts
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

// Metadata
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: {
      default: 'The Green Memoir - Game Nông Trại 2D Việt Nam',
      template: '%s | The Green Memoir',
    },
    description: 'Game nông trại 2D với văn hóa Việt Nam. Trồng trọt, khám phá và xây dựng nông trại của riêng bạn.',
    keywords: ['game', 'farming', 'vietnam', '2d', 'pixel art', 'nông trại', 'việt nam'],
    authors: [{ name: 'Moonlit Garden' }],
    openGraph: {
      title: 'The Green Memoir',
      description: 'Ký ức xanh của miền quê Việt Nam',
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
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }
  
  // Enable static rendering
  setRequestLocale(locale);
  
  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${nunito.variable} ${playfair.variable}`}>
      <head>
        {/* Cherry Bomb One for display text */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Cherry+Bomb+One&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen flex flex-col font-body">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1 pt-16">
            {children}
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}