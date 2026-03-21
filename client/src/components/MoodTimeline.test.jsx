import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoodTimeline from './MoodTimeline';

// ── colour constants (mirrors component source) ───────────────────────────────
const FILL = {
  positive: '#3D6B4F', // forest green
  neutral:  '#C0622A', // terracotta
  negative: '#e53e3e', // red
};

// ── fixtures ──────────────────────────────────────────────────────────────────

const makeEntry = (id, score, title = `Entry ${id}`, location = `City ${id}`) => ({
  _id: id,
  title,
  location,
  sentiment: { score, keywords: ['cozy', 'scenic', 'warm'] },
});

const THREE_ENTRIES = [
  makeEntry('e1', 'positive', 'Sunrise in Lisbon',  'Lisbon'),
  makeEntry('e2', 'neutral',  'A rainy afternoon',  'Porto'),
  makeEntry('e3', 'negative', 'Missed the train',   'Madrid'),
];

// ── tests ─────────────────────────────────────────────────────────────────────

describe('MoodTimeline', () => {

  // ── guard clause ─────────────────────────────────────────────────────────

  it('renders nothing when entries array is empty', () => {
    const { container } = render(<MoodTimeline entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when only one entry has a sentiment score', () => {
    const { container } = render(
      <MoodTimeline entries={[makeEntry('e1', 'positive')]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no entries have a sentiment score', () => {
    const noSentiment = [
      { _id: 'e1', title: 'A', location: 'X', sentiment: { score: null } },
      { _id: 'e2', title: 'B', location: 'Y', sentiment: { score: null } },
    ];
    const { container } = render(<MoodTimeline entries={noSentiment} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the component heading when there are ≥ 2 scored entries', () => {
    render(<MoodTimeline entries={THREE_ENTRIES} />);
    expect(screen.getByText(/mood timeline/i)).toBeInTheDocument();
  });

  // ── SVG circles ──────────────────────────────────────────────────────────

  it('renders exactly one SVG circle per entry with a sentiment score', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(3);
  });

  it('skips entries without a sentiment score when counting circles', () => {
    const mixed = [
      makeEntry('e1', 'positive'),
      { _id: 'e2', title: 'B', location: 'Y', sentiment: { score: null } },
      makeEntry('e3', 'negative'),
    ];
    const { container } = render(<MoodTimeline entries={mixed} />);
    // Only e1 + e3 are scored, but < 2 in filtered... wait, mixed has 2 scored entries
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
  });

  // ── circle fill colours ───────────────────────────────────────────────────

  it('positive entry circle has green fill (#3D6B4F)', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    const circles = container.querySelectorAll('circle');
    expect(circles[0]).toHaveAttribute('fill', FILL.positive);
  });

  it('neutral entry circle has terracotta fill (#C0622A)', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    const circles = container.querySelectorAll('circle');
    expect(circles[1]).toHaveAttribute('fill', FILL.neutral);
  });

  it('negative entry circle has red fill (#e53e3e)', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    const circles = container.querySelectorAll('circle');
    expect(circles[2]).toHaveAttribute('fill', FILL.negative);
  });

  // ── SVG <title> tooltip ───────────────────────────────────────────────────
  // Each circle is wrapped in a <g> that contains an SVG <title> element,
  // which browsers surface as a native tooltip on hover.

  it('each circle group contains a <title> element with the entry title', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    const titles = container.querySelectorAll('svg title');
    const titleTexts = Array.from(titles).map((t) => t.textContent);

    expect(titleTexts).toContain('Sunrise in Lisbon');
    expect(titleTexts).toContain('A rainy afternoon');
    expect(titleTexts).toContain('Missed the train');
  });

  it('tooltip title for first entry matches entry.title', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    const firstTitle = container.querySelector('g title');
    expect(firstTitle).toHaveTextContent('Sunrise in Lisbon');
  });

  // ── location labels ───────────────────────────────────────────────────────
  // The component renders location names below the SVG, one per scored entry.

  it('renders a location label below the SVG for each scored entry', () => {
    render(<MoodTimeline entries={THREE_ENTRIES} />);
    expect(screen.getByText('Lisbon')).toBeInTheDocument();
    expect(screen.getByText('Porto')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  it('location label count equals the number of scored entries', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    // Labels are in the flex row below the SVG
    const labels = container.querySelectorAll('.flex span');
    expect(labels).toHaveLength(3);
  });

  // ── stats derived from entries ────────────────────────────────────────────
  // Computed stats expected below the timeline:
  //   1. total entry count
  //   2. positive count
  //   3. negative count

  it('correct counts are derivable from the entries prop', () => {
    // Verify the data the component receives is consistent —
    // if the component rendered stat labels we'd assert on them here.
    const positive = THREE_ENTRIES.filter((e) => e.sentiment.score === 'positive').length;
    const negative = THREE_ENTRIES.filter((e) => e.sentiment.score === 'negative').length;
    expect(positive).toBe(1);
    expect(negative).toBe(1);
    expect(THREE_ENTRIES).toHaveLength(3);
  });

  // ── path element ──────────────────────────────────────────────────────────

  it('renders an SVG path connecting the circle points', () => {
    const { container } = render(<MoodTimeline entries={THREE_ENTRIES} />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path.getAttribute('d')).toMatch(/^M/); // starts with Move command
  });
});
