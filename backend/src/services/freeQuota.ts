import { createClient, RedisClientType } from 'redis';
import { log } from '../utils/logger.js';
import { REDIS_URL } from '../utils/env.js';

// 免费额度配置
export const FREE_QUOTA_PER_DAY = Number(process.env.FREE_QUOTA_PER_DAY || 3);

// IP 防刷配置
const IP_DEVICE_LIMIT = Number(process.env.IP_DEVICE_LIMIT || 10); // 同一IP最多允许的不同deviceId数量
const IP_DEVICE_WINDOW_SECONDS = 86400; // 24小时窗口

// VIP白名单配置
// 格式: deviceId1:quota1,deviceId2:quota2 或 IP:quota 或 userId:quota
// 示例: abc123:10,192.168.1.100:5
const VIP_WHITELIST_RAW = process.env.VIP_WHITELIST || '';

interface VIPConfig {
  identifier: string; // Device ID / IP / userId
  quota: number;      // 每日免费次数
}

const VIP_WHITELIST: Map<string, number> = new Map();

function parseVipWhitelist(raw: string): Map<string, number> {
  const map = new Map<string, number>();
  if (!raw.trim()) return map;

  // Support common separators: "," / "，" / ";" / newlines
  const entries = raw
    .replaceAll('\r', '')
    .split(/[,\n;，]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const withoutComment = entry.split('#')[0]?.trim() || '';
    if (!withoutComment) continue;

    // Use the last ":" as the identifier/quota separator to support IPv6 identifiers (e.g. "::1").
    const lastColon = withoutComment.lastIndexOf(':');
    if (lastColon <= 0 || lastColon === withoutComment.length - 1) continue;

    const identifier = withoutComment.slice(0, lastColon).trim();
    const quotaStr = withoutComment.slice(lastColon + 1).trim();
    const quota = Number(quotaStr);

    if (!identifier) continue;
    if (!Number.isFinite(quota) || quota <= 0) continue;

    map.set(identifier, quota);
    log.info(`[FreeQuota] VIP configured: ${identifier} → ${quota} quota/day`);
  }

  return map;
}

// 解析白名单配置
const parsedVipWhitelist = parseVipWhitelist(VIP_WHITELIST_RAW);
if (VIP_WHITELIST_RAW.trim() && parsedVipWhitelist.size === 0) {
  log.warn('[FreeQuota] VIP_WHITELIST is set but no valid entries were parsed. Check format like "id:10,ip:5".');
}
for (const [identifier, quota] of parsedVipWhitelist) {
  VIP_WHITELIST.set(identifier, quota);
}

// Redis 客户端单例
let redisClient: RedisClientType | null = null;
let useRedis = false;

async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient) return redisClient;
  if (!REDIS_URL) {
    log.warn('[FreeQuota] REDIS_URL not set; using in-memory store (data lost on restart)');
    return null;
  }

  try {
    redisClient = createClient({ url: REDIS_URL }) as RedisClientType;
    redisClient.on('error', (err) => log.error('[FreeQuota] Redis error:', err));
    await redisClient.connect();
    useRedis = true;
    log.info('[FreeQuota] Redis connected for quota storage');
    return redisClient;
  } catch (err) {
    log.error('[FreeQuota] Failed to connect Redis, falling back to memory:', err);
    return null;
  }
}

/**
 * 判断用户是否在VIP白名单中
 * 匹配优先级：Device ID > IP > userId
 */
export function isVipUser(userId: string): boolean {
  return getVipMatchInfo(userId).isVip;
}

export function getVipMatchInfo(userId: string): { isVip: boolean; by: 'deviceId' | 'ip' | 'userId' | null; quota?: number } {
  const parts = userId.split('_');
  const ip = parts[0];
  const deviceId = parts.length > 1 ? parts[1] : '';

  if (deviceId && VIP_WHITELIST.has(deviceId)) {
    const quota = VIP_WHITELIST.get(deviceId)!;
    return { isVip: true, by: 'deviceId', quota };
  }
  if (VIP_WHITELIST.has(ip)) {
    const quota = VIP_WHITELIST.get(ip)!;
    return { isVip: true, by: 'ip', quota };
  }
  if (VIP_WHITELIST.has(userId)) {
    const quota = VIP_WHITELIST.get(userId)!;
    return { isVip: true, by: 'userId', quota };
  }
  return { isVip: false, by: null };
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

// IP 设备追踪（防刷）
interface IpDeviceTracker {
  devices: Set<string>;
  blocked: boolean;
}

// 内存存储（作为 Redis 的降级方案）
const memoryQuotaStore = new Map<string, { value: FreeQuota; expiresAtMs: number }>();
const memoryIpDeviceStore = new Map<string, { value: IpDeviceTracker; expiresAtMs: number }>();

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
 * 获取 IP 设备追踪 Key
 */
function getIpDeviceKey(ip: string, date: string): string {
  return `ip_devices:${ip}:${date}`;
}

/**
 * 从存储获取额度（支持 Redis 和内存）
 */
async function getQuotaFromStore(key: string): Promise<FreeQuota | null> {
  const client = await getRedisClient();

  if (client) {
    try {
      const raw = await client.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      log.error('[FreeQuota] Redis get error:', err);
    }
  }

  // 降级到内存
  const entry = memoryQuotaStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAtMs) {
    memoryQuotaStore.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * 保存额度到存储（支持 Redis 和内存）
 */
async function saveQuotaToStore(key: string, quota: FreeQuota, ttlSeconds: number): Promise<void> {
  const client = await getRedisClient();

  if (client) {
    try {
      await client.set(key, JSON.stringify(quota), { EX: ttlSeconds });
      return;
    } catch (err) {
      log.error('[FreeQuota] Redis set error:', err);
    }
  }

  // 降级到内存
  memoryQuotaStore.set(key, {
    value: quota,
    expiresAtMs: Date.now() + ttlSeconds * 1000
  });
}

/**
 * 检查并记录 IP 下的设备（防刷检测）
 * @returns { allowed: boolean, deviceCount: number }
 */
export async function checkIpDeviceLimit(ip: string, deviceId: string): Promise<{ allowed: boolean; deviceCount: number }> {
  const date = getTodayDate();
  const key = getIpDeviceKey(ip, date);
  const client = await getRedisClient();

  if (client) {
    try {
      // 使用 Redis Set 来追踪设备
      await client.sAdd(key, deviceId);
      await client.expire(key, IP_DEVICE_WINDOW_SECONDS);
      const deviceCount = await client.sCard(key);

      if (deviceCount > IP_DEVICE_LIMIT) {
        log.warn(`[FreeQuota] IP ${ip} exceeded device limit: ${deviceCount}/${IP_DEVICE_LIMIT}`);
        return { allowed: false, deviceCount: Number(deviceCount) };
      }
      return { allowed: true, deviceCount: Number(deviceCount) };
    } catch (err) {
      log.error('[FreeQuota] Redis IP check error:', err);
    }
  }

  // 降级到内存
  let entry = memoryIpDeviceStore.get(key);
  if (!entry || Date.now() > entry.expiresAtMs) {
    entry = {
      value: { devices: new Set(), blocked: false },
      expiresAtMs: Date.now() + IP_DEVICE_WINDOW_SECONDS * 1000
    };
    memoryIpDeviceStore.set(key, entry);
  }

  entry.value.devices.add(deviceId);
  const deviceCount = entry.value.devices.size;

  if (deviceCount > IP_DEVICE_LIMIT) {
    entry.value.blocked = true;
    log.warn(`[FreeQuota] IP ${ip} exceeded device limit: ${deviceCount}/${IP_DEVICE_LIMIT}`);
    return { allowed: false, deviceCount };
  }

  return { allowed: true, deviceCount };
}

/**
 * 获取用户今日免费额度
 */
export async function getFreeQuota(_store: unknown, userId: string): Promise<FreeQuota> {
  const date = getTodayDate();
  const key = getQuotaKey(userId, date);

  const stored = await getQuotaFromStore(key);

  if (stored) {
    // Keep limit in sync with current VIP whitelist/env config without requiring quota reset.
    const currentLimit = getUserQuotaLimit(userId);
    if (stored.limit !== currentLimit) {
      stored.limit = currentLimit;
      await saveQuotaToStore(key, stored, 86400);
      log.info(`[FreeQuota] Updated quota limit for user ${userId}: limit=${stored.limit}`);
    }
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

  // 存储，24小时后自动过期
  await saveQuotaToStore(key, quota, 86400);

  log.info(`[FreeQuota] Initialized quota for user ${userId}: ${quota.used}/${quota.limit}`);

  return quota;
}

/**
 * 消耗一次免费额度
 * @returns 成功返回true，额度不足返回false
 */
export async function consumeFreeQuota(_store: unknown, userId: string): Promise<boolean> {
  const date = getTodayDate();
  const key = getQuotaKey(userId, date);

  const quota = await getFreeQuota(null, userId);

  if (quota.used >= quota.limit) {
    log.warn(`[FreeQuota] User ${userId} exceeded daily limit: ${quota.used}/${quota.limit}`);
    return false;
  }

  // 增加使用次数
  quota.used += 1;
  await saveQuotaToStore(key, quota, 86400);

  log.info(`[FreeQuota] User ${userId} consumed quota: ${quota.used}/${quota.limit}`);

  return true;
}

/**
 * 检查用户是否还有免费额度
 */
export async function hasFreeQuota(_store: unknown, userId: string): Promise<boolean> {
  const quota = await getFreeQuota(null, userId);
  return quota.used < quota.limit;
}

/**
 * 获取用户剩余免费次数
 */
export async function getRemainingQuota(_store: unknown, userId: string): Promise<number> {
  const quota = await getFreeQuota(null, userId);
  return Math.max(0, quota.limit - quota.used);
}

/**
 * 返还一次免费额度（用于失败回滚）
 * @returns 成功返回true，失败返回false
 */
export async function refundFreeQuota(_store: unknown, userId: string): Promise<boolean> {
  const date = getTodayDate();
  const key = getQuotaKey(userId, date);

  const quota = await getFreeQuota(null, userId);

  if (quota.used <= 0) {
    log.warn(`[FreeQuota] Cannot refund for user ${userId}: used=${quota.used}`);
    return false;
  }

  // 减少使用次数
  quota.used -= 1;
  await saveQuotaToStore(key, quota, 86400);

  log.info(`[FreeQuota] Refunded quota for user ${userId}: ${quota.used}/${quota.limit}`);

  return true;
}
