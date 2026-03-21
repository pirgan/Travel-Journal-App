import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ImageCarousel from '../components/ImageCarousel';
import AIEntryEnhancer from '../components/AIEntryEnhancer';
import DestinationBrief from '../components/DestinationBrief';

export default function EntryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [entry, setEntry]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/entries`)
      .then(({ data }) => {
        const found = data.find((e) => e._id === id);
        if (!found) navigate('/');
        setEntry(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Loading…</div>;
  if (!entry)  return null;

  const isAuthor = user?._id === (entry.author?._id ?? entry.author);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 mb-4 text-sm">
        ← Back
      </button>

      <ImageCarousel images={entry.images} />

      <div className="mt-6">
        <div className="flex flex-wrap gap-2 items-center mb-2 text-sm text-gray-500">
          {entry.sentiment?.score && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
              {entry.sentiment.score}
            </span>
          )}
          <span>📅 {new Date(entry.date).toLocaleDateString()}</span>
          <span>📍 {entry.location}</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-gray-900 mb-4">{entry.title}</h1>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.body}</p>
      </div>

      <DestinationBrief
        entryId={entry._id}
        location={entry.location}
        cached={entry.locationInsights?.etiquette ? entry.locationInsights : null}
      />

      <AIEntryEnhancer originalBody={entry.body} />

      {isAuthor && (
        <button
          data-testid="delete-entry-btn"
          onClick={handleDelete}
          className="mt-8 bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition"
        >
          Delete Entry
        </button>
      )}
    </div>
  );
}
