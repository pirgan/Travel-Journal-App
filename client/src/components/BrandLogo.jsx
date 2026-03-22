/** Wanderlog mark: terracotta square + open book (matches design-reference). */
export function BookIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export default function BrandLogo({ className = '', textClassName = 'font-display text-[22px] font-bold text-ink-dark' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="w-9 h-9 bg-terracotta rounded-[10px] flex items-center justify-center text-white shrink-0">
        <BookIcon className="w-[22px] h-[22px]" />
      </span>
      <span className={textClassName}>Wanderlog</span>
    </span>
  );
}
