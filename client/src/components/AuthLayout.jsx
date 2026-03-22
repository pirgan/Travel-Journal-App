import { Link } from 'react-router-dom';
import { BookIcon } from './BrandLogo';

/** Left panel photography + quote — matches design-reference web-s1. */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1600&q=80';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 max-w-[640px] shrink-0 flex-col justify-between p-12 relative overflow-hidden bg-ink-dark"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(28,23,20,0.15) 0%, rgba(28,23,20,0.65) 100%), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="w-9 h-9 bg-terracotta rounded-[10px] flex items-center justify-center text-white shrink-0">
              <BookIcon className="w-[22px] h-[22px]" />
            </span>
            <span className="font-display text-xl font-bold text-white">Wanderlog</span>
          </Link>
          <p className="text-white/75 text-sm mt-2 font-body">Your stories, beautifully told.</p>
        </div>
        <div className="relative z-10">
          <p className="text-white/90 text-lg italic leading-relaxed font-display">
            &ldquo;The world is a book, and those who do not travel read only one page.&rdquo;
          </p>
          <p className="text-white/55 text-sm mt-4 font-body">&mdash; Saint Augustine</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#FDFBFA] px-6 py-12">
        {children}
      </div>
    </div>
  );
}
