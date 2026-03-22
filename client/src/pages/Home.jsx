import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EntryCard from '../components/EntryCard';

function countCountries(entries) {
  const regions = new Set();
  for (const e of entries) {
    const loc = (e.location || '').trim();
    if (!loc) continue;
    const parts = loc.split(',').map((s) => s.trim()).filter(Boolean);
    regions.add(parts[parts.length - 1] || loc);
  }
  return regions.size;
}

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const countryCount = useMemo(() => countCountries(entries), [entries]);

  useEffect(() => {
    api.get('/entries')
      .then(({ data }) => setEntries(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20 text-ink-muted">Loading…</div>;

  const subtitle =
    entries.length === 0
      ? 'Start capturing your adventures'
      : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} across ${countryCount} ${countryCount === 1 ? 'country' : 'countries'}`;

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 py-9 lg:py-11">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[clamp(2rem,4vw,2.5rem)] font-bold text-ink-dark leading-tight">
            Your Journal
          </h1>
          <p className="text-ink-secondary text-[15px]">{subtitle}</p>
        </div>
        <Link
          data-testid="new-entry-btn"
          to="/entry/new"
          className="inline-flex items-center justify-center gap-2 bg-terracotta text-white px-6 h-12 rounded-full text-sm font-semibold hover:opacity-90 transition shadow-btn shrink-0 self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Entry
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-24 text-ink-muted rounded-2xl border border-dashed border-border-mid bg-white/50">
          <p className="text-lg font-medium text-ink-secondary mb-2">No entries yet</p>
          <Link to="/entry/new" className="text-terracotta text-sm font-medium hover:underline">
            Write your first entry →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <EntryCard key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
