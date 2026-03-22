import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { HeroImageCarousel } from '../components/ImageCarousel';
import AIEntryEnhancer from '../components/AIEntryEnhancer';
import DestinationBrief from '../components/DestinationBrief';

export default function EntryDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [entry, setEntry]     = useState(null);
  const [loading, setLoading] = useState(true);

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
  const images = entry.images?.length ? entry.images : [];

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {images.length > 0 ? (
        <HeroImageCarousel images={images} onBack={() => navigate(-1)} />
      ) : (
        <div className="relative w-full h-[min(52vh,440px)] overflow-hidden">
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #2d4a1e 0%, #3D6B4F 100%)' }} />
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 sm:left-8 w-11 h-11 rounded-full bg-white shadow-card flex items-center justify-center text-ink-dark hover:bg-cream transition z-10"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </button>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16 py-10 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
          <div className="lg:col-span-2 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
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

            <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-ink-dark mb-6 leading-tight">
              {entry.title}
            </h1>

            <p className="text-ink-mid text-base leading-prose whitespace-pre-wrap">
              {entry.body}
            </p>

            {isAuthor && (
              <button
                data-testid="delete-entry-btn"
                type="button"
                onClick={handleDelete}
                className="mt-10 inline-flex items-center gap-2 text-[#E53E3E] border border-red-100 bg-[#FFF5F5] px-5 py-2.5 rounded-[10px] text-sm font-medium hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Entry
              </button>
            )}
          </div>

          <aside className="space-y-6 lg:pt-1">
            <DestinationBrief
              entryId={entry._id}
              location={entry.location}
              cached={entry.locationInsights?.etiquette ? entry.locationInsights : null}
              sidebar
            />
            <AIEntryEnhancer originalBody={entry.body} variant="sidebar" />
          </aside>
        </div>
      </div>
    </div>
  );
}
