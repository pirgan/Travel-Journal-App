import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EntryCard from '../components/EntryCard';
import MoodTimeline from '../components/MoodTimeline';

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/entries')
      .then(({ data }) => setEntries(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-gray-900">Your Journal</h1>
          <p className="text-gray-500 mt-1">{entries.length} entries across the world</p>
        </div>
        <Link
          to="/entry/new"
          className="bg-terracotta text-white px-5 py-2.5 rounded-full font-medium hover:opacity-90 transition"
        >
          + New Entry
        </Link>
      </div>

      <MoodTimeline entries={entries} />

      {entries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No entries yet.</p>
          <Link to="/entry/new" className="text-terracotta mt-2 inline-block hover:underline">
            Write your first entry →
          </Link>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 mt-6 space-y-4">
          {entries.map((entry) => (
            <div key={entry._id} className="break-inside-avoid">
              <EntryCard entry={entry} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
