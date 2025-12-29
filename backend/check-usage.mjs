#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const API_BASE = process.env.API_URL || 'http://localhost:8080';
const API_URL = `${API_BASE}/api/admin/usage`;

async function checkUsage() {
  try {
    if (!ADMIN_TOKEN) {
      console.error('❌ 错误: 未设置 ADMIN_TOKEN');
      console.error('💡 请在 backend/.env 中设置 ADMIN_TOKEN');
      process.exit(1);
    }
    const response = await fetch(API_URL, {
      headers: {
        'x-admin-token': ADMIN_TOKEN
      }
    });

    if (!response.ok) {
      console.error(`❌ 请求失败: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('响应内容:', text);
      return;
    }

    const data = await response.json();

    console.log('\n📊 使用统计数据');
    console.log('━'.repeat(40));
    console.log(`独立设备数: ${data.data.uniqueDevices}`);
    console.log('━'.repeat(40));
    console.log('\n💡 提示: 当前使用内存存储（Redis 未运行）');
    console.log('   重启后端服务后数据会重置\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkUsage();
