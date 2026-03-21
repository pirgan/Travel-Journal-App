/**
 * Shared MongoDB-memory-server helpers for integration tests.
 *
 * Each test file that imports from here gets an isolated module scope
 * (Vitest runs each file in its own VM context), so `mongod` below is
 * a separate instance per file — test files can safely run in parallel.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/index.js';

let mongod;

/** Connect to an in-memory MongoDB. Call inside beforeAll. */
export const startDB = async () => {
  process.env.JWT_SECRET  = 'integration-test-jwt-secret';
  process.env.NODE_ENV    = 'test';

  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

/** Disconnect and stop the in-memory server. Call inside afterAll. */
export const stopDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

/** Delete every document in every collection. Call inside afterEach. */
export const clearDB = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
};

// ── API helpers ──────────────────────────────────────────────────────────────

/**
 * Registers a user via POST /api/auth/register and returns
 * { token, userId } for use in authenticated requests.
 */
export const registerUser = async (
  name  = 'Alice',
  email = 'alice@test.com',
  password = 'password123',
) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });

  return { token: res.body.token, userId: res.body._id };
};
