import { useState } from 'react';

export default function AIEntryEnhancer({ originalBody, onAccept, variant = 'default' }) {
  const [enhanced, setEnhanced] = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const enhance = () => {
    setEnhanced('');
    setDone(false);
    setLoading(true);

    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

    const es = new EventSource(
      `${apiUrl}/ai/enhance-entry?body=${encodeURIComponent(originalBody)}&token=${token}`
    );

    es.onmessage = (e) => {
      if (e.data === '[DONE]') {
        es.close();
        setLoading(false);
        setDone(true);
        return;
      }
      const { chunk } = JSON.parse(e.data);
      setEnhanced((prev) => prev + chunk);
    };

    es.onerror = () => {
      es.close();
      setLoading(false);
    };
  };

  const header = (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-7 h-7 bg-[#2D6A4F] rounded-md flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <h3 className="font-display font-semibold text-ink-dark text-base">AI Enhance</h3>
    </div>
  );

  if (variant === 'sidebar') {
    return (
      <div className="bg-white rounded-[14px] border border-border-warm shadow-card p-6">
        {header}
        <div className="border-t border-border-warm pt-4 mt-3">
          <div className="text-xs text-ink-secondary mb-3 leading-snug">
            Rewrite your entry with richer prose while keeping your voice.
          </div>
          <button
            type="button"
            onClick={enhance}
            disabled={loading}
            className="w-full bg-terracotta text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition shadow-btn"
          >
            {loading ? 'Enhancing…' : '✦ Enhance with AI'}
          </button>
          {enhanced && (
            <div className="mt-4">
              <p className="text-ink-mid text-sm leading-relaxed whitespace-pre-wrap border-t border-border-warm pt-4">{enhanced}</p>
              {done && (
                <button
                  type="button"
                  onClick={() => onAccept?.(enhanced)}
                  className="mt-3 bg-forest text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition"
                >
                  Accept
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-border-warm rounded-2xl p-5 bg-white shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-semibold text-ink-dark">AI Enhance</h3>
        <button
          type="button"
          onClick={enhance}
          disabled={loading}
          className="bg-terracotta text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? 'Enhancing…' : '✦ Enhance with AI'}
        </button>
      </div>

      {enhanced && (
        <div className="mt-3">
          <p className="text-ink-mid leading-relaxed whitespace-pre-wrap text-sm">{enhanced}</p>
          {done && (
            <button
              type="button"
              onClick={() => onAccept?.(enhanced)}
              className="mt-3 bg-forest text-white px-4 py-1.5 rounded-full text-sm font-medium hover:opacity-90 transition"
            >
              Accept
            </button>
          )}
        </div>
      )}
    </div>
  );
}
