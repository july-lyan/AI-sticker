import type { Request, Response, NextFunction } from 'express';
import { fail } from '../utils/http.js';

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
};

type Entry = { count: number; resetAt: number };

export function rateLimit(options: RateLimitOptions) {
  const store = new Map<string, Entry>();

  const windowMs = options.windowMs;
  const max = options.max;
  const keyFn = options.key || ((req: Request) => `${req.ip}:${req.path}`);

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = keyFn(req);

    const existing = store.get(key);
    if (!existing || now >= existing.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res
        .status(429)
        .json(
          fail('RATE_LIMITED', `请求过于频繁，请在 ${retryAfterSeconds}s 后重试`, {
            retryAfterSeconds
          })
        );
      return;
    }

    next();
  };
}

export function startRateLimitCleanup(intervalMs = 60_000) {
  // no-op placeholder for future shared store cleanup (kept simple for now)
  return { stop() {} };
}
