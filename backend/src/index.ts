import express from 'express';
import cors from 'cors';

import { ALLOWED_ORIGINS, PORT, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, isDev } from './utils/env.js';
import { log } from './utils/logger.js';
import { identifyUser } from './middleware/auth.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimit } from './middleware/rateLimit.js';
import characterRouter from './routes/character.js';
import stickerRouter from './routes/sticker.js';
import paymentRouter from './routes/payment.js';
import { fail } from './utils/http.js';

const app = express();
app.set('trust proxy', 1);

process.on('unhandledRejection', (reason) => {
  log.error('UnhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  log.error('UncaughtException:', err);
});

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (isDev) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(requestLogger);

app.get('/health', (_req, res) => res.json({ ok: true }));

// Identify user for all API routes, then apply rate limits.
app.use('/api', identifyUser);

// General API protection (per IP + path)
app.use(
  '/api',
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX
  })
);

// Stricter limits for expensive endpoints
app.use(
  '/api/analyze-character',
  rateLimit({
    windowMs: 60_000,
    max: 10
  })
);
app.use(
  '/api/generate-sticker-grid',
  rateLimit({
    windowMs: 60_000,
    max: 10
  })
);

// Payment creation rate limit (prevent abuse)
app.use(
  '/api/payment/create',
  rateLimit({
    windowMs: 60_000,
    max: 5
  })
);

app.use('/api', characterRouter);
app.use('/api', stickerRouter);
app.use('/api/payment', paymentRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  log.error('Unhandled route error:', err);
  res
    .status(500)
    .json(fail('INTERNAL_ERROR', isDev ? String(err?.message || err) : '服务器内部错误'));
});

app.listen(PORT, () => {
  log.info(`Backend listening on :${PORT}`);
});
