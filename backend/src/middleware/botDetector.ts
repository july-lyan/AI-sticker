import type { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger.js';

// 常见搜索引擎和爬虫的 User-Agent 关键词
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i, // Yahoo
  /bingbot/i,
  /googlebot/i,
  /baiduspider/i,
  /yandex/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /slack/i
];

/**
 * 检测请求是否来自搜索引擎爬虫
 */
export function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * 中间件：拦截爬虫对 API 路径的访问
 */
export function blockBotsFromApi(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('user-agent') || '';

  // 只拦截访问 /api 路径的爬虫
  if (req.path.startsWith('/api') && isBot(userAgent)) {
    log.info(
      `Bot blocked from API: ${req.method} ${req.path} - User-Agent: ${userAgent.substring(0, 100)}`
    );
    res.status(403).send('API access not allowed for bots. Please check /robots.txt');
    return;
  }

  next();
}
