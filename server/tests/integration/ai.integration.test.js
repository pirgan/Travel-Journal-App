import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/index.js';
import Entry from '../../src/models/Entry.js';
import { anthropic } from '../../src/config/anthropic.js';
import { startDB, stopDB, clearDB, registerUser } from './setup.js';

// ── rateLimit mock ────────────────────────────────────────────────────────────
// express-rate-limit v8 throws a ValidationError at module init when keyGenerator
// falls back to req.ip without the ipKeyGenerator helper. Bypass it in tests.
vi.mock('../../src/middleware/rateLimit.js', () => ({
  aiRateLimit: (_req, _res, next) => next(),
}));

// ── Cloudinary / multer-storage-cloudinary mocks ─────────────────────────────
vi.mock('../../src/config/cloudinary.js', () => ({
  default: {
    config: () => {},
    uploader: { upload: vi.fn().mockResolvedValue({ secure_url: 'https://cdn.test/img.jpg' }) },
  },
}));

vi.mock('multer-storage-cloudinary', () => ({
  CloudinaryStorage: class CloudinaryStorage {
    constructor() {}
    _handleFile(_req, file, cb) {
      cb(null, { path: `https://cdn.test/${file.originalname}`, filename: file.originalname });
    }
    _removeFile(_req, _file, cb) { cb(null); }
  },
}));

// ── Anthropic mock (module-level) ─────────────────────────────────────────────
// Hoisted by Vitest before any imports, so aiController.js receives the stub.

vi.mock('../../src/config/anthropic.js', () => ({
  anthropic: {
    messages: {
      stream:  vi.fn(),
      create:  vi.fn(),
    },
  },
}));

// ── DB lifecycle ──────────────────────────────────────────────────────────────

beforeAll(startDB, 30_000);
afterAll(stopDB,  30_000);
afterEach(() => {
  vi.clearAllMocks();
  return clearDB();
});

// ── helpers ───────────────────────────────────────────────────────────────────

/** Returns a finite async iterable that emits the given events then stops. */
const makeStream = (events = []) => ({
  [Symbol.asyncIterator]: async function* () {
    for (const event of events) yield event;
  },
});

const textDelta = (text) => ({
  type:  'content_block_delta',
  delta: { type: 'text_delta', text },
});

const mockMsg = (jsonText) => ({
  content: [{ text: jsonText }],
});

/** Creates an Entry document directly in the DB (bypasses routes/multer). */
const seedEntry = (authorId, overrides = {}) =>
  Entry.create({
    title:    'Lisbon at Dawn',
    location: 'Lisbon, Portugal',
    date:     new Date('2024-06-01'),
    body:     'Golden light spilled over the terracotta rooftops.',
    author:   new mongoose.Types.ObjectId(authorId),
    ...overrides,
  });

// ── POST /api/ai/enhance-entry ────────────────────────────────────────────────

describe('POST /api/ai/enhance-entry', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/ai/enhance-entry')
      .send({ body: 'My trip' });

    expect(res.status).toBe(401);
    expect(anthropic.messages.stream).not.toHaveBeenCalled();
  });

  it('returns 400 when the body field is missing', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/ai/enhance-entry')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns SSE stream with Content-Type: text/event-stream', async () => {
    const { token } = await registerUser();

    anthropic.messages.stream.mockReturnValue(
      makeStream([
        textDelta('The golden hour bathed'),
        textDelta(' Lisbon in amber light.'),
      ]),
    );

    const res = await request(app)
      .post('/api/ai/enhance-entry')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Lisbon was nice.' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
  });

  it('SSE response body contains data: chunks and ends with [DONE]', async () => {
    const { token } = await registerUser();

    anthropic.messages.stream.mockReturnValue(
      makeStream([textDelta('Vivid prose here.')]),
    );

    const res = await request(app)
      .post('/api/ai/enhance-entry')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Lisbon was nice.' });

    expect(res.text).toContain('data: {"chunk":"Vivid prose here."}');
    expect(res.text).toContain('data: [DONE]');
  });

  it('calls the Anthropic stream API with the provided body text', async () => {
    const { token } = await registerUser();
    anthropic.messages.stream.mockReturnValue(makeStream([]));

    await request(app)
      .post('/api/ai/enhance-entry')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'My Lisbon trip.' });

    expect(anthropic.messages.stream).toHaveBeenCalledOnce();
    const prompt = anthropic.messages.stream.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain('My Lisbon trip.');
  });
});

// ── POST /api/ai/location-insights ───────────────────────────────────────────

describe('POST /api/ai/location-insights', () => {
  const INSIGHTS = {
    etiquette: 'Remove shoes at the door',
    phrases:   ['Olá', 'Obrigado', 'Por favor'],
    currency:  'EUR',
    season:    'Spring',
    hiddenGem: 'Mouraria quarter',
  };

  it('cache miss: calls Anthropic, saves result to DB, returns JSON insights', async () => {
    const { token, userId } = await registerUser();
    const entry = await seedEntry(userId);

    anthropic.messages.create.mockResolvedValue(
      mockMsg(JSON.stringify(INSIGHTS)),
    );

    const res = await request(app)
      .post('/api/ai/location-insights')
      .set('Authorization', `Bearer ${token}`)
      .send({ entryId: entry._id.toString(), location: 'Lisbon' });

    expect(res.status).toBe(200);
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
    expect(res.body.etiquette).toBe(INSIGHTS.etiquette);
    expect(res.body.currency).toBe(INSIGHTS.currency);

    // Verify the insights were persisted to the entry
    const updated = await Entry.findById(entry._id);
    expect(updated.locationInsights.etiquette).toBe(INSIGHTS.etiquette);
  });

  it('cache hit: returns cached value without calling Anthropic', async () => {
    const { token, userId } = await registerUser();
    const entry = await seedEntry(userId, { locationInsights: INSIGHTS });

    const res = await request(app)
      .post('/api/ai/location-insights')
      .set('Authorization', `Bearer ${token}`)
      .send({ entryId: entry._id.toString(), location: 'Lisbon' });

    expect(res.status).toBe(200);
    expect(anthropic.messages.create).not.toHaveBeenCalled();
    expect(res.body.etiquette).toBe(INSIGHTS.etiquette);
  });

  it('returns location insights without persisting when no entryId is given', async () => {
    const { token } = await registerUser();

    anthropic.messages.create.mockResolvedValue(
      mockMsg(JSON.stringify(INSIGHTS)),
    );

    const res = await request(app)
      .post('/api/ai/location-insights')
      .set('Authorization', `Bearer ${token}`)
      .send({ location: 'Lisbon' });

    expect(res.status).toBe(200);
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
    expect(res.body.season).toBe(INSIGHTS.season);
  });

  it('returns 400 when location field is missing', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/ai/location-insights')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(anthropic.messages.create).not.toHaveBeenCalled();
  });
});

// ── POST /api/ai/nl-search ────────────────────────────────────────────────────

describe('POST /api/ai/nl-search', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/ai/nl-search')
      .send({ query: 'positive trips in Lisbon' });

    expect(res.status).toBe(401);
  });

  it('calls Anthropic once and returns entries matching the parsed filter', async () => {
    const { token, userId } = await registerUser();

    await Entry.create([
      { title: 'Lisbon',  location: 'Lisbon', date: new Date('2024-05-01'), body: 'A', author: new mongoose.Types.ObjectId(userId), sentiment: { score: 'positive' } },
      { title: 'Madrid',  location: 'Madrid', date: new Date('2024-06-01'), body: 'B', author: new mongoose.Types.ObjectId(userId), sentiment: { score: 'neutral' }  },
    ]);

    // Claude returns a filter that matches only positive-sentiment entries
    anthropic.messages.create.mockResolvedValue(
      mockMsg(JSON.stringify({ 'sentiment.score': 'positive' })),
    );

    const res = await request(app)
      .post('/api/ai/nl-search')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'happy trips' });

    expect(res.status).toBe(200);
    expect(anthropic.messages.create).toHaveBeenCalledOnce();
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Lisbon');
  });

  it('builds the MongoDB query from the JSON filter returned by Claude', async () => {
    const { token, userId } = await registerUser();

    await seedEntry(userId, { location: 'Porto' });

    // Claude returns an empty filter → match all entries
    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify({})));

    const res = await request(app)
      .post('/api/ai/nl-search')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'any trip' });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('returns entries sorted by date descending', async () => {
    const { token, userId } = await registerUser();

    await Entry.create([
      { title: 'Old',    location: 'X', date: new Date('2024-01-01'), body: 'B', author: new mongoose.Types.ObjectId(userId) },
      { title: 'Recent', location: 'X', date: new Date('2024-12-01'), body: 'A', author: new mongoose.Types.ObjectId(userId) },
    ]);

    anthropic.messages.create.mockResolvedValue(mockMsg(JSON.stringify({})));

    const res = await request(app)
      .post('/api/ai/nl-search')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'trips' });

    expect(res.status).toBe(200);
    // Controller sorts by { date: -1 } — most recent first
    expect(res.body[0].title).toBe('Recent');
    expect(res.body[1].title).toBe('Old');
  });

  it('returns 400 when the query field is missing', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/ai/nl-search')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── POST /api/ai/analyse-sentiment ───────────────────────────────────────────

describe('POST /api/ai/analyse-sentiment', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/ai/analyse-sentiment')
      .send({ entryIds: [] });

    expect(res.status).toBe(401);
  });

  it('returns all entries with populated sentiment field', async () => {
    const { token, userId } = await registerUser();

    const [e1, e2, e3] = await Entry.create([
      { title: 'A', location: 'Lisbon', date: new Date(), body: 'Wonderful trip', author: new mongoose.Types.ObjectId(userId) },
      { title: 'B', location: 'Porto',  date: new Date(), body: 'Rainy day',       author: new mongoose.Types.ObjectId(userId) },
      { title: 'C', location: 'Madrid', date: new Date(), body: 'Missed the bus',  author: new mongoose.Types.ObjectId(userId) },
    ]);

    const sentiments = [
      { score: 'positive', keywords: ['wonderful', 'amazing', 'joyful'] },
      { score: 'neutral',  keywords: ['rainy',    'ok',       'mixed']  },
      { score: 'negative', keywords: ['missed',   'late',     'tired']  },
    ];

    // Return a different sentiment for each call
    anthropic.messages.create
      .mockResolvedValueOnce(mockMsg(JSON.stringify(sentiments[0])))
      .mockResolvedValueOnce(mockMsg(JSON.stringify(sentiments[1])))
      .mockResolvedValueOnce(mockMsg(JSON.stringify(sentiments[2])));

    const res = await request(app)
      .post('/api/ai/analyse-sentiment')
      .set('Authorization', `Bearer ${token}`)
      .send({ entryIds: [e1._id, e2._id, e3._id] });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);

    const scores = res.body.map((r) => r.sentiment.score);
    expect(scores).toContain('positive');
    expect(scores).toContain('neutral');
    expect(scores).toContain('negative');
  });

  it('skips entries that already have a sentiment score (Anthropic not called for them)', async () => {
    const { token, userId } = await registerUser();

    const [cached, fresh] = await Entry.create([
      {
        title: 'Cached', location: 'Lisbon', date: new Date(), body: 'Body',
        author: new mongoose.Types.ObjectId(userId),
        sentiment: { score: 'positive', keywords: ['great'] },
      },
      {
        title: 'Fresh', location: 'Porto', date: new Date(), body: 'Body',
        author: new mongoose.Types.ObjectId(userId),
      },
    ]);

    anthropic.messages.create.mockResolvedValue(
      mockMsg(JSON.stringify({ score: 'neutral', keywords: ['ok', 'fine', 'alright'] })),
    );

    const res = await request(app)
      .post('/api/ai/analyse-sentiment')
      .set('Authorization', `Bearer ${token}`)
      .send({ entryIds: [cached._id, fresh._id] });

    expect(res.status).toBe(200);
    // Only the fresh entry required an API call
    expect(anthropic.messages.create).toHaveBeenCalledOnce();

    const cachedResult = res.body.find((r) => r.entryId.toString() === cached._id.toString());
    expect(cachedResult.sentiment.score).toBe('positive');
  });

  it('persists sentiment to each processed entry in the database', async () => {
    const { token, userId } = await registerUser();

    const entry = await seedEntry(userId);

    anthropic.messages.create.mockResolvedValue(
      mockMsg(JSON.stringify({ score: 'positive', keywords: ['joyful', 'warm', 'scenic'] })),
    );

    await request(app)
      .post('/api/ai/analyse-sentiment')
      .set('Authorization', `Bearer ${token}`)
      .send({ entryIds: [entry._id] });

    const updated = await Entry.findById(entry._id);
    expect(updated.sentiment.score).toBe('positive');
    expect(updated.sentiment.keywords).toContain('joyful');
  });

  it('returns 400 when entryIds is not provided', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/ai/analyse-sentiment')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});
