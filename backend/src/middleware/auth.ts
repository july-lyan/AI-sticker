import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      deviceId?: string;
      userId?: string;
    }
  }
}

export function identifyUser(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header('x-device-id') || '';
  if (!deviceId) {
    res.status(400).json({
      success: false,
      error: 'MISSING_DEVICE_ID',
      message: '缺少请求头 X-Device-Id'
    });
    return;
  }

  const ip = req.ip || 'unknown';
  req.deviceId = deviceId;
  req.userId = `${ip}_${deviceId}`;
  next();
}
