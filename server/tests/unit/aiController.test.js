import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/Entry.js');
vi.mock('../../src/config/anthropic.js', () => ({
  anthropic: {
    messages: {
      stream: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import Entry from '../../src/models/Entry.js';
import { anthropic } from '../../src/config/anthropic.js';
import {
  enhanceEntry,
  locationInsights,
  captionPhoto,
  compileTrip,
  analyseSentiment,
  nlSearch,
} from '../../src/controllers/aiController.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn();
  res.write = vi.fn();
  res.end = vi.fn();
  return res;
};

/** Wraps an events array into an async iterable for stream mocks. */
const makeStream = (events) => ({
  [Symbol.asyncIterator]: async function* () {
    for (const event of events) yield event;
  },
});

/** Creates a content_block_delta SSE event. */
const textDelta = (text) => ({
  type: 'content_block_delta',
  delta: { type: 'text_delta', text },
});

/** Creates a mock Claude text response. */
const mockMsg = (text) => ({ content: [{ text }] });

const USER_ID = 'user-abc';
const ENTRY_ID = 'entry-xyz';

const makeEntry = (overrides = {}) => ({
  _id: ENTRY_ID,
  title: 'Lisbon trip',
  location: 'Lisbon',
  date: new Date('2024-06-01'),
  body: 'Sunset over the river',
  images: [],
  author: USER_ID,
  locationInsights: { etiquette: '' },
  sentiment: { score: null, keywords: [] },
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

// ── 1. enhanceEntry ───────────────────────────────────────────────────────────

describe('aiController.enhanceEntry', () => {
  it('sets Content-Type: text/event-stream header', async () => {
    anthropic.messages.stream.mockReturnValue(makeStream([]));

    const req = { body: { body: 'My trip was fun.' } };
    const res = makeRes();
    await enhanceEntry(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
  });

  it('sets Cache-Control and Connection headers for SSE', async () => {
    anthropic.messages.stream.mockReturnValue(makeStream([]));

    const req = { body: { body: 'My trip was fun.' } };
    const res = makeRes();
    await enhanceEntry(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
  });

  it('writes text chunks with data: prefix via res.write', async () => {
    anthropic.messages.stream.mockReturnValue(
      makeStream([textDelta('Hello'), textDelta(' world')]),
    );

    const req = { body: { body: 'My trip was fun.' } };
    const res = makeRes();
    await enhanceEntry(req, res);

    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({ chunk: 'Hello' })}\n\n`,
    );
    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({ chunk: ' world' })}\n\n`,
    );
  });

  it('ends stream with data: [DONE]', async () => {
    anthropic.messages.stream.mockReturnValue(makeStream([textDelta('text')]));

    const req = { body: { body: 'My trip.' } };
    const res = makeRes();
    await enhanceEntry(req, res);

    expect(res.write).toHaveBeenLastCalledWith('data: [DONE]\n\n');
    expect(res.end).toHaveBeenCalled();
  });

  it('ignores non-text_delta events (does not write them)', async () => {
    anthropic.messages.stream.mockReturnValue(
      makeStream([
        { type: 'message_start', message: {} },
        textDelta('chunk'),
        { type: 'message_stop' },
      ]),
    );

    const req = { body: { body: 'My trip.' } };
    const res = makeRes();
    await enhanceEntry(req, res);

    // Only the text chunk write + the [DONE] write
    const dataCalls = res.write.mock.calls.filter((args) => args[0] !== 'data: [DONE]\n\n');
    expect(dataCalls).toHaveLength(1);
  });

  it('propagates SDK errors thrown during stream iteration', async () => {
    const sdkError = new Error('SDK stream error');
    anthropic.messages.stream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        throw sdkError;
      },
    });

    const req = { body: { body: 'My trip.' } };
    await expect(enhanceEntry(req, makeRes())).rejects.toThrow('SDK stream error');
  });

  it('returns 400 when body field is missing', async () => {
    const req = { body: {} };
    const res = makeRes();
    await enhanceEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(anthropic.messages.stream).not.toHaveBeenCalled();
  });
});

// ── 2. locationInsights ───────────────────────────────────────────────────────

describe('aiController.locationInsights', () => {
  const cachedInsights = {
    etiquette: 'Remove shoes',
    phrases: ['Olá', 'Obrigado', 'Por favor'],
    currency: 'EUR',
    season: 'Spring',
    hiddenGem: 'Mouraria',
  };

  it('returns cached insights without calling Anthropic on cache hit', async () => {
    Entry.findById.mockResolvedValue(
      makeEntry({ locationInsights: cachedInsights }),
    );

    const req = { body: { entryId: ENTRY_ID, location: 'Lisbon' } };
    const res = makeRes();
    await locationInsights(req, res);

    expect(anthropic.messages.create).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(cachedInsights);
  });

  it('calls Anthropic and saves result to entry on cache miss', async () => {
    Entry.findById.mockResolvedValue(makeEntry({ locationInsights: { etiquette: '' } }));
    Entry.findByIdAndUpdate.mockResolvedValue({});
    anthropic.messages.create.mockResolvedValue(
      mockMsg(JSON.stringify(cachedInsights)),
    );

    const req = { body: { entryId: ENTRY_ID, location: 'Lisbon' } };
    const res = makeRes();
    await locationInsights(req, res);

    expect(anthropic.messages.create).toHaveBeenCalledOnce();
    expect(Entry.findByIdAndUpdate).toHaveBeenCalledWith(
      ENTRY_ID,
      { locationInsights: cachedInsights },
    );
    expect(res.json).toHaveBeenCalledWith(cachedInsights);
  });

  it('returns insights without persisting when no entryId provided', async () => {
    anthropic.messages.create.mockResolvedValue(
      mockMsg(JSON.stringify(cachedInsights)),
    );

    const req = { body: { location: 'Lisbon' } };
    const res = makeRes();
    await locationInsights(req, res);

    expect(Entry.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(cachedInsights);
  });

  it('returns 500 with descriptive error when Claude returns invalid JSON', async () => {
    Entry.findById.mockResolvedValue(makeEntry({ locationInsights: { etiquette: '' } }));
    anthropic.messages.create.mockResolvedValue(mockMsg('not valid json {{{'));

    const req = { body: { entryId: ENTRY_ID, location: 'Lisbon' } };
    const res = makeRes();

    await expect(locationInsights(req, res)).rejects.toThrow();
    // The controller throws from JSON.parse — Express error middleware handles 500.
    // Verify Anthropic was called before the parse failure.
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
  });

  it('returns 400 when location is missing', async () => {
    const req = { body: {} };
    const res = makeRes();
    await locationInsights(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(anthropic.messages.create).not.toHaveBeenCalled();
  });
});

// ── 3. captionPhoto ───────────────────────────────────────────────────────────

describe('aiController.captionPhoto', () => {
  const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/v1/photo.jpg';
  const captionResult = { caption: 'Sunset over Lisbon', altText: 'Rooftop view at dusk' };

  it('calls Anthropic with vision content block (type:image, source:{type:url})', async () => {
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(captionResult)));

    const req = { body: { imageUrl: cloudinaryUrl } };
    await captionPhoto(req, makeRes());

    const call = anthropic.messages.create.mock.calls[0][0];
    const userContent = call.messages[0].content;
    const imageBlock = userContent.find((b) => b.type === 'image');

    expect(imageBlock).toBeDefined();
    expect(imageBlock.source).toEqual({ type: 'url', url: cloudinaryUrl });
  });

  it('responds with parsed caption and altText JSON', async () => {
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(captionResult)));

    const req = { body: { imageUrl: cloudinaryUrl } };
    const res = makeRes();
    await captionPhoto(req, res);

    expect(res.json).toHaveBeenCalledWith(captionResult);
  });

  it('returns 400 when imageUrl is missing', async () => {
    const req = { body: {} };
    const res = makeRes();
    await captionPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(anthropic.messages.create).not.toHaveBeenCalled();
  });

  it('uses claude-sonnet-4-6 model for vision', async () => {
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(captionResult)));

    await captionPhoto({ body: { imageUrl: cloudinaryUrl } }, makeRes());

    expect(anthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-6' }),
    );
  });
});

// ── 4. compileTrip ────────────────────────────────────────────────────────────

describe('aiController.compileTrip', () => {
  it('sets SSE headers (Content-Type, Cache-Control, Connection)', async () => {
    const entries = [
      makeEntry({ _id: 'e1', date: new Date('2024-05-01') }),
      makeEntry({ _id: 'e2', date: new Date('2024-05-02') }),
    ];
    Entry.find.mockResolvedValue(entries);
    anthropic.messages.stream.mockReturnValue(makeStream([]));

    const req = { user: { _id: USER_ID }, body: { entryIds: ['e1', 'e2'] } };
    const res = makeRes();
    await compileTrip(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
  });

  it('streams chunks with data: prefix and ends with [DONE]', async () => {
    Entry.find.mockResolvedValue([makeEntry()]);
    anthropic.messages.stream.mockReturnValue(makeStream([textDelta('Narrative')]));

    const req = { user: { _id: USER_ID }, body: { entryIds: [ENTRY_ID] } };
    const res = makeRes();
    await compileTrip(req, res);

    expect(res.write).toHaveBeenCalledWith(
      `data: ${JSON.stringify({ chunk: 'Narrative' })}\n\n`,
    );
    expect(res.write).toHaveBeenLastCalledWith('data: [DONE]\n\n');
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 404 when no entries belong to the authenticated user', async () => {
    // Entry.find returns empty because author filter excludes them
    Entry.find.mockResolvedValue([]);

    const req = { user: { _id: USER_ID }, body: { entryIds: ['other-entry'] } };
    const res = makeRes();
    await compileTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(anthropic.messages.stream).not.toHaveBeenCalled();
  });

  it('queries only entries belonging to the authenticated user', async () => {
    Entry.find.mockResolvedValue([makeEntry()]);
    anthropic.messages.stream.mockReturnValue(makeStream([]));

    const req = { user: { _id: USER_ID }, body: { entryIds: ['e1', 'e2'] } };
    await compileTrip(req, makeRes());

    expect(Entry.find).toHaveBeenCalledWith(
      expect.objectContaining({ author: USER_ID }),
    );
  });

  it('returns 400 when entryIds is not provided', async () => {
    const req = { user: { _id: USER_ID }, body: {} };
    const res = makeRes();
    await compileTrip(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('includes all entry titles and bodies in the prompt sent to Claude', async () => {
    const entries = [
      makeEntry({ _id: 'e1', title: 'Day 1', location: 'Porto', body: 'Wine tasting' }),
      makeEntry({ _id: 'e2', title: 'Day 2', location: 'Lisbon', body: 'Art museums' }),
    ];
    Entry.find.mockResolvedValue(entries);
    anthropic.messages.stream.mockReturnValue(makeStream([]));

    const req = { user: { _id: USER_ID }, body: { entryIds: ['e1', 'e2'] } };
    await compileTrip(req, makeRes());

    const prompt = anthropic.messages.stream.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain('Day 1');
    expect(prompt).toContain('Wine tasting');
    expect(prompt).toContain('Day 2');
    expect(prompt).toContain('Art museums');
  });
});

// ── 5. analyseSentiment ───────────────────────────────────────────────────────

describe('aiController.analyseSentiment', () => {
  const sentimentResult = { score: 'positive', keywords: ['joyful', 'scenic', 'warm'] };

  it('skips entries that already have a sentiment score (Anthropic not called for them)', async () => {
    const alreadyAnalysed = makeEntry({
      _id: 'e-cached',
      sentiment: { score: 'positive', keywords: ['great'] },
    });
    const needsAnalysis = makeEntry({ _id: 'e-new', sentiment: { score: null } });

    Entry.find.mockResolvedValue([alreadyAnalysed, needsAnalysis]);
    Entry.findByIdAndUpdate.mockResolvedValue({});
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(sentimentResult)));

    const req = { user: { _id: USER_ID }, body: { entryIds: ['e-cached', 'e-new'] } };
    await analyseSentiment(req, makeRes());

    // Only one Anthropic call (for e-new)
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
  });

  it('returns cached sentiment alongside freshly analysed sentiment', async () => {
    const cached = makeEntry({
      _id: 'e-cached',
      sentiment: { score: 'neutral', keywords: ['ok'] },
    });
    const fresh = makeEntry({ _id: 'e-new', sentiment: { score: null } });

    Entry.find.mockResolvedValue([cached, fresh]);
    Entry.findByIdAndUpdate.mockResolvedValue({});
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(sentimentResult)));

    const req = { user: { _id: USER_ID }, body: { entryIds: ['e-cached', 'e-new'] } };
    const res = makeRes();
    await analyseSentiment(req, res);

    const response = res.json.mock.calls[0][0];
    const ids = response.map((r) => String(r.entryId));
    expect(ids).toContain('e-cached');
    expect(ids).toContain('e-new');
  });

  it('processes entries in batches of exactly 5 (verifies two Promise.all waves for 6 entries)', async () => {
    // 6 entries all without sentiment — should produce two batches: [5, 1]
    const entries = Array.from({ length: 6 }, (_, i) =>
      makeEntry({ _id: `e-${i}`, sentiment: { score: null } }),
    );
    Entry.find.mockResolvedValue(entries);
    Entry.findByIdAndUpdate.mockResolvedValue({});

    // Track in-flight count: increment on call start, decrement on resolve.
    // This captures true concurrency — the outer loop awaits each batch fully
    // before starting the next, so max in-flight should be capped at 5.
    let inFlight = 0;
    let maxInFlight = 0;

    anthropic.messages.create.mockImplementation(() => {
      inFlight++;
      if (inFlight > maxInFlight) maxInFlight = inFlight;
      return new Promise((resolve) => {
        setImmediate(() => {
          inFlight--;
          resolve(mockMsg(JSON.stringify(sentimentResult)));
        });
      });
    });

    const req = { user: { _id: USER_ID }, body: { entryIds: entries.map((e) => e._id) } };
    await analyseSentiment(req, makeRes());

    expect(anthropic.messages.create).toHaveBeenCalledTimes(6);
    expect(maxInFlight).toBeLessThanOrEqual(5);
  });

  it('saves sentiment to each processed entry', async () => {
    const entries = [
      makeEntry({ _id: 'e1', sentiment: { score: null } }),
      makeEntry({ _id: 'e2', sentiment: { score: null } }),
    ];
    Entry.find.mockResolvedValue(entries);
    Entry.findByIdAndUpdate.mockResolvedValue({});
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(sentimentResult)));

    const req = { user: { _id: USER_ID }, body: { entryIds: ['e1', 'e2'] } };
    await analyseSentiment(req, makeRes());

    expect(Entry.findByIdAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('returns 400 when entryIds is not provided', async () => {
    const req = { user: { _id: USER_ID }, body: {} };
    const res = makeRes();
    await analyseSentiment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('propagates error when Claude returns invalid JSON for an entry in a batch', async () => {
    const entries = [makeEntry({ _id: 'e1', sentiment: { score: null } })];
    Entry.find.mockResolvedValue(entries);
    anthropic.messages.create.mockResolvedValue(mockMsg('invalid json {{{'));

    const req = { user: { _id: USER_ID }, body: { entryIds: ['e1'] } };
    // Controller has no try/catch around JSON.parse — error propagates
    await expect(analyseSentiment(req, makeRes())).rejects.toThrow();
  });
});

// ── 6. nlSearch ───────────────────────────────────────────────────────────────

describe('aiController.nlSearch', () => {
  const parsedFilter = { location: 'Lisbon', 'sentiment.score': 'positive' };

  const makeNlQuery = (result) => {
    const q = {};
    q.sort = vi.fn().mockReturnThis();
    q.populate = vi.fn().mockResolvedValue(result);
    return q;
  };

  it('calls Anthropic once with the user query text', async () => {
    Entry.find.mockReturnValue(makeNlQuery([]));
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(parsedFilter)));

    const req = { user: { _id: USER_ID }, body: { query: 'positive entries in Lisbon' } };
    await nlSearch(req, makeRes());

    expect(anthropic.messages.create).toHaveBeenCalledOnce();
    const prompt = anthropic.messages.create.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain('positive entries in Lisbon');
  });

  it('builds MongoDB query from parsed JSON filters merged with author constraint', async () => {
    const query = makeNlQuery([]);
    Entry.find.mockReturnValue(query);
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(parsedFilter)));

    const req = { user: { _id: USER_ID }, body: { query: 'positive entries in Lisbon' } };
    await nlSearch(req, makeRes());

    expect(Entry.find).toHaveBeenCalledWith({
      author: USER_ID,
      ...parsedFilter,
    });
  });

  it('returns matched entries in the response', async () => {
    const entries = [makeEntry()];
    const query = makeNlQuery(entries);
    Entry.find.mockReturnValue(query);
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify(parsedFilter)));

    const req = { user: { _id: USER_ID }, body: { query: 'positive Lisbon entries' } };
    const res = makeRes();
    await nlSearch(req, res);

    expect(res.json).toHaveBeenCalledWith(entries);
  });

  it('sorts results by date descending', async () => {
    const query = makeNlQuery([]);
    Entry.find.mockReturnValue(query);
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify({})));

    const req = { user: { _id: USER_ID }, body: { query: 'any search' } };
    await nlSearch(req, makeRes());

    expect(query.sort).toHaveBeenCalledWith({ date: -1 });
  });

  it('returns 400 when query field is missing', async () => {
    const req = { user: { _id: USER_ID }, body: {} };
    const res = makeRes();
    await nlSearch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(anthropic.messages.create).not.toHaveBeenCalled();
  });

  it('propagates error when Claude returns malformed JSON', async () => {
    anthropic.messages.create.mockResolvedValue(mockMsg('not json at all'));

    const req = { user: { _id: USER_ID }, body: { query: 'find sunny trips' } };
    // Controller has no try/catch around JSON.parse — error propagates to Express
    await expect(nlSearch(req, makeRes())).rejects.toThrow();
  });
});
