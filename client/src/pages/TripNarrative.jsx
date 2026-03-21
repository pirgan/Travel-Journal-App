import { useEffect, useState } from 'react';
import api from '../api/axios';
import EntryCard from '../components/EntryCard';

export default function TripNarrative() {
  const [entries, setEntries]     = useState([]);
  const [selected, setSelected]   = useState([]);
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  useEffect(() => {
    api.get('/entries').then(({ data }) => setEntries(data));
  }, []);

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const compile = () => {
    setNarrative('');
    setDone(false);
    setLoading(true);

    const token  = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
    const ids    = selected.join(',');

    const es = new EventSource(`${apiUrl}/ai/compile-trip?entryIds=${ids}&token=${token}`);

    es.onmessage = (e) => {
      if (e.data === '[DONE]') { es.close(); setLoading(false); setDone(true); return; }
      const { chunk } = JSON.parse(e.data);
      setNarrative((prev) => prev + chunk);
    };
    es.onerror = () => { es.close(); setLoading(false); };
  };

  const download = () => {
    const blob = new Blob([narrative], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'trip-narrative.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Trip Narrative</h1>
      <p className="text-gray-500 mb-6">Select entries to compile into a cohesive story</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {entries.map((entry) => (
          <div
            key={entry._id}
            onClickCapture={(e) => { e.stopPropagation(); toggle(entry._id); }}
            className={`cursor-pointer rounded-2xl border-2 transition ${selected.includes(entry._id) ? 'border-terracotta' : 'border-transparent'}`}
          >
            <EntryCard entry={entry} />
          </div>
        ))}
      </div>

      <button
        onClick={compile}
        disabled={selected.length === 0 || loading}
        className="bg-terracotta text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition disabled:opacity-40"
      >
        {loading ? 'Compiling…' : `Compile ${selected.length} entries`}
      </button>

      {narrative && (
        <div className="mt-8 bg-white rounded-2xl border border-sand p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl font-semibold text-gray-800">Your Story</h2>
            {done && (
              <button onClick={download} className="text-sm text-terracotta hover:underline">
                Download ↓
              </button>
            )}
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{narrative}</p>
        </div>
      )}
    </div>
  );
}
