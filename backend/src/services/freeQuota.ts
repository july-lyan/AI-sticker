import { log } from '../utils/logger.js';

// 免费额度配置
export const FREE_QUOTA_PER_DAY = Number(process.env.FREE_QUOTA_PER_DAY || 3);

// VIP白名单配置
// 格式: deviceId1:quota1,deviceId2:quota2 或 IP:quota 或 userId:quota
// 示例: abc123:10,192.168.1.100:5
const VIP_WHITELIST_RAW = process.env.VIP_WHITELIST || '';

interface VIPConfig {
  identifier: string; // Device ID / IP / userId
  quota: number;      // 每日免费次数
}

const VIP_WHITELIST: Map<string, number> = new Map();

// 解析白名单配置
if (VIP_WHITELIST_RAW) {
  VIP_WHITELIST_RAW.split(',').forEach((entry) => {
    const [identifier, quotaStr] = entry.trim().split(':');
    if (identifier && quotaStr) {
      const quota = Number(quotaStr);
      if (!isNaN(quota) && quota > 0) {
        VIP_WHITELIST.set(identifier, quota);
        log.info(`[FreeQuota] VIP configured: ${identifier} → ${quota} quota/day`);
      }
    }
  });
}

/**
 * 获取用户的每日免费额度（考虑白名单）
 * 优先级：Device ID > IP > userId > 默认
 */
function getUserQuotaLimit(userId: string): number {
  // userId格式: IP_DeviceID
  const parts = userId.split('_');
  const ip = parts[0];
  const deviceId = parts.length > 1 ? parts[1] : '';

  // 优先级1: 检查Device ID白名单
  if (deviceId && VIP_WHITELIST.has(deviceId)) {
    const quota = VIP_WHITELIST.get(deviceId)!;
    log.info(`[FreeQuota] VIP user (Device ID): ${deviceId} → ${quota} quota/day`);
    return quota;
  }

  // 优先级2: 检查IP白名单
  if (VIP_WHITELIST.has(ip)) {
    const quota = VIP_WHITELIST.get(ip)!;
    log.info(`[FreeQuota] VIP user (IP): ${ip} → ${quota} quota/day`);
    return quota;
  }

  // 优先级3: 检查完整userId白名单
  if (VIP_WHITELIST.has(userId)) {
    const quota = VIP_WHITELIST.get(userId)!;
    log.info(`[FreeQuota] VIP user (userId): ${userId} → ${quota} quota/day`);
    return quota;
  }

  // 默认额度
  return FREE_QUOTA_PER_DAY;
}

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

  // 首次访问，初始化免费额度（考虑白名单）
  const userLimit = getUserQuotaLimit(userId);

  const quota: FreeQuota = {
    userId,
    date,
    used: 0,
    limit: userLimit,
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
