import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import EntryCard from '../components/EntryCard';

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]     = useState(params.get('q') ?? '');

  const search = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get('/entries/search', { params: { q } });
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = params.get('q');
    if (q) { setQuery(q); search(q); }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setParams({ q: query });
    search(query);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places, memories…"
          className="flex-1 border border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
        />
        <button
          type="submit"
          className="bg-terracotta text-white px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition"
        >
          Search
        </button>
      </form>

      {params.get('q') && (
        <p className="text-gray-500 mb-4 text-sm">
          {loading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${params.get('q')}"`}
        </p>
      )}

      {results.length === 0 && !loading && params.get('q') && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🧭</p>
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {results.map((entry) => (
          <div key={entry._id} className="break-inside-avoid">
            <EntryCard entry={entry} />
          </div>
        ))}
      </div>
    </div>
  );
}
