import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AIEntryEnhancer from '../components/AIEntryEnhancer';

export default function EntryDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [entry, setEntry]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [lightbox, setLightbox] = useState(null); // index of open image, or null

  useEffect(() => {
    api.get('/entries')
      .then(({ data }) => {
        const found = data.find((e) => e._id === id);
        if (!found) navigate('/');
        setEntry(found);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/entries/${id}`);
      toast.success('Entry deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-ink-muted">Loading…</div>;
  if (!entry)  return null;

  const isAuthor = user?._id === (entry.author?._id ?? entry.author);
  const images   = entry.images?.length ? entry.images : [];

  const prevImage = () => setLightbox((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setLightbox((i) => (i + 1) % images.length);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Content */}
      <div className="flex-1 flex justify-center px-6 py-10 sm:px-12">
        <div className="w-full max-w-2xl space-y-6">

          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-secondary transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
            Back
          </button>

          {/* Meta row: location + date */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEEBC8] text-[#C05621] px-3 py-1.5 text-xs font-semibold">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {entry.location}
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink-muted text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Title — h1 for correct semantics and test selectors */}
          <h1 className="font-display text-[28px] font-bold text-ink-dark leading-tight">
            {entry.title}
          </h1>

          {/* Journal body — <p> tag required for p.whitespace-pre-wrap test selector */}
          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">Journal Entry</label>
            <p className="w-full border border-border-mid rounded-xl px-4 py-3 text-sm text-ink-dark bg-white whitespace-pre-wrap min-h-[200px] leading-relaxed">
              {entry.body}
            </p>
          </div>

          {/* AI Enhance panel — streams a rewritten version of the body via SSE */}
          <AIEntryEnhancer originalBody={entry.body} />

          {/* Photos grid */}
          {images.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-2">Photos</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="aspect-square rounded-xl overflow-hidden bg-border-warm focus:outline-none focus:ring-2 focus:ring-terracotta"
                  >
                    <img
                      src={img.url}
                      alt={img.altText || `Photo ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Author actions */}
          {isAuthor && (
            <div className="flex justify-end gap-3 pt-2">
              <Link
                to={`/entry/${id}/edit`}
                className="inline-flex items-center gap-2 bg-white border border-border-mid text-ink-secondary px-5 py-2.5 rounded-[10px] text-sm font-medium hover:border-terracotta hover:text-terracotta transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Entry
              </Link>
              <button
                data-testid="delete-entry-btn"
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 text-[#E53E3E] border border-red-100 bg-[#FFF5F5] px-5 py-2.5 rounded-[10px] text-sm font-medium hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 sm:left-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              aria-label="Previous"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightbox].url}
            alt={images[lightbox].altText || `Photo ${lightbox + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 sm:right-8 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightbox + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
