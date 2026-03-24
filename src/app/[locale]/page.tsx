import { getTranslations } from 'next-intl/server';
import Script from 'next/script';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });

  return {
    title: t('tagline'),
    description: t('subtitle'),
  };
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tHero = await getTranslations({ locale, namespace: 'hero' });
  const tFeatures = await getTranslations({ locale, namespace: 'features' });
  const tLanding = await getTranslations({ locale, namespace: 'landing' });
  const tPricing = await getTranslations({ locale, namespace: 'pricing' });

  const featureItems = [
    { icon: '🌾', title: tFeatures('farming.title'), desc: tFeatures('farming.desc') },
    { icon: '🇻🇳', title: tFeatures('culture.title'), desc: tFeatures('culture.desc') },
    { icon: '👨‍🌾', title: tFeatures('character.title'), desc: tFeatures('character.desc') },
    { icon: '🌅', title: tFeatures('daynight.title'), desc: tFeatures('daynight.desc') },
    { icon: '💰', title: tFeatures('economy.title'), desc: tFeatures('economy.desc') },
    { icon: '☁️', title: tFeatures('cloudsave.title'), desc: tFeatures('cloudsave.desc') },
  ];

  const roadmapItems = [
    { date: 'Q1 2026', version: 'v0.1.0', title: tLanding('timeline.launch'), status: 'done' },
    { date: 'Q2 2026', version: 'v0.2.0', title: tLanding('timeline.crops'), status: 'current' },
    { date: 'Q3 2026', version: 'v0.3.0', title: tLanding('timeline.coop'), status: 'planned' },
    { date: 'Q4 2026', version: 'v1.0.0', title: tLanding('timeline.release'), status: 'planned' },
  ] as const;

  const minimumSpecs = [
    ['OS', 'Windows 10 64-bit'],
    ['CPU', 'Intel Core i3-2100'],
    ['RAM', '4 GB'],
    ['GPU', 'NVIDIA GTX 660'],
    ['Storage', '1 GB'],
  ];

  const recommendedSpecs = [
    ['OS', 'Windows 11 64-bit'],
    ['CPU', 'Intel Core i5-6600'],
    ['RAM', '8 GB'],
    ['GPU', 'NVIDIA GTX 1060'],
    ['Storage', '1 GB SSD'],
  ];

  return (
    <div className="flex flex-col">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-green-pale">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232D5A27\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="absolute h-4 w-4 animate-float rounded-full bg-green-light opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="mb-8 animate-glow">
            <img
              src="/images/logo.png"
              alt="The Green Memoir"
              className="mx-auto h-48 w-48 object-contain md:h-72 md:w-72"
            />
          </div>

          <h1 className="mb-4 font-display text-4xl text-green-dark md:text-6xl lg:text-7xl">
            {tHero('tagline')}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl font-body text-lg text-brown-dark md:text-xl">
            {tHero('subtitle')}
          </p>

          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/purchase" className="btn-primary text-lg">
              {tHero('cta_primary')}
            </Link>
            <a href="#trailer" className="btn-secondary text-lg">
              {tHero('cta_secondary')}
            </a>
          </div>

          <p className="text-sm text-brown-dark/70">{tHero('platform')}</p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce transform">
          <svg className="h-6 w-6 text-green-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <section id="trailer" className="bg-cream-dark py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <blockquote
              className="tiktok-embed"
              cite="https://www.tiktok.com/@the.green.memoir/video/7615870408457342228"
              data-video-id="7615870408457342228"
              style={{ maxWidth: 605, minWidth: 325, width: '100%' }}
            >
              <section>
                <a target="_blank" title="@the.green.memoir" href="https://www.tiktok.com/@the.green.memoir?refer=embed">
                  @the.green.memoir
                </a>
              </section>
            </blockquote>

            <p className="mt-6 text-center text-lg text-brown-dark">{tLanding('trailerDescription')}</p>
          </div>
        </div>
      </section>

      <section className="bg-green-pale py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-display text-3xl text-green-dark md:text-4xl">
            {tLanding('screenshots')}
          </h2>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="group relative aspect-video overflow-hidden border-4 border-brown-dark bg-brown-light"
              >
                <img
                  src={`/images/screenshot-${index}.png`}
                  alt={`Screenshot ${index}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-cream py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center font-display text-3xl text-green-dark md:text-4xl">
            {tFeatures('title')}
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-brown-dark">
            {tLanding('featuresSubtitle')}
          </p>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((feature) => (
              <div key={feature.title} className="card bg-white p-6 text-center transition-shadow hover:shadow-lg">
                <div className="mb-4 text-5xl">{feature.icon}</div>
                <h3 className="mb-2 font-heading text-xl text-green-dark">{feature.title}</h3>
                <p className="text-brown-dark/80">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream-dark py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-display text-3xl text-green-dark md:text-4xl">
            {tLanding('systemRequirements')}
          </h2>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            <div className="card bg-white p-6">
              <h3 className="mb-4 text-center font-heading text-2xl text-green-dark">{tLanding('minimum')}</h3>
              <ul className="space-y-3 text-brown-dark">
                {minimumSpecs.map(([label, value], index) => (
                  <li key={label} className={`flex justify-between ${index < minimumSpecs.length - 1 ? 'border-b border-border pb-2' : ''}`}>
                    <span>{label}</span>
                    <span className="font-medium">{value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card border-green-main bg-white p-6">
              <h3 className="mb-4 text-center font-heading text-2xl text-green-dark">{tLanding('recommended')}</h3>
              <ul className="space-y-3 text-brown-dark">
                {recommendedSpecs.map(([label, value], index) => (
                  <li key={label} className={`flex justify-between ${index < recommendedSpecs.length - 1 ? 'border-b border-border pb-2' : ''}`}>
                    <span>{label}</span>
                    <span className="font-medium">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-green-pale py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-display text-3xl text-green-dark md:text-4xl">
            {tLanding('roadmap')}
          </h2>

          <div className="relative mx-auto max-w-3xl">
            <div className="absolute left-1/2 h-full w-1 -translate-x-1/2 transform bg-green-main" />

            {roadmapItems.map((item, index) => (
              <div
                key={`${item.date}-${item.version}`}
                className={`relative mb-8 flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                  <div className="card inline-block bg-white p-4">
                    <span className="text-sm font-medium text-green-main">{item.date}</span>
                    <h3 className="font-heading text-lg text-green-dark">{item.title}</h3>
                    <span className="text-xs text-brown-dark/60">{item.version}</span>
                  </div>
                </div>

                <div
                  className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 transform rounded-full border-2 border-brown-dark ${
                    item.status === 'done'
                      ? 'bg-green-dark'
                      : item.status === 'current'
                        ? 'animate-pulse bg-green-main'
                        : 'bg-cream'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="container mx-auto px-4">
          <div className="card mx-auto max-w-2xl bg-white p-8 text-center">
            <img src="/images/logo.png" alt="The Green Memoir" className="mx-auto mb-6 h-24 w-24" />
            <h2 className="mb-2 font-display text-3xl text-green-dark">{tLanding('ctaTitle')}</h2>
            <p className="mb-6 text-4xl font-bold text-gold">{tPricing('price')}</p>
            <Link href="/purchase" className="btn-primary inline-block text-lg">
              {tPricing('cta')}
            </Link>
            <div className="mt-6 flex justify-center gap-6 text-sm text-brown-dark/70">
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-main" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {tPricing('trust.secure')}
              </span>
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-main" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {tPricing('trust.updates')}
              </span>
            </div>
          </div>
        </div>
      </section>

      <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </div>
  );
}
