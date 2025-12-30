#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from 'redis';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const REDIS_URL = process.env.REDIS_URL;
const PATTERN = process.env.HISTORICAL_USAGE_PATTERN || 'free_quota:*';
const START = process.env.HISTORICAL_USAGE_START || '';
const END = process.env.HISTORICAL_USAGE_END || '';
const CONNECT_TIMEOUT_MS = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 8000);
const SCAN_COUNT = Number(process.env.REDIS_SCAN_COUNT || 1000);
const COMMAND_TIMEOUT_MS = Number(process.env.REDIS_COMMAND_TIMEOUT_MS || 30000);
const PROGRESS_EVERY_MS = Number(process.env.REDIS_PROGRESS_EVERY_MS || 2000);

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

function parseArgs(argv) {
  const args = {};
  for (const item of argv) {
    if (!item.startsWith('--')) continue;
    const [k, v] = item.slice(2).split('=');
    args[k] = v ?? true;
  }
  return args;
}

function parseFreeQuotaKey(key) {
  // Expected: free_quota:${userId}:${YYYY-MM-DD}
  const parts = key.split(':');
  if (parts.length < 3) return null;
  const userId = parts[1];
  const date = parts[2];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  // userId format: IP_deviceId (deviceId may contain underscores)
  const underscoreIndex = userId.indexOf('_');
  const deviceId = underscoreIndex >= 0 ? userId.slice(underscoreIndex + 1) : '';
  if (!deviceId) return null;

  return { date, deviceId };
}

function inRange(date, start, end) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function getDateList(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];
  const dates = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node stats-historical-daily.mjs [--source=daily|free_quota] [--start=YYYY-MM-DD] [--end=YYYY-MM-DD]');
    console.log('Default source: daily (stats:daily:*).');
    console.log('Env: REDIS_URL, HISTORICAL_USAGE_PATTERN (only for free_quota source, default: free_quota:*)');
    process.exit(0);
  }

  if (!REDIS_URL) {
    console.error('❌ 未设置 REDIS_URL（请在 backend/.env 中配置）');
    process.exit(1);
  }

  const source = String(args.source || process.env.HISTORICAL_USAGE_SOURCE || 'daily');
  const defaults = getDefaultRange();
  const start = String(args.start || START || defaults.start);
  const end = String(args.end || END || defaults.end);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    console.error('❌ start/end 必须是 YYYY-MM-DD（例如: --start=2025-12-01 --end=2025-12-31）');
    process.exit(1);
  }

  console.error('🔌 连接 Redis...');
  const client = createClient({
    url: REDIS_URL,
    socket: {
      connectTimeout: CONNECT_TIMEOUT_MS,
      reconnectStrategy: (retries) => {
        if (retries >= 3) return new Error('Redis reconnect retries exceeded');
        return Math.min(250 * 2 ** retries, 2000);
      }
    }
  });
  client.on('error', (err) => console.error('❌ Redis error:', err?.message || err));
  await client.connect();

  try {
    const dates = getDateList(start, end);
    if (!dates.length) {
      console.error('❌ 无效的日期范围');
      process.exit(1);
    }

    if (source === 'daily') {
      console.error(`🔎 读取每日统计（stats:daily:{date}:devices/count），范围 ${start} ~ ${end} ...`);

      console.log('日\t人数\t次数');
      let totalPeople = 0;
      let totalCount = 0;

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const devicesKey = `stats:daily:${date}:devices`;
        const countKey = `stats:daily:${date}:count`;

        const [uv, pvStr] = await withTimeout(
          Promise.all([client.sCard(devicesKey), client.get(countKey)]),
          COMMAND_TIMEOUT_MS,
          'SCARD/GET'
        );

        const people = Number(uv) || 0;
        const count = Number(pvStr) || 0;
        console.log(`${date}\t${people}\t${count}`);
        totalPeople += people;
        totalCount += count;

        if ((i + 1) % 30 === 0) {
          console.error(`…已处理 ${i + 1}/${dates.length} 天`);
        }
      }

      console.log(`合计\t${totalPeople}\t${totalCount}`);
      return;
    }

    if (source !== 'free_quota') {
      console.error('❌ source 只能是 daily 或 free_quota');
      process.exit(1);
    }

    const daily = new Map(); // date -> { devices: Set<string>, pv: number }

    console.error(`🔎 扫描 free_quota 历史记录（pattern=${PATTERN}，注意：该类 key 默认只保留约 24 小时）...`);
    let cursor = '0';
    let scanned = 0;
    let matched = 0;
    let lastProgressAt = Date.now();
    do {
      const res = await withTimeout(
        client.scan(cursor, { MATCH: PATTERN, COUNT: SCAN_COUNT }),
        COMMAND_TIMEOUT_MS,
        'SCAN'
      );
      cursor = String(res.cursor);
      const batchKeys = res.keys || [];
      if (!batchKeys.length) continue;

      scanned += batchKeys.length;
      const values = await withTimeout(client.mGet(batchKeys), COMMAND_TIMEOUT_MS, 'MGET');

      for (let j = 0; j < batchKeys.length; j++) {
        const key = batchKeys[j];
        const meta = parseFreeQuotaKey(key);
        if (!meta) continue;
        if (!inRange(meta.date, start, end)) continue;
        matched++;

        if (!daily.has(meta.date)) {
          daily.set(meta.date, { devices: new Set(), pv: 0 });
        }
        const entry = daily.get(meta.date);
        entry.devices.add(meta.deviceId);

        const raw = values[j];
        if (!raw) continue;
        try {
          const quota = JSON.parse(raw);
          entry.pv += Number(quota?.used) || 0;
        } catch {
          // ignore parse error
        }
      }

      const now = Date.now();
      if (now - lastProgressAt >= PROGRESS_EVERY_MS) {
        lastProgressAt = now;
        console.error(`…已扫描 ${scanned} 条 key（命中范围内 ${matched} 条，cursor=${cursor}）`);
      }
    } while (cursor !== '0');

    console.log('日\t人数\t次数');
    let totalPeople = 0;
    let totalCount = 0;
    for (const date of dates) {
      const entry = daily.get(date);
      const people = entry?.devices.size || 0;
      const count = entry?.pv || 0;
      console.log(`${date}\t${people}\t${count}`);
      totalPeople += people;
      totalCount += count;
    }
    console.log(`合计\t${totalPeople}\t${totalCount}`);
  } finally {
    await client.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ 错误:', err?.message || err);
  process.exit(1);
});
