#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from 'redis';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const REDIS_URL = process.env.REDIS_URL;
const PATTERN = process.env.HISTORICAL_USAGE_PATTERN || 'free_quota:*';

async function scanKeys(client, pattern) {
  let cursor = '0';
  const keys = [];
  do {
    const res = await client.scan(cursor, { MATCH: pattern, COUNT: 1000 });
    cursor = res.cursor;
    if (res.keys?.length) keys.push(...res.keys);
  } while (cursor !== '0');
  return keys;
}

async function restoreDailyStats() {
  if (!REDIS_URL) {
    console.error('❌ 未设置 REDIS_URL（请在 backend/.env 中配置）');
    process.exit(1);
  }
  const client = createClient({ url: REDIS_URL });

  try {
    await client.connect();
    console.log('✅ 已连接到 Redis\n');

    // 查找所有 free_quota 的 key
    const keys = await scanKeys(client, PATTERN);
    console.log(`📦 找到 ${keys.length} 个配额记录\n`);

    // 按日期分组统计
    const dailyData = new Map(); // date -> { devices: Set, count: number }

    for (const key of keys) {
      // key 格式: free_quota:IP_deviceId:YYYY-MM-DD
      const parts = key.split(':');
      if (parts.length >= 3) {
        const userId = parts[1]; // IP_deviceId
        const date = parts[2]; // YYYY-MM-DD

        // 提取 deviceId
        const underscoreIndex = userId.indexOf('_');
        if (underscoreIndex >= 0) {
          const deviceId = userId.slice(underscoreIndex + 1);

          if (!dailyData.has(date)) {
            dailyData.set(date, { devices: new Set(), count: 0 });
          }

          const dayStats = dailyData.get(date);
          dayStats.devices.add(deviceId);

          // 获取这个 key 的使用次数
          try {
            const quotaData = await client.get(key);
            if (quotaData) {
              const quota = JSON.parse(quotaData);
              dayStats.count += quota.used || 0;
            }
          } catch (err) {
            // 忽略解析错误
          }
        }
      }
    }

    console.log(`📅 发现 ${dailyData.size} 天的历史数据\n`);
    console.log('开始导入到统计系统...\n');

    let imported = 0;
    for (const [date, data] of Array.from(dailyData.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const devicesKey = `stats:daily:${date}:devices`;
      const countKey = `stats:daily:${date}:count`;

      // 导入设备集合
      if (data.devices.size > 0) {
        await client.sAdd(devicesKey, Array.from(data.devices));
      }

      // 设置使用次数
      if (data.count > 0) {
        await client.set(countKey, data.count);
      }

      // 设置过期时间（365天）
      await client.expire(devicesKey, 365 * 24 * 60 * 60);
      await client.expire(countKey, 365 * 24 * 60 * 60);

      console.log(`  ${date}: UV=${data.devices.size}, PV=${data.count}`);
      imported++;
    }

    console.log(`\n✅ 成功导入 ${imported} 天的统计数据\n`);

    await client.disconnect();
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

restoreDailyStats();
