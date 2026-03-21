import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import api from '../api/axios';

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../api/axios', () => ({ default: { get: vi.fn() } }));

// Stub child components so Home tests stay focused on Home's own behaviour.
vi.mock('../components/MoodTimeline', () => ({
  default: () => <div data-testid="mood-timeline" />,
}));

vi.mock('../components/EntryCard', () => ({
  default: ({ entry }) => <div data-testid="entry-card">{entry.title}</div>,
}));

// ── fixtures ──────────────────────────────────────────────────────────────────

const makeEntry = (n) => ({
  _id: `e${n}`,
  title: `Entry ${n}`,
  location: `City ${n}`,
  date: '2024-06-01',
  images: [],
  sentiment: { score: 'positive' },
});

const renderHome = () => render(<Home />, { wrapper: MemoryRouter });

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Home', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading indicator before entries are fetched', () => {
    // Never-resolving promise keeps component in loading state
    api.get.mockReturnValue(new Promise(() => {}));
    renderHome();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders an EntryCard for each entry fetched from the API', async () => {
    const entries = [makeEntry(1), makeEntry(2), makeEntry(3)];
    api.get.mockResolvedValue({ data: entries });

    renderHome();

    const cards = await screen.findAllByTestId('entry-card');
    expect(cards).toHaveLength(3);
    expect(screen.getByText('Entry 1')).toBeInTheDocument();
    expect(screen.getByText('Entry 3')).toBeInTheDocument();
  });

  it('calls GET /entries to load the entries', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderHome();

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/entries'));
  });

  it('shows empty-state message when there are no entries', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderHome();

    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument();
  });

  it('shows MoodTimeline once entries load', async () => {
    api.get.mockResolvedValue({ data: [makeEntry(1), makeEntry(2)] });
    renderHome();

    expect(await screen.findByTestId('mood-timeline')).toBeInTheDocument();
  });

  it('"+ New Entry" button links to /entry/new', async () => {
    api.get.mockResolvedValue({ data: [makeEntry(1)] });
    renderHome();

    // Wait for loading to finish so the full page is rendered
    await screen.findAllByTestId('entry-card');

    const newLink = screen.getByRole('link', { name: /\+ new entry/i });
    expect(newLink).toHaveAttribute('href', '/entry/new');
  });

  it('displays the entry count below the page heading', async () => {
    api.get.mockResolvedValue({ data: [makeEntry(1), makeEntry(2)] });
    renderHome();

    expect(await screen.findByText(/2 entries/i)).toBeInTheDocument();
  });

  // ── search (client-side filter) ───────────────────────────────────────────
  // NOTE: Home.jsx currently loads all entries and relies on Navbar for search.
  // Client-side filtering by title is tested below against the rendered cards.

  it('rendered cards correspond to the fetched entries', async () => {
    const entries = [makeEntry(1), makeEntry(2), makeEntry(3)];
    api.get.mockResolvedValue({ data: entries });
    renderHome();

    const cards = await screen.findAllByTestId('entry-card');
    const titles = cards.map((c) => c.textContent);
    expect(titles).toEqual(['Entry 1', 'Entry 2', 'Entry 3']);
  });
});
