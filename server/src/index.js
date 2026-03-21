import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
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

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  res.status(status).json({ message: err.message ?? 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    const PORT = process.env.PORT ?? 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });
}

export default app;
