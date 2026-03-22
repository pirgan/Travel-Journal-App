import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import EntryCard from '../components/EntryCard';

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const navigate            = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery]     = useState(params.get('q') ?? '');

  const currentQuery = params.get('q') ?? '';
  const qParam       = params.get('q');

  useEffect(() => {
    if (!qParam?.trim()) {
      setResults([]);
      return;
    }
    setQuery(qParam);
    setLoading(true);
    api.get('/entries/search', { params: { q: qParam.trim() } })
      .then(({ data }) => setResults(data))
      .finally(() => setLoading(false));
  }, [qParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setParams({ q });
  };

  const clearAll = () => {
    setQuery('');
    setParams({});
    setResults([]);
    navigate('/search', { replace: true });
  };

  return (
    <div className="min-h-[70vh] bg-[#FDFBF7]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 py-9">
        {!currentQuery && (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-lg mb-10">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places, memories…"
              autoFocus
              className="flex-1 border border-border-mid rounded-full px-5 py-3 text-sm text-ink-dark placeholder:text-ink-muted bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15"
            />
            <button
              type="submit"
              className="bg-terracotta text-white px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition shadow-btn"
            >
              Search
            </button>
          </form>
        )}

        {loading && <div className="flex justify-center py-20 text-ink-muted">Searching…</div>}

        {currentQuery && !loading && (
          <>
            <h1 data-testid="result-count" className="font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-ink-dark mb-6">
              {results.length} {results.length === 1 ? 'entry' : 'entries'} found for &ldquo;{currentQuery}&rdquo;
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-8">
              <span className="text-sm text-ink-secondary">Filters:</span>
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border border-terracotta/40 bg-terracotta-soft text-terracotta">
                {currentQuery}
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-1 p-0.5 rounded-full hover:bg-white/80"
                  aria-label="Remove filter"
                >
                  ×
                </button>
              </span>
              <button type="button" onClick={clearAll} className="text-sm font-medium text-terracotta hover:underline">
                Clear all
              </button>
            </div>
          </>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {results.map((entry) => (
              <EntryCard key={entry._id} entry={entry} />
            ))}
            {results.length > 0 && results.length < 3 && (
              <div className="rounded-2xl border border-border-warm bg-white flex flex-col items-center justify-center text-center p-8 min-h-[280px] shadow-card">
                <div className="w-14 h-14 rounded-full bg-terracotta-soft flex items-center justify-center text-terracotta text-2xl mb-4">
                  🧭
                </div>
                <p className="font-display font-semibold text-ink-dark mb-2">No more results</p>
                <p className="text-sm text-ink-secondary mb-6 max-w-[220px]">
                  We couldn&apos;t find any more entries matching your filters. Try adjusting your search.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-medium text-terracotta bg-terracotta-soft/80 px-5 py-2 rounded-full hover:bg-terracotta-soft transition"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && results.length === 0 && currentQuery && (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-terracotta-soft flex items-center justify-center text-terracotta text-2xl mb-4">
              🧭
            </div>
            <p className="font-display text-lg font-semibold text-ink-dark mb-1">No results found</p>
            <p className="text-sm text-ink-secondary mb-6 max-w-xs">
              We couldn&apos;t find any entries matching your search. Try adjusting your query.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="text-sm text-terracotta border border-terracotta/30 px-5 py-2 rounded-full hover:bg-terracotta-soft transition"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
