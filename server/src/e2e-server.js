/**
 * E2E server entrypoint — starts an in-memory MongoDB instance then boots the
 * Express app. Used exclusively by Playwright via `npm run dev:e2e`.
 *
 * Keeping everything in one process means the in-memory URI is set before
 * dotenv/config loads, so dotenv leaves MONGODB_URI alone.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();
process.env.JWT_SECRET  = process.env.JWT_SECRET ?? 'e2e-test-secret';

// Import app AFTER env vars are set so dotenv doesn't overwrite them
await import('./index.js');

const stop = async () => { await mongod.stop(); process.exit(0); };
process.on('SIGTERM', stop);
process.on('SIGINT',  stop);
