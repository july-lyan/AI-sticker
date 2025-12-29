import { createClient, type RedisClientType } from 'redis';
import { log } from '../utils/logger.js';
import { REDIS_URL, USAGE_UNIQUE_DEVICES_KEY } from '../utils/env.js';

let redisClient: RedisClientType | null = null;
let warnedNoRedis = false;
const memoryUniqueDevices = new Set<string>();
const memoryDailyStats = new Map<string, { devices: Set<string>; count: number }>();

// Daily stats key format: stats:daily:{YYYY-MM-DD}:devices|count
function getDailyStatsKeys(date: string) {
  return {
    devices: `stats:daily:${date}:devices`,
    count: `stats:daily:${date}:count`
  };
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient) return redisClient;
  if (!REDIS_URL) {
    if (!warnedNoRedis) {
      warnedNoRedis = true;
      log.warn('[UsageMetrics] REDIS_URL not set; using in-memory store (data lost on restart)');
    }
    return null;
  }

  try {
    redisClient = createClient({ url: REDIS_URL }) as RedisClientType;
    redisClient.on('error', (err) => log.error('[UsageMetrics] Redis error:', err));
    await redisClient.connect();
    log.info('[UsageMetrics] Redis connected for usage metrics');
    return redisClient;
  } catch (err) {
    log.error('[UsageMetrics] Failed to connect Redis, falling back to memory:', err);
    return null;
  }
}

export async function trackUniqueDevice(deviceId: string): Promise<void> {
  const clean = String(deviceId || '').trim();
  if (!clean) return;

  const today = getTodayDate();
  const client = await getRedisClient();

  if (client) {
    try {
      const keys = getDailyStatsKeys(today);
      // Track overall unique devices
      await client.sAdd(USAGE_UNIQUE_DEVICES_KEY, clean);
      // Track daily unique devices
      await client.sAdd(keys.devices, clean);
      // Increment daily usage count
      await client.incr(keys.count);
      // Set expiry for daily stats (keep 365 days)
      await client.expire(keys.devices, 365 * 24 * 60 * 60);
      await client.expire(keys.count, 365 * 24 * 60 * 60);
      return;
    } catch (err) {
      log.error('[UsageMetrics] Redis tracking error:', err);
    }
  }

  // Fallback to memory
  memoryUniqueDevices.add(clean);
  if (!memoryDailyStats.has(today)) {
    memoryDailyStats.set(today, { devices: new Set(), count: 0 });
  }
  const dailyStats = memoryDailyStats.get(today)!;
  dailyStats.devices.add(clean);
  dailyStats.count++;
}

export async function getUniqueDeviceCount(): Promise<number> {
  const client = await getRedisClient();
  if (client) {
    try {
      const count = await client.sCard(USAGE_UNIQUE_DEVICES_KEY);
      return Number(count) || 0;
    } catch (err) {
      log.error('[UsageMetrics] Redis sCard error:', err);
    }
  }

  return memoryUniqueDevices.size;
}

export interface DailyStats {
  date: string;
  uv: number; // Unique visitors (devices)
  pv: number; // Page views (usage count)
}

/**
 * Get daily statistics for a date range
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 */
export async function getDailyStats(startDate: string, endDate: string): Promise<DailyStats[]> {
  const client = await getRedisClient();
  const results: DailyStats[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: string[] = [];

  // Generate date list
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  if (client) {
    try {
      for (const date of dates) {
        const keys = getDailyStatsKeys(date);
        const [uv, pvStr] = await Promise.all([
          client.sCard(keys.devices),
          client.get(keys.count)
        ]);
        results.push({
          date,
          uv: Number(uv) || 0,
          pv: Number(pvStr) || 0
        });
      }
      return results;
    } catch (err) {
      log.error('[UsageMetrics] getDailyStats error:', err);
    }
  }

  // Fallback to memory
  for (const date of dates) {
    const stats = memoryDailyStats.get(date);
    results.push({
      date,
      uv: stats?.devices.size || 0,
      pv: stats?.count || 0
    });
  }

  return results;
}

/**
 * Aggregate stats by week or month
 */
export async function getAggregatedStats(
  startDate: string,
  endDate: string,
  period: 'day' | 'week' | 'month'
): Promise<DailyStats[]> {
  const dailyStats = await getDailyStats(startDate, endDate);

  if (period === 'day') {
    return dailyStats;
  }

  const aggregated = new Map<string, { devices: Set<string>; pv: number }>();

  for (const stat of dailyStats) {
    let key: string;
    const date = new Date(stat.date);

    if (period === 'week') {
      // ISO week: get Monday of the week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      key = monday.toISOString().split('T')[0];
    } else {
      // month
      key = stat.date.substring(0, 7); // YYYY-MM
    }

    if (!aggregated.has(key)) {
      aggregated.set(key, { devices: new Set(), pv: 0 });
    }

    const agg = aggregated.get(key)!;
    // Note: We can't accurately aggregate UV without device IDs, so we sum them
    // For accurate UV aggregation, we'd need to fetch actual device IDs
    agg.pv += stat.pv;
  }

  return Array.from(aggregated.entries()).map(([date, data]) => ({
    date,
    uv: 0, // Placeholder - accurate UV aggregation requires device ID deduplication
    pv: data.pv
  })).sort((a, b) => a.date.localeCompare(b.date));
}

