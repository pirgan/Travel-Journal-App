import { useState } from 'react';

export default function AIEntryEnhancer({ originalBody, onAccept }) {
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

  return (
    <div className="mt-6 border border-sand rounded-2xl p-5 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-semibold text-gray-800">AI Enhance</h3>
        <button
          onClick={enhance}
          disabled={loading}
          className="bg-terracotta text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-50 hover:opacity-90 transition"
        >
          {loading ? 'Enhancing…' : '✦ Enhance with AI'}
        </button>
      </div>

      {enhanced && (
        <div className="mt-3">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{enhanced}</p>
          {done && (
            <button
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
