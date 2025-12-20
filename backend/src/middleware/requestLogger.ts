import type { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger.js';

function safeHeader(req: Request, name: string) {
  const v = req.header(name);
  return v ? String(v) : '';
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;

    const deviceId = safeHeader(req, 'x-device-id');
    const userId = (req as any).userId || '';

    log.info(
      `${res.statusCode} ${req.method} ${req.originalUrl} ${ms}ms ip=${req.ip} device=${deviceId} user=${userId}`
    );
  });

  next();
}
