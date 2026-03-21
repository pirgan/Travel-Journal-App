const SCORE_Y = { positive: 20, neutral: 60, negative: 100 };
const SCORE_COLOUR = { positive: '#3D6B4F', neutral: '#C0622A', negative: '#e53e3e' };

export default function MoodTimeline({ entries = [] }) {
  const filtered = entries.filter((e) => e.sentiment?.score);
  if (filtered.length < 2) return null;

  const width  = 600;
  const height = 120;
  const step   = width / (filtered.length - 1);

  const points = filtered.map((e, i) => ({
    x: i * step,
    y: SCORE_Y[e.sentiment.score],
    score: e.sentiment.score,
    title: e.title,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className="mt-6 bg-white rounded-2xl p-5 border border-sand">
      <h3 className="font-display text-lg font-semibold text-gray-800 mb-4">Mood Timeline</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 120 }}>
        <path d={pathD} fill="none" stroke="#E5D5BE" strokeWidth={2} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={6} fill={SCORE_COLOUR[p.score]} />
            <title>{p.title}</title>
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        {filtered.map((e, i) => (
          <span key={i} className="truncate max-w-[80px] text-center">{e.location}</span>
        ))}
      </div>
    </div>
  );
}
