import { log } from '../utils/logger.js';

// 免费额度配置
export const FREE_QUOTA_PER_DAY = Number(process.env.FREE_QUOTA_PER_DAY || 3);

interface FreeQuota {
  userId: string;
  date: string; // YYYY-MM-DD
  used: number;
  limit: number;
  resetAt: string; // ISO timestamp
}

// 内存存储（替代PaymentStore，避免key前缀冲突）
const quotaStore = new Map<string, { value: FreeQuota; expiresAtMs: number }>();

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取明天0点的时间戳
 */
function getTomorrowMidnight(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * 获取免费额度Key
 */
function getQuotaKey(userId: string, date: string): string {
  return `free_quota:${userId}:${date}`;
}

/**
 * 从内存获取额度
 */
function getQuotaFromStore(key: string): FreeQuota | null {
  const entry = quotaStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAtMs) {
    quotaStore.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * 保存额度到内存
 */
function saveQuotaToStore(key: string, quota: FreeQuota, ttlSeconds: number): void {
  quotaStore.set(key, {
    value: quota,
    expiresAtMs: Date.now() + ttlSeconds * 1000
  });
}

/**
 * 获取用户今日免费额度
 */
export async function getFreeQuota(_, userId: string): Promise<FreeQuota> {
  const date = getTodayDate();
  const key = getQuotaKey(userId, date);

  const stored = getQuotaFromStore(key);

  if (stored) {
    return stored;
  }

  // 首次访问，初始化免费额度
  const quota: FreeQuota = {
    userId,
    date,
    used: 0,
    limit: FREE_QUOTA_PER_DAY,
    resetAt: getTomorrowMidnight()
  };

  // 存储到内存，24小时后自动过期
  saveQuotaToStore(key, quota, 86400);

  log.info(`[FreeQuota] Initialized quota for user ${userId}: ${quota.used}/${quota.limit}`);

  return quota;
}

/**
 * 消耗一次免费额度
 * @returns 成功返回true，额度不足返回false
 */
export async function consumeFreeQuota(_, userId: string): Promise<boolean> {
  const date = getTodayDate();
  const key = getQuotaKey(userId, date);

  const quota = await getFreeQuota(null, userId);

  if (quota.used >= quota.limit) {
    log.warn(`[FreeQuota] User ${userId} exceeded daily limit: ${quota.used}/${quota.limit}`);
    return false;
  }

  // 增加使用次数
  quota.used += 1;
  saveQuotaToStore(key, quota, 86400);

  log.info(`[FreeQuota] User ${userId} consumed quota: ${quota.used}/${quota.limit}`);

  return true;
}

/**
 * 检查用户是否还有免费额度
 */
export async function hasFreeQuota(_, userId: string): Promise<boolean> {
  const quota = await getFreeQuota(null, userId);
  return quota.used < quota.limit;
}

/**
 * 获取用户剩余免费次数
 */
export async function getRemainingQuota(_, userId: string): Promise<number> {
  const quota = await getFreeQuota(null, userId);
  return Math.max(0, quota.limit - quota.used);
}
