import { Link } from 'react-router-dom';

const SENTIMENT = {
  positive: 'bg-forest/10 text-forest',
  neutral:  'bg-ink-muted/10 text-ink-secondary',
  negative: 'bg-red-50 text-red-600',
};

// Renders the image section of an entry card.
// Layout depends on how many images are available (up to 4 shown):
//   0 images → nothing
//   1 image  → single full-width hero
//   2 images → two equal columns side by side
//   3-4 imgs → large primary on the left, 2-3 stacked thumbnails on the right
function ImageCollage({ images, title }) {
  const photos = (images ?? []).slice(0, 4); // cap at 4
  const count  = photos.length;

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div className="overflow-hidden aspect-[16/9]">
        <img
          src={photos[0].url}
          alt={photos[0].altText || title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="flex gap-0.5 aspect-[16/9]">
        {photos.map((img, i) => (
          <div key={i} className="flex-1 overflow-hidden">
            <img src={img.url} alt={img.altText || title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
          </div>
        ))}
      </div>
    );
  }

  // 3 or 4 images: primary large on the left, remaining stacked on the right
  const [primary, ...rest] = photos;
  return (
    <div className="flex gap-0.5 aspect-[16/9]">
      {/* Primary image takes 60% of the width */}
      <div className="w-[60%] overflow-hidden shrink-0">
        <img src={primary.url} alt={primary.altText || title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
      </div>
      {/* Secondary images stacked vertically in the remaining 40% */}
      <div className="flex-1 flex flex-col gap-0.5">
        {rest.map((img, i) => (
          <div key={i} className="flex-1 overflow-hidden">
            <img src={img.url} alt={img.altText || title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EntryCard({ entry }) {
  const { _id, title, location, date, images, sentiment } = entry;
  const sentimentScore = sentiment?.score;

  return (
    <Link to={`/entry/${_id}`} className="block group">
      <article className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <ImageCollage images={images} title={title} />
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
