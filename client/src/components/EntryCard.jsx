import { Link } from 'react-router-dom';

const SENTIMENT = {
  positive: 'bg-forest/10 text-forest',
  neutral:  'bg-ink-muted/10 text-ink-secondary',
  negative: 'bg-red-50 text-red-600',
};

export default function EntryCard({ entry }) {
  const { _id, title, location, date, images, sentiment } = entry;
  const cover          = images?.[0]?.url;
  const sentimentScore = sentiment?.score;

  return (
    <Link to={`/entry/${_id}`} className="block group">
      <article className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300">
        {cover && (
          <div className="overflow-hidden aspect-[16/9]">
            <img
              src={cover}
              alt={images[0].altText || title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold text-ink-dark mb-2 line-clamp-2 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-ink-secondary flex-wrap">
            <svg className="w-3.5 h-3.5 text-terracotta shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>{location}</span>
            <span className="text-border-light select-none">·</span>
            <span className="text-ink-muted text-xs sm:text-sm">
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {sentimentScore && (
              <span className={`ml-auto text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${SENTIMENT[sentimentScore]}`}>
                {sentimentScore}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
