import { useState } from 'react';

/** Full-bleed hero with back control + pill/dot indicators (design-reference web-s3). */
export function HeroImageCarousel({ images = [], onBack, className = '' }) {
  const [current, setCurrent] = useState(0);

  if (!images.length) return null;

  return (
    <div className={`relative w-full h-[min(52vh,440px)] overflow-hidden bg-ink-dark/10 ${className}`}>
      <img
        src={images[current].url}
        alt={images[current].altText || `Photo ${current + 1}`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-dark/35 via-transparent to-ink-dark/20 pointer-events-none" />

      <button
        type="button"
        onClick={onBack}
        className="absolute top-6 left-6 sm:left-8 w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center text-ink-dark hover:bg-cream transition z-10"
        aria-label="Go back"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
      </button>

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 items-center z-10">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === current ? 'h-2 w-8 bg-white' : 'h-2 w-2 bg-white/55 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ImageCarousel({ images = [] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div className="relative w-full h-72 md:h-96 bg-gray-100 rounded-2xl overflow-hidden">
      <img
        src={images[current].url}
        alt={images[current].altText || `Photo ${current + 1}`}
        className="w-full h-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/60 transition"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-black/60 transition"
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition ${i === current ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}

      {images[current].caption && (
        <p className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-sm px-4 py-2 text-center">
          {images[current].caption}
        </p>
      )}
    </div>
  );
}
