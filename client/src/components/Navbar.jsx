import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const { pathname }   = useLocation();
  const [searchParams] = useSearchParams();
  const [q, setQ]      = useState('');

  useEffect(() => {
    if (pathname === '/search') setQ(searchParams.get('q') ?? '');
    else setQ('');
  }, [pathname, searchParams]);

  const submitSearch = (e) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const clearSearch = () => {
    setQ('');
    if (pathname === '/search') navigate('/search', { replace: true });
  };

  return (
    <nav className="bg-white border-b border-border-warm px-6 sm:px-10 lg:px-12 h-[72px] flex items-center justify-between gap-4 sticky top-0 z-50">
      <Link to="/" className="shrink-0">
        <BrandLogo />
      </Link>

      <form
        onSubmit={submitSearch}
        className="flex-1 flex justify-center max-w-2xl min-w-0 mx-4"
      >
        <div className="relative w-full flex items-center gap-2 rounded-full bg-terracotta-soft/80 border border-border-mid h-11 px-4 focus-within:border-terracotta/50 focus-within:ring-2 focus-within:ring-terracotta/10 transition">
          <svg className="w-4 h-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search places, memories..."
            className="flex-1 min-w-0 bg-transparent text-sm text-ink-dark placeholder:text-ink-muted focus:outline-none"
            aria-label="Search journal entries"
          />
          {q && (
            <button
              type="button"
              onClick={clearSearch}
              className="shrink-0 p-1 rounded-full text-ink-muted hover:text-ink-secondary hover:bg-white/80 transition"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      <div className="flex items-center gap-4 shrink-0">
        {user ? (
          <>
            <button type="button" className="text-ink-secondary hover:text-ink-mid transition p-1" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <Link
              to="/profile"
              className="w-10 h-10 rounded-full bg-terracotta text-white flex items-center justify-center text-sm font-semibold hover:opacity-90 transition"
            >
              {user.name?.[0]?.toUpperCase()}
            </Link>
          </>
        ) : (
          <Link to="/login" className="text-sm text-terracotta font-medium hover:underline">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
