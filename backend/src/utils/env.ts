export type NodeEnv = 'development' | 'test' | 'production';

export const NODE_ENV: NodeEnv = (process.env.NODE_ENV as NodeEnv) || 'development';

export const PORT = Number(process.env.PORT || 8080);

// Support multiple API keys (comma-separated)
const rawApiKeys = process.env.GEMINI_API_KEY || '';
export const GEMINI_API_KEYS = rawApiKeys
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

// Legacy single key export (uses first key)
export const GEMINI_API_KEY = GEMINI_API_KEYS[0] || '';

export const REDIS_URL = process.env.REDIS_URL || '';

export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Admin endpoints protection
export const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Usage metrics (cumulative unique devices)
export const USAGE_UNIQUE_DEVICES_KEY = process.env.USAGE_UNIQUE_DEVICES_KEY || 'usage:unique_devices:v1';

// Rate limiting (in-memory, per instance)
export const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 60);

export const isProduction = NODE_ENV === 'production';
export const isDev = !isProduction;

// Payment mode: 'free' (free quota) or 'paid' (real payment required)
export const PAYMENT_MODE = (process.env.PAYMENT_MODE || 'free') as 'free' | 'paid';

// Free quota configuration (only used when PAYMENT_MODE='free')
export const FREE_QUOTA_PER_DAY = Number(process.env.FREE_QUOTA_PER_DAY || 3);
