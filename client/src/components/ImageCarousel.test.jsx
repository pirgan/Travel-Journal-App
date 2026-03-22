import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageCarousel from './ImageCarousel';

// ── fixtures ──────────────────────────────────────────────────────────────────

const makeImages = (n) =>
  Array.from({ length: n }, (_, i) => ({
    url: `https://cdn.example.com/photo-${i}.jpg`,
    altText: `Photo alt text ${i}`,
    caption: i % 2 === 0 ? `Caption for photo ${i}` : '', // odd slides have no caption
  }));

const ONE   = makeImages(1);
const THREE = makeImages(3);
const FIVE  = makeImages(5);

// ── tests ─────────────────────────────────────────────────────────────────────

describe('ImageCarousel', () => {

  // ── guard clause ─────────────────────────────────────────────────────────

  it('renders nothing when images array is empty', () => {
    const { container } = render(<ImageCarousel images={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when images prop is omitted', () => {
    const { container } = render(<ImageCarousel />);
    expect(container.firstChild).toBeNull();
  });

  // ── single image ──────────────────────────────────────────────────────────

  it('renders the image for a single-item carousel', () => {
    render(<ImageCarousel images={ONE} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('does not render prev/next buttons for a single-image carousel', () => {
    render(<ImageCarousel images={ONE} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // ── alt text ──────────────────────────────────────────────────────────────

  it('first slide img uses altText from images[0].altText', () => {
    render(<ImageCarousel images={THREE} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[0].altText);
  });

  it('falls back to "Photo N" if altText is empty', () => {
    const noAlt = [{ url: 'img.jpg', altText: '', caption: '' }];
    render(<ImageCarousel images={noAlt} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Photo 1');
  });

  // ── caption ───────────────────────────────────────────────────────────────

  it('displays caption text for the current slide when caption is non-empty', () => {
    render(<ImageCarousel images={THREE} />);
    // THREE[0] has caption "Caption for photo 0"
    expect(screen.getByText('Caption for photo 0')).toBeInTheDocument();
  });

  it('does not render a caption element when current slide has no caption', async () => {
    render(<ImageCarousel images={THREE} />);
    // THREE[1] has an empty caption — navigate to it
    await userEvent.click(screen.getByRole('button', { name: /next photo/i }));
    expect(screen.queryByText(/caption for photo 1/i)).not.toBeInTheDocument();
  });

  // ── slide count (dot indicators) ─────────────────────────────────────────

  it('renders N dot indicator buttons for an N-image carousel', () => {
    render(<ImageCarousel images={THREE} />);
    // All buttons: prev, next, plus THREE dots
    const allButtons = screen.getAllByRole('button');
    const navButtons = allButtons.filter((b) => /previous photo|next photo/i.test(b.getAttribute('aria-label') ?? ''));
    const dotButtons = allButtons.filter((b) => !/previous photo|next photo/i.test(b.getAttribute('aria-label') ?? ''));
    expect(navButtons).toHaveLength(2);
    expect(dotButtons).toHaveLength(THREE.length);
  });

  it('renders 5 dot buttons for a 5-image carousel', () => {
    render(<ImageCarousel images={FIVE} />);
    const allButtons = screen.getAllByRole('button');
    const dotButtons = allButtons.filter((b) => !/previous photo|next photo/i.test(b.getAttribute('aria-label') ?? ''));
    expect(dotButtons).toHaveLength(5);
  });

  // ── next navigation ───────────────────────────────────────────────────────

  it('› next button advances to the next slide', async () => {
    render(<ImageCarousel images={THREE} />);
    await userEvent.click(screen.getByRole('button', { name: /next photo/i }));
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[1].altText);
  });

  it('clicking › multiple times cycles through all slides', async () => {
    render(<ImageCarousel images={THREE} />);
    const next = screen.getByRole('button', { name: /next photo/i });

    await userEvent.click(next); // slide 1
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[1].altText);

    await userEvent.click(next); // slide 2
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[2].altText);
  });

  it('› wraps around from the last slide back to the first', async () => {
    render(<ImageCarousel images={THREE} />);
    const next = screen.getByRole('button', { name: /next photo/i });

    await userEvent.click(next); // → 1
    await userEvent.click(next); // → 2
    await userEvent.click(next); // → wraps to 0
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[0].altText);
  });

  // ── prev navigation ───────────────────────────────────────────────────────

  it('‹ prev button from slide 0 wraps to the last slide', async () => {
    render(<ImageCarousel images={THREE} />);
    await userEvent.click(screen.getByRole('button', { name: /previous photo/i }));
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[THREE.length - 1].altText);
  });

  it('‹ prev button moves back one slide from a non-zero position', async () => {
    render(<ImageCarousel images={THREE} />);
    const next = screen.getByRole('button', { name: /next photo/i });
    const prev = screen.getByRole('button', { name: /previous photo/i });

    await userEvent.click(next); // → slide 1
    await userEvent.click(prev); // → slide 0
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[0].altText);
  });

  // ── dot navigation ────────────────────────────────────────────────────────

  it('clicking a dot button navigates directly to that slide', async () => {
    render(<ImageCarousel images={THREE} />);
    const allButtons = screen.getAllByRole('button');
    const dotButtons = allButtons.filter((b) => !/previous photo|next photo/i.test(b.getAttribute('aria-label') ?? ''));

    // Click the 3rd dot (index 2)
    await userEvent.click(dotButtons[2]);
    expect(screen.getByRole('img')).toHaveAttribute('alt', THREE[2].altText);
  });

  // ── image src ─────────────────────────────────────────────────────────────

  it('img src matches the current slide url', () => {
    render(<ImageCarousel images={THREE} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', THREE[0].url);
  });
});
