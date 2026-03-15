'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface HeaderProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export default function Header({ isLoggedIn = false, isAdmin = false, onLogout }: HeaderProps) {
  const t = useTranslations('nav');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-cream/90 backdrop-blur-sm border-b-2 border-border">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img 
            src="/images/logo.png" 
            alt="The Green Memoir" 
            className="h-10 w-10 object-contain"
          />
          <span className="font-display text-xl text-green-dark hidden sm:block">
            The Green Memoir
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-brown-dark hover:text-green-main font-medium transition-colors">
            {t('home')}
          </Link>
          <Link href="/#features" className="text-brown-dark hover:text-green-main font-medium transition-colors">
            {t('features')}
          </Link>
          <Link href="/purchase" className="text-brown-dark hover:text-green-main font-medium transition-colors">
            {t('purchase')}
          </Link>
          <Link href="/download" className="text-brown-dark hover:text-green-main font-medium transition-colors">
            {t('download')}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <select 
            className="bg-transparent border-2 border-border px-2 py-1 text-sm text-brown-dark focus:outline-none focus:border-green-main"
            defaultValue="vi"
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>

          {/* Auth buttons */}
          {isLoggedIn ? (
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/profile" 
                className="w-8 h-8 bg-green-dark rounded-full flex items-center justify-center text-white font-bold"
              >
                U
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin/dashboard"
                  className="text-brown-dark hover:text-green-main text-sm font-medium"
                >
                  {t('admin')}
                </Link>
              )}
              <button 
                onClick={onLogout}
                className="text-brown-dark hover:text-red-600 text-sm font-medium"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link 
                href="/login" 
                className="text-brown-dark hover:text-green-main font-medium transition-colors"
              >
                {t('login')}
              </Link>
              <Link 
                href="/register" 
                className="btn-primary text-sm py-2 px-4"
              >
                {t('register')}
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-brown-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-cream border-b-2 border-border shadow-lg">
          <nav className="flex flex-col p-4 gap-3">
            <Link 
              href="/" 
              className="text-brown-dark hover:text-green-main font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('home')}
            </Link>
            <Link 
              href="/#features" 
              className="text-brown-dark hover:text-green-main font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('features')}
            </Link>
            <Link 
              href="/purchase" 
              className="text-brown-dark hover:text-green-main font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('purchase')}
            </Link>
            <Link 
              href="/download" 
              className="text-brown-dark hover:text-green-main font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('download')}
            </Link>
            <hr className="border-border" />
            {isLoggedIn ? (
              <>
                <Link 
                  href="/profile" 
                  className="text-brown-dark hover:text-green-main font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('profile')}
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin/dashboard" 
                    className="text-brown-dark hover:text-green-main font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('admin')}
                  </Link>
                )}
                <button 
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-red-600 font-medium py-2"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-brown-dark hover:text-green-main font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link 
                  href="/register" 
                  className="btn-primary text-center py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}