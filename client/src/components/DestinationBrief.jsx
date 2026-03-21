import { useState } from 'react';
import api from '../api/axios';

export default function DestinationBrief({ entryId, location, cached }) {
  const [open, setOpen]       = useState(false);
  const [insights, setInsights] = useState(cached ?? null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
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

  return (
    <div className="mt-4 border border-sand rounded-2xl overflow-hidden bg-white">
      <button
        onClick={load}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="font-display font-semibold text-gray-800">Destination Brief</span>
        <span className="text-gray-400 text-lg">{open ? '−' : '+'}</span>
      </button>

      {loading && <p className="px-5 pb-4 text-sm text-gray-400">Loading insights…</p>}

      {open && insights && (
        <div className="px-5 pb-5 space-y-2 text-sm text-gray-700">
          {insights.etiquette && <p><strong>Etiquette:</strong> {insights.etiquette}</p>}
          {insights.currency  && <p><strong>Currency:</strong> {insights.currency}</p>}
          {insights.season    && <p><strong>Best season:</strong> {insights.season}</p>}
          {insights.hiddenGem && <p><strong>Hidden gem:</strong> {insights.hiddenGem}</p>}
          {insights.phrases?.length > 0 && (
            <div>
              <strong>Useful phrases:</strong>
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
