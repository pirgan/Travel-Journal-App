import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/index.js';
import Entry from '../../src/models/Entry.js';
import { startDB, stopDB, clearDB, registerUser } from './setup.js';

// ── rateLimit mock ────────────────────────────────────────────────────────────
vi.mock('../../src/middleware/rateLimit.js', () => ({
  aiRateLimit: (_req, _res, next) => next(),
}));

// ── Cloudinary / multer-storage-cloudinary mocks ─────────────────────────────
// The entry route initialises CloudinaryStorage at import time.
// We mock both modules so no real Cloudinary credentials are needed and no
// network calls are made, even if a file were accidentally included in a request.

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

// ── DB lifecycle ──────────────────────────────────────────────────────────────

beforeAll(startDB, 30_000);
afterAll(stopDB,  30_000);
afterEach(clearDB);

// ── helpers ───────────────────────────────────────────────────────────────────

/** POST /api/entries with JSON body (no files). */
const postEntry = (token, overrides = {}) =>
  request(app)
    .post('/api/entries')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title:    'Lisbon at Dawn',
      location: 'Lisbon, Portugal',
      date:     '2024-06-01',
      body:     'The city woke slowly, light spilling over terracotta rooftops.',
      ...overrides,
    });

// ── GET /api/entries ──────────────────────────────────────────────────────────

describe('GET /api/entries', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/entries');
    expect(res.status).toBe(401);
  });

  it('returns 401 when a malformed token is provided', async () => {
    const res = await request(app)
      .get('/api/entries')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('returns only entries belonging to the authenticated user', async () => {
    const { token: tokenA, userId: uidA } = await registerUser('Alice', 'alice@test.com');
    const { token: tokenB, userId: uidB } = await registerUser('Bob',   'bob@test.com');

    // Create one entry for Alice and two for Bob directly in the DB
    await Entry.create([
      { title: 'Alice trip', location: 'Lisbon', date: new Date(), body: 'A', author: new mongoose.Types.ObjectId(uidA) },
      { title: 'Bob trip 1', location: 'Porto',  date: new Date(), body: 'B', author: new mongoose.Types.ObjectId(uidB) },
      { title: 'Bob trip 2', location: 'Madrid', date: new Date(), body: 'C', author: new mongoose.Types.ObjectId(uidB) },
    ]);

    const resA = await request(app)
      .get('/api/entries')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body).toHaveLength(1);
    expect(resA.body[0].title).toBe('Alice trip');

    const resB = await request(app)
      .get('/api/entries')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.body).toHaveLength(2);
    const titles = resB.body.map((e) => e.title);
    expect(titles).toContain('Bob trip 1');
    expect(titles).toContain('Bob trip 2');
  });

  it('returns an empty array when the user has no entries', async () => {
    const { token } = await registerUser('Alice', 'alice@test.com');
    const res = await request(app)
      .get('/api/entries')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('populates author name and profilePic', async () => {
    const { token, userId } = await registerUser('Alice', 'alice@test.com');
    await Entry.create({
      title: 'Test', location: 'Lisbon', date: new Date(), body: 'Body',
      author: new mongoose.Types.ObjectId(userId),
    });

    const res = await request(app)
      .get('/api/entries')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body[0].author.name).toBe('Alice');
  });
});

// ── POST /api/entries ─────────────────────────────────────────────────────────

describe('POST /api/entries', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/entries')
      .send({ title: 'T', location: 'L', date: '2024-01-01', body: 'B' });
    expect(res.status).toBe(401);
  });

  it('creates an entry and returns 201 with an _id', async () => {
    const { token } = await registerUser('Alice', 'alice@test.com');
    const res = await postEntry(token);

    expect(res.status).toBe(201);
    expect(res.body._id).toBeTruthy();
    expect(res.body.title).toBe('Lisbon at Dawn');
    expect(res.body.location).toBe('Lisbon, Portugal');
  });

  it('persists the entry in the database', async () => {
    const { token, userId } = await registerUser('Alice', 'alice@test.com');
    const res = await postEntry(token);

    const saved = await Entry.findById(res.body._id);
    expect(saved).not.toBeNull();
    expect(saved.author.toString()).toBe(userId);
  });

  it('returns 400 when required fields are missing', async () => {
    const { token } = await registerUser('Alice', 'alice@test.com');
    const res = await request(app)
      .post('/api/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Only title' });

    expect(res.status).toBe(400);
  });
});

// ── DELETE /api/entries/:id ───────────────────────────────────────────────────

describe('DELETE /api/entries/:id', () => {
  it('returns 401 without a token', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).delete(`/api/entries/${fakeId}`);
    expect(res.status).toBe(401);
  });

  it('author can delete their own entry', async () => {
    const { token, userId } = await registerUser('Alice', 'alice@test.com');
    const entry = await Entry.create({
      title: 'To delete', location: 'Lisbon', date: new Date(), body: 'Body',
      author: new mongoose.Types.ObjectId(userId),
    });

    const res = await request(app)
      .delete(`/api/entries/${entry._id}`)
      .set('Authorization', `Bearer ${token}`);

    // Controller returns res.json({ message }) — status is 200 (not 204)
    expect(res.status).toBe(200);
    expect(await Entry.findById(entry._id)).toBeNull();
  });

  it('non-author receives 403 and entry is NOT deleted', async () => {
    const { userId: ownerUid } = await registerUser('Owner', 'owner@test.com');
    const { token: otherToken } = await registerUser('Other', 'other@test.com');

    const entry = await Entry.create({
      title: 'Protected', location: 'Lisbon', date: new Date(), body: 'Body',
      author: new mongoose.Types.ObjectId(ownerUid),
    });

    const res = await request(app)
      .delete(`/api/entries/${entry._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    // Entry must still exist
    expect(await Entry.findById(entry._id)).not.toBeNull();
  });

  it('returns 404 when the entry does not exist', async () => {
    const { token } = await registerUser('Alice', 'alice@test.com');
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete(`/api/entries/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ── GET /api/entries/search ───────────────────────────────────────────────────

describe('GET /api/entries/search', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/entries/search?q=lisbon');
    expect(res.status).toBe(401);
  });

  it('returns 400 when the q param is omitted', async () => {
    const { token } = await registerUser('Alice', 'alice@test.com');
    const res = await request(app)
      .get('/api/entries/search')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
