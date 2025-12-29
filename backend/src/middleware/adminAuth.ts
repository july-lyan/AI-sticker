import type { Request, Response, NextFunction } from 'express';
import { ADMIN_TOKEN } from '../utils/env.js';
import { fail } from '../utils/http.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_TOKEN) {
    res.status(404).json(fail('NOT_FOUND', 'Not found'));
    return;
  }

  const token = req.header('x-admin-token') || '';
  if (!token || token !== ADMIN_TOKEN) {
    res.status(401).json(fail('UNAUTHORIZED', 'Unauthorized'));
    return;
  }

  next();
}
