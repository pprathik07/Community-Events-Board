'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { cn } from '@/lib/utils';
import { CalendarHeart, LayoutDashboard, LogOut, Menu, Plus, X } from 'lucide-react';
import { useState, useCallback } from 'react';

function Brand({ href = '/', label = 'Events Board' }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label={label}>
      <span className="w-9 h-9 rounded-lg bg-brand-gradient text-white flex items-center justify-center shadow-soft">
        <CalendarHeart className="w-5 h-5" strokeWidth={2.2} />
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">{label}</span>
    </Link>
  );
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, logout } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoggedIn = !!session;
  const isAdmin = session?.role === 'admin';

  const handleLogout = useCallback(async () => {
    setMobileMenuOpen(false);
    await logout();
    router.push('/');
    router.refresh();
  }, [logout, router]);

  // ---- Admin chrome -------------------------------------------------------
  if (pathname.startsWith('/admin')) {
    return (
      <header className="sticky top-0 z-40 bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brand href="/admin" label="Admin console" />
            <span className="hidden sm:inline-flex items-center rounded-full bg-brand/10 text-brand text-[11px] font-semibold px-2 py-0.5 uppercase tracking-wide">
              Staff
            </span>
          </div>
          <nav className="flex items-center gap-1.5">
            <Link
              href="/admin"
              className={cn(
                'inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium transition-colors',
                pathname === '/admin' ? 'bg-brand text-white' : 'text-muted hover:text-ink hover:bg-brand-soft'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </Link>
            <Link
              href="/admin/events/new"
              className={cn(
                'inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium transition-colors',
                pathname === '/admin/events/new' ? 'bg-brand text-white' : 'text-muted hover:text-ink hover:bg-brand-soft'
              )}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add event</span>
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium text-muted hover:text-danger hover:bg-danger/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </nav>
        </div>
      </header>
    );
  }

  // ---- Visitor chrome -----------------------------------------------------
  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Brand />

        <nav className="hidden md:flex items-center gap-7">
          <Link
            href="/"
            className={cn('text-sm font-medium transition-colors', pathname === '/' ? 'text-brand' : 'text-muted hover:text-ink')}
          >
            Events
          </Link>
          {isLoggedIn && !isAdmin && (
            <Link
              href="/feed"
              className={cn('text-sm font-medium transition-colors', pathname === '/feed' ? 'text-brand' : 'text-muted hover:text-ink')}
            >
              My Feed
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="text-sm font-medium text-muted hover:text-ink transition-colors">
                  Admin
                </Link>
              )}
              <span className="max-w-[180px] truncate text-sm text-muted">{session?.email}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-line text-sm font-medium text-ink hover:bg-brand-soft transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-ink transition-colors"
            >
              Log in
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2.5 rounded-lg text-muted hover:text-ink hover:bg-brand-soft transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-surface px-4 py-4 space-y-1">
          <Link
            href="/"
            className={cn('block px-3 h-11 flex items-center rounded-lg text-sm font-medium', pathname === '/' ? 'bg-brand-soft text-brand-ink' : 'text-muted hover:bg-brand-soft')}
            onClick={() => setMobileMenuOpen(false)}
          >
            Events
          </Link>
          {isLoggedIn && !isAdmin && (
            <Link
              href="/feed"
              className={cn('block px-3 h-11 flex items-center rounded-lg text-sm font-medium', pathname === '/feed' ? 'bg-brand-soft text-brand-ink' : 'text-muted hover:bg-brand-soft')}
              onClick={() => setMobileMenuOpen(false)}
            >
              My Feed
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="block px-3 h-11 flex items-center rounded-lg text-sm font-medium text-muted hover:bg-brand-soft"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}

          <div className="border-t border-line my-2" />

          {isLoggedIn ? (
            <>
              <p className="px-3 text-xs text-muted truncate">{session?.email}</p>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 h-11 rounded-lg text-sm font-medium text-danger hover:bg-danger/5"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="block px-3 h-11 flex items-center rounded-lg text-sm font-medium text-brand hover:bg-brand-soft"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
