import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import Link from 'next/link';
import './globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Toaster } from '@/components/toaster';
import { CalendarHeart } from 'lucide-react';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Community Events Board',
  description: 'Discover local events near you',
};

function HeaderWrapper() {
  return <Header />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <Providers>
          <Suspense fallback={null}>
            <HeaderWrapper />
          </Suspense>
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
            {children}
          </main>
          <footer className="border-t border-line/70 mt-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <CalendarHeart className="w-3.5 h-3.5" />
                </span>
                <span className="font-medium text-ink">Events Board</span>
              </div>
              <nav className="flex items-center gap-5">
                <Link href="/" className="hover:text-ink transition-colors">
                  Events
                </Link>
                <Link href="/signup" className="hover:text-ink transition-colors">
                  Sign up
                </Link>
                <Link href="/admin/login" className="hover:text-ink transition-colors">
                  Admin
                </Link>
              </nav>
              <p className="text-xs text-muted/80">Made for local communities in India.</p>
            </div>
          </footer>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
