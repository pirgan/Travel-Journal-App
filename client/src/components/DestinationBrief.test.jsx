import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DestinationBrief from './DestinationBrief';
import api from '../api/axios';

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../api/axios', () => ({ default: { post: vi.fn() } }));

// ── fixtures ──────────────────────────────────────────────────────────────────

const INSIGHTS = {
  etiquette: 'Remove shoes before entering homes',
  currency: 'EUR',
  season: 'Spring (March–May)',
  hiddenGem: 'The Mouraria neighbourhood',
  phrases: ['Olá', 'Obrigado', 'Por favor'],
};

const renderBrief = (props = {}) =>
  render(
    <DestinationBrief entryId="e1" location="Lisbon" {...props} />,
  );

// ── tests ─────────────────────────────────────────────────────────────────────

describe('DestinationBrief', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── initial render ────────────────────────────────────────────────────────

  it('shows only the accordion toggle button before any click', () => {
    renderBrief();
    expect(screen.getByRole('button', { name: /destination brief/i })).toBeInTheDocument();
    expect(screen.queryByText(/etiquette/i)).not.toBeInTheDocument();
  });

  it('shows "+" indicator on the collapsed toggle', () => {
    renderBrief();
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  // ── loading skeleton ──────────────────────────────────────────────────────

  it('shows skeleton/loading text while the API request is in-flight', async () => {
    api.post.mockReturnValue(new Promise(() => {})); // never resolves
    renderBrief();

    await userEvent.click(screen.getByRole('button', { name: /destination brief/i }));

    expect(screen.getByText(/loading insights/i)).toBeInTheDocument();
  });

  it('hides loading text once the response arrives', async () => {
    api.post.mockResolvedValue({ data: INSIGHTS });
    renderBrief();

    await userEvent.click(screen.getByRole('button', { name: /destination brief/i }));

    await waitFor(() =>
      expect(screen.queryByText(/loading insights/i)).not.toBeInTheDocument(),
    );
  });

  // ── 5 data sections ───────────────────────────────────────────────────────

  it('renders all 5 insight sections after a successful fetch', async () => {
    api.post.mockResolvedValue({ data: INSIGHTS });
    renderBrief();

    await userEvent.click(screen.getByRole('button', { name: /destination brief/i }));

    // 1. Etiquette
    expect(await screen.findByText(/etiquette/i)).toBeInTheDocument();
    expect(screen.getByText(INSIGHTS.etiquette)).toBeInTheDocument();

    // 2. Currency
    expect(screen.getByText(/currency/i)).toBeInTheDocument();
    expect(screen.getByText(INSIGHTS.currency)).toBeInTheDocument();

    // 3. Best season
    expect(screen.getByText(/best season/i)).toBeInTheDocument();
    expect(screen.getByText(INSIGHTS.season)).toBeInTheDocument();

    // 4. Hidden gem
    expect(screen.getByText(/hidden gem/i)).toBeInTheDocument();
    expect(screen.getByText(INSIGHTS.hiddenGem)).toBeInTheDocument();

    // 5. Useful phrases
    expect(screen.getByText(/useful phrases/i)).toBeInTheDocument();
    INSIGHTS.phrases.forEach((phrase) =>
      expect(screen.getByText(phrase)).toBeInTheDocument(),
    );
  });

  // ── accordion toggle ──────────────────────────────────────────────────────

  it('accordion collapses on second click (toggle behaviour)', async () => {
    api.post.mockResolvedValue({ data: INSIGHTS });
    renderBrief();

    const btn = screen.getByRole('button', { name: /destination brief/i });

    // Open
    await userEvent.click(btn);
    expect(await screen.findByText(INSIGHTS.etiquette)).toBeInTheDocument();

    // Close
    await userEvent.click(btn);
    await waitFor(() =>
      expect(screen.queryByText(INSIGHTS.etiquette)).not.toBeInTheDocument(),
    );
  });

  it('shows "−" indicator when accordion is expanded', async () => {
    api.post.mockResolvedValue({ data: INSIGHTS });
    renderBrief();

    await userEvent.click(screen.getByRole('button', { name: /destination brief/i }));
    await screen.findByText(INSIGHTS.etiquette);

    expect(screen.getByText('−')).toBeInTheDocument();
  });

  // ── no-refetch ────────────────────────────────────────────────────────────

  it('does NOT call the API on second accordion click (cache-hit short-circuit)', async () => {
    api.post.mockResolvedValue({ data: INSIGHTS });
    renderBrief();

    const btn = screen.getByRole('button', { name: /destination brief/i });

    await userEvent.click(btn);               // first click → API call
    await screen.findByText(INSIGHTS.etiquette);
    await userEvent.click(btn);               // second click → collapse, no API
    await userEvent.click(btn);               // third click → re-expand, no API

    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it('calls POST /ai/location-insights with entryId and location', async () => {
    api.post.mockResolvedValue({ data: INSIGHTS });
    renderBrief({ entryId: 'e42', location: 'Lisbon' });

    await userEvent.click(screen.getByRole('button', { name: /destination brief/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/ai/location-insights', {
        entryId: 'e42',
        location: 'Lisbon',
      }),
    );
  });

  // ── cached prop ───────────────────────────────────────────────────────────

  it('renders cached insights immediately (no API call) when `cached` prop is supplied', async () => {
    renderBrief({ cached: INSIGHTS });

    await userEvent.click(screen.getByRole('button', { name: /destination brief/i }));

    expect(await screen.findByText(INSIGHTS.etiquette)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
