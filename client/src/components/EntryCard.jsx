import { Link } from 'react-router-dom';

const SENTIMENT_COLOURS = {
  positive: 'bg-green-100 text-green-700',
  neutral:  'bg-gray-100 text-gray-600',
  negative: 'bg-red-100 text-red-600',
};

export default function EntryCard({ entry }) {
  const { _id, title, location, date, images, sentiment } = entry;
  const cover = images?.[0]?.url;
  const sentimentScore = sentiment?.score;

  return (
    <Link to={`/entry/${_id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {cover && (
          <img
            src={cover}
            alt={images[0].altText || title}
            className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        )}
        <div className="p-4">
          <h3 className="font-display text-lg font-semibold text-gray-900 line-clamp-2 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">
            {location} · {new Date(date).toLocaleDateString()}
          </p>
          {sentimentScore && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SENTIMENT_COLOURS[sentimentScore]}`}>
              {sentimentScore.charAt(0).toUpperCase() + sentimentScore.slice(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
