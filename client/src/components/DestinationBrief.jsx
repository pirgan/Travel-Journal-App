import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function DestinationBrief({ entryId, location, cached, sidebar = false }) {
  const [open, setOpen]         = useState(false);
  const [insights, setInsights] = useState(cached ?? null);
  const [loading, setLoading]   = useState(false);

  // In sidebar mode, auto-load on mount
  useEffect(() => {
    if (!sidebar) return;
    if (insights) return;
    setLoading(true);
    api.post('/ai/location-insights', { entryId, location })
      .then(({ data }) => setInsights(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sidebar]);

  const load = async () => {
    if (sidebar) return;
    if (insights) return setOpen((o) => !o);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/location-insights', { entryId, location });
      setInsights(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /* ── Sidebar variant ── */
  if (sidebar) {
    return (
      <div className="bg-white rounded-[14px] border border-border-warm shadow-card p-6">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border-warm">
          <div className="w-7 h-7 bg-[#2D6A4F] rounded-md flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="font-display font-semibold text-ink-dark text-base">AI Insights</h3>
        </div>

        {loading && (
          <div className="space-y-2 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-3 bg-border-warm rounded animate-pulse" style={{ width: `${70 + i * 8}%` }} />
            ))}
          </div>
        )}

        {insights && (
          <div className="space-y-4 text-sm">
            {insights.etiquette && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Etiquette</p>
                <p className="text-ink-mid leading-snug">{insights.etiquette}</p>
              </div>
            )}
            {insights.hiddenGem && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Hidden Gem</p>
                <p className="text-ink-mid leading-snug">{insights.hiddenGem}</p>
              </div>
            )}
            {insights.currency && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Currency</p>
                <p className="text-ink-mid">{insights.currency}</p>
              </div>
            )}
            {insights.season && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Best Season</p>
                <p className="text-ink-mid">{insights.season}</p>
              </div>
            )}
            {insights.phrases?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Useful Phrases</p>
                <ul className="space-y-0.5">
                  {insights.phrases.map((p, i) => (
                    <li key={i} className="text-ink-mid">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!loading && !insights && (
          <p className="text-ink-muted text-sm">Could not load insights for this location.</p>
        )}
      </div>
    );
  }

  /* ── Inline collapsible variant ── */
  return (
    <div className="mt-6 border border-border-warm rounded-2xl overflow-hidden bg-white">
      <button
        onClick={load}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-cream transition"
      >
        <span className="font-display font-semibold text-ink-dark">Destination Brief</span>
        <span className="text-ink-muted text-lg">{open ? '−' : '+'}</span>
      </button>

      {loading && <p className="px-5 pb-4 text-sm text-ink-muted">Loading insights…</p>}

      {open && insights && (
        <div className="px-5 pb-5 space-y-2 text-sm text-ink-mid border-t border-border-warm pt-4">
          {insights.etiquette && <p><strong className="text-ink-dark">Etiquette:</strong> {insights.etiquette}</p>}
          {insights.currency  && <p><strong className="text-ink-dark">Currency:</strong> {insights.currency}</p>}
          {insights.season    && <p><strong className="text-ink-dark">Best season:</strong> {insights.season}</p>}
          {insights.hiddenGem && <p><strong className="text-ink-dark">Hidden gem:</strong> {insights.hiddenGem}</p>}
          {insights.phrases?.length > 0 && (
            <div>
              <strong className="text-ink-dark">Useful phrases:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {insights.phrases.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
