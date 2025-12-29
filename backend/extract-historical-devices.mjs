#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from 'redis';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const REDIS_URL = process.env.REDIS_URL;
const PATTERN = process.env.HISTORICAL_USAGE_PATTERN || 'free_quota:*';
const USAGE_KEY = 'usage:unique_devices:v1';

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

async function extractHistoricalDevices() {
  if (!REDIS_URL) {
    console.error('❌ 未设置 REDIS_URL（请在 backend/.env 中配置）');
    process.exit(1);
  }
  const client = createClient({ url: REDIS_URL });

  try {
    await client.connect();
    console.log('✅ 已连接到 Redis');

    // 查找所有 free_quota 的 key
    const keys = await scanKeys(client, PATTERN);
    console.log(`📦 找到 ${keys.length} 个配额记录`);

    const deviceIds = new Set();

    // 从 key 中提取 deviceId
    // key 格式: free_quota:IP_deviceId:date
    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length >= 2) {
        const userId = parts[1]; // IP_deviceId
        const underscoreIndex = userId.indexOf('_');
        if (underscoreIndex >= 0) {
          const deviceId = userId.slice(underscoreIndex + 1); // 支持 deviceId 中有下划线
          if (deviceId) {
            deviceIds.add(deviceId);
          }
        }
      }
    }

    console.log(`🔍 发现 ${deviceIds.size} 个独立设备`);

    // 导入到统计集合中
    if (deviceIds.size > 0) {
      await client.sAdd(USAGE_KEY, Array.from(deviceIds));
      console.log(`✅ 已导入历史数据到统计系统`);
    }

    // 验证结果
    const count = await client.sCard(USAGE_KEY);
    console.log(`\n📊 当前统计: ${count} 个独立设备\n`);

    await client.disconnect();
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

extractHistoricalDevices();
