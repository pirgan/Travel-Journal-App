import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { startDB, stopDB, clearDB } from './setup.js';

// ── rateLimit mock ─────────────────────────────────────────────────────────────
// express-rate-limit v8 throws a ValidationError at module evaluation time
// when the keyGenerator falls back to req.ip without the ipKeyGenerator helper.
// Mocking the middleware prevents that error and removes rate-limit noise from tests.
vi.mock('../../src/middleware/rateLimit.js', () => ({
  aiRateLimit: (_req, _res, next) => next(),
}));

// ── Cloudinary / multer-storage-cloudinary mocks ─────────────────────────────
// entryRoutes initialises CloudinaryStorage at import time; mock both so the
// app can load without real Cloudinary credentials.
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
beforeEach(clearDB);
afterEach(clearDB);

// ── POST /api/auth/register ───────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201 with a JWT token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.email).toBe('alice@test.com');
    expect(res.body.name).toBe('Alice');
    // Password must never be returned
    expect(res.body.password).toBeUndefined();
  });

  it('returns _id in the response body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.body._id).toBeTruthy();
  });

  it('returns 409 when the email is already registered', async () => {
    const payload = { name: 'Alice', email: 'duplicate@test.com', password: 'password123' };

    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'duplicate@test.com', password: 'other123' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@test.com' }); // no name or password

    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  const CREDENTIALS = { name: 'Alice', email: 'alice@test.com', password: 'password123' };

  // Re-register before EACH login test because afterEach(clearDB) wipes the DB
  // after every test, so a single beforeAll registration would not survive.
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(CREDENTIALS);
  });

  it('returns 200 and a JWT token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: CREDENTIALS.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('response includes user profile fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: CREDENTIALS.password });

    expect(res.body.name).toBe('Alice');
    expect(res.body.email).toBe(CREDENTIALS.email);
    expect(res.body.password).toBeUndefined();
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email, password: 'WRONG_password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 when the email is not registered', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDENTIALS.email }); // no password

    expect(res.status).toBe(400);
  });
});
