import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-brown-dark text-cream mt-auto">
      {/* Pixel art grass/dirt top border */}
      <div className="h-4 bg-gradient-to-b from-green-pale via-green-main to-brown-dark" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/logo.png" 
                alt="The Green Memoir" 
                className="h-12 w-12 object-contain"
              />
              <span className="font-display text-xl text-green-light">
                The Green Memoir
              </span>
            </div>
            <p className="text-cream/80 text-sm leading-relaxed">
              {t('description')}
            </p>
            <p className="text-cream/60 text-xs">
              {t('made_in')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading text-lg text-green-light mb-4">
              {t('links.title')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-cream/80 hover:text-green-light text-sm transition-colors"
                >
                  {t('links.privacy')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-cream/80 hover:text-green-light text-sm transition-colors"
                >
                  {t('links.terms')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-cream/80 hover:text-green-light text-sm transition-colors"
                >
                  {t('links.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-heading text-lg text-green-light mb-4">
              {t('social.title')}
            </h3>
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/share/1GwWUUrYdn/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-cream/10 rounded-full flex items-center justify-center hover:bg-green-main transition-colors"
                aria-label={t('social.facebook')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                </svg>
              </a>
              <a 
                href="https://www.tiktok.com/@the.green.memoir" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-cream/10 rounded-full flex items-center justify-center hover:bg-green-main transition-colors"
                aria-label={t('social.tiktok')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25h-3.29v13.72a2.89 2.89 0 1 1-2.89-2.89c.25 0 .49.03.72.09V10.2a6.18 6.18 0 0 0-.72-.05A6.18 6.18 0 1 0 15.82 16V9.05a8.16 8.16 0 0 0 4.77 1.54V7.3c-.34 0-.68-.21-1-.61z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-cream/20 mt-8 pt-8 text-center">
          <p className="text-cream/60 text-sm">
            © {new Date().getFullYear()} The Green Memoir. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
