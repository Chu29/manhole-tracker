import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { UTILITY_TYPES } from '@manhole-tracker/shared';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check — confirms the server (and shared-package wiring) is up.
// Routes from spec §5 (/api/auth, /api/manholes, ...) get mounted here as they're built.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'manhole-tracker-backend', utilityTypes: UTILITY_TYPES });
});

const server = app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
});

// Graceful shutdown so nodemon restarts / Ctrl-C don't leave the port held.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
