/**
 * Express app — no DB connection, no listen().
 * Imported by index.js (local dev), e2e-server.js (E2E tests),
 * and api/index.js (Vercel serverless).
 */
import express from 'express';
import cors    from 'cors';

import authRoutes  from './routes/authRoutes.js';
import entryRoutes from './routes/entryRoutes.js';
import aiRoutes    from './routes/aiRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',    authRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/ai',      aiRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  res.status(status).json({ message: err.message ?? 'Internal server error' });
});

export default app;
