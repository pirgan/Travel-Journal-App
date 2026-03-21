import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIEntryEnhancer from './AIEntryEnhancer';

// ── EventSource mock ──────────────────────────────────────────────────────────
// The component creates `new EventSource(url)` for SSE streaming.
// We replace the global with a controllable stub so tests can push events.

class MockEventSource {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.readyState = 1; // OPEN
    this.close = vi.fn(() => { this.readyState = 2; });
    MockEventSource.lastInstance = this;
  }
}
MockEventSource.lastInstance = null;

vi.stubGlobal('EventSource', MockEventSource);

// ── helpers ───────────────────────────────────────────────────────────────────

const ORIGINAL = 'The cobblestones were warm underfoot.';

const renderEnhancer = (props = {}) =>
  render(<AIEntryEnhancer originalBody={ORIGINAL} onAccept={vi.fn()} {...props} />);

/** Clicks Enhance and returns the created EventSource instance. */
const clickEnhance = async () => {
  await userEvent.click(screen.getByRole('button', { name: /enhance with ai/i }));
  return MockEventSource.lastInstance;
};

/** Pushes SSE message events onto the EventSource instance. */
const pushChunks = (es, chunks) => {
  act(() => {
    chunks.forEach((chunk) => es.onmessage({ data: JSON.stringify({ chunk }) }));
  });
};

const finishStream = (es) => {
  act(() => { es.onmessage({ data: '[DONE]' }); });
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('AIEntryEnhancer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.lastInstance = null;
    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => localStorage.clear());

  // ── initial render ────────────────────────────────────────────────────────

  it('renders the "✦ Enhance with AI" button', () => {
    renderEnhancer();
    expect(screen.getByRole('button', { name: /enhance with ai/i })).toBeInTheDocument();
  });

  it('does not show enhanced text panel before clicking Enhance', () => {
    renderEnhancer();
    // The enhanced <p> only renders when `enhanced` state is non-empty
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  // ── during streaming ──────────────────────────────────────────────────────

  it('button changes to "Enhancing…" and becomes disabled after click', async () => {
    renderEnhancer();
    await clickEnhance();
    const btn = screen.getByRole('button', { name: /enhancing/i });
    expect(btn).toBeDisabled();
  });

  it('creates an EventSource pointing at the enhance-entry endpoint', async () => {
    renderEnhancer();
    await clickEnhance();
    expect(MockEventSource.lastInstance.url).toContain('/ai/enhance-entry');
  });

  it('includes the encoded originalBody and auth token in the EventSource URL', async () => {
    renderEnhancer();
    await clickEnhance();
    const { url } = MockEventSource.lastInstance;
    expect(url).toContain(encodeURIComponent(ORIGINAL));
    expect(url).toContain('token=test-token');
  });

  it('streams text chunks into the enhanced panel (left=original, right=enhanced)', async () => {
    renderEnhancer();
    const es = await clickEnhance();

    pushChunks(es, ['Vivid', ' prose', ' here.']);

    await screen.findByText(/vivid prose here\./i);
  });

  it('accumulates chunks progressively', async () => {
    renderEnhancer();
    const es = await clickEnhance();

    act(() => { es.onmessage({ data: JSON.stringify({ chunk: 'First ' }) }); });
    await screen.findByText(/first/i);

    act(() => { es.onmessage({ data: JSON.stringify({ chunk: 'Second' }) }); });
    await screen.findByText(/first second/i);
  });

  // ── after stream completes ────────────────────────────────────────────────

  it('shows Accept button after receiving [DONE]', async () => {
    renderEnhancer();
    const es = await clickEnhance();
    pushChunks(es, ['Enhanced text.']);
    finishStream(es);

    expect(await screen.findByRole('button', { name: /accept/i })).toBeInTheDocument();
  });

  it('closes the EventSource when [DONE] is received', async () => {
    renderEnhancer();
    const es = await clickEnhance();
    pushChunks(es, ['text']);
    finishStream(es);

    await waitFor(() => expect(es.close).toHaveBeenCalled());
  });

  it('Accept button calls onAccept prop with the full enhanced text', async () => {
    const onAccept = vi.fn();
    renderEnhancer({ onAccept });
    const es = await clickEnhance();
    pushChunks(es, ['Enhanced ', 'journal text.']);
    finishStream(es);

    await userEvent.click(await screen.findByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledWith('Enhanced journal text.');
  });

  it('does not show Accept button while stream is still in progress', async () => {
    renderEnhancer();
    const es = await clickEnhance();
    pushChunks(es, ['partial text']);
    // [DONE] not sent yet
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
  });

  // ── error handling ────────────────────────────────────────────────────────

  it('re-enables Enhance button and closes EventSource on SSE error', async () => {
    renderEnhancer();
    const es = await clickEnhance();

    act(() => { es.onerror(new Event('error')); });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /enhance with ai/i })).not.toBeDisabled(),
    );
    expect(es.close).toHaveBeenCalled();
  });

  // ── re-trigger ────────────────────────────────────────────────────────────

  it('resets the enhanced panel when Enhance is clicked a second time', async () => {
    renderEnhancer();
    const es1 = await clickEnhance();
    pushChunks(es1, ['Old text.']);
    finishStream(es1);
    await screen.findByText(/old text/i);

    // Click Enhance again — enhanced state resets to ''
    await userEvent.click(screen.getByRole('button', { name: /enhance with ai/i }));
    expect(screen.queryByText(/old text/i)).not.toBeInTheDocument();
  });
});
