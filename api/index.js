/**
 * Vercel serverless entry point.
 *
 * Imports the Express app from server/src/app.js (which carries no
 * connectDB / listen calls). The Mongoose connection is managed via
 * connectOnce (server/src/config/connectOnce.js) so that mongoose is
 * resolved from server/node_modules — the only place it is installed.
 * The connection is cached across warm lambda invocations.
 */
import app         from '../server/src/app.js';
import { connectOnce } from '../server/src/config/connectOnce.js';

export default async function handler(req, res) {
  await connectOnce();
  return app(req, res);
}
