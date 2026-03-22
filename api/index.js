/**
 * Vercel serverless entry point.
 *
 * Imports the Express app from server/src/app.js (which carries no
 * connectDB / listen calls). We manage the Mongoose connection here,
 * caching it across warm lambda invocations to avoid reconnecting on
 * every request.
 *
 * Node.js resolves mongoose, express, etc. from server/node_modules/
 * because app.js lives under server/src/ — no dep duplication needed.
 */
import mongoose from 'mongoose';
import app      from '../server/src/app.js';

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
