#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const API_BASE_ROOT = process.env.API_URL || 'http://localhost:8080';
const API_BASE = `${API_BASE_ROOT}/api/admin`;

// Parse command line arguments
const args = process.argv.slice(2);
const period = args[0] || 'day'; // day, week, month
const days = parseInt(args[1]) || 30; // default last 30 days

if (!['day', 'week', 'month'].includes(period)) {
  console.error('❌ Period must be: day, week, or month');
  console.log('Usage: node view-stats.mjs [period] [days]');
  console.log('  period: day|week|month (default: day)');
  console.log('  days: number of days to look back (default: 30)');
  process.exit(1);
}

async function viewStats() {
  try {
    if (!ADMIN_TOKEN) {
      console.error('❌ 错误: 未设置 ADMIN_TOKEN');
      console.error('💡 请在 backend/.env 中设置 ADMIN_TOKEN');
      process.exit(1);
    }
    // Calculate date range
    const end = new Date().toISOString().split('T')[0];
    const start = new Date();
    start.setDate(start.getDate() - days);
    const startDate = start.toISOString().split('T')[0];

    const url = `${API_BASE}/stats?period=${period}&start=${startDate}&end=${end}`;
    const response = await fetch(url, {
      headers: { 'x-admin-token': ADMIN_TOKEN }
    });

    if (!response.ok) {
      console.error(`❌ 请求失败: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    const { stats, start: actualStart, end: actualEnd } = result.data;

    // Display header
    console.log('\n📊 使用统计报表');
    console.log('━'.repeat(60));
    console.log(`时间范围: ${actualStart} 至 ${actualEnd}`);
    console.log(`统计周期: ${period === 'day' ? '按日' : period === 'week' ? '按周' : '按月'}`);
    console.log('━'.repeat(60));

    // Display table
    console.log(`\n${'日期'.padEnd(15)} | ${'独立用户(UV)'.padEnd(15)} | ${'使用次数(PV)'.padEnd(15)}`);
    console.log('-'.repeat(60));

    let totalUV = 0;
    let totalPV = 0;

    for (const stat of stats) {
      const dateStr = stat.date.padEnd(15);
      const uvStr = stat.uv.toString().padEnd(15);
      const pvStr = stat.pv.toString().padEnd(15);
      console.log(`${dateStr} | ${uvStr} | ${pvStr}`);
      totalUV += stat.uv;
      totalPV += stat.pv;
    }

    console.log('-'.repeat(60));
    console.log(`${'合计'.padEnd(15)} | ${totalUV.toString().padEnd(15)} | ${totalPV.toString().padEnd(15)}`);
    console.log('━'.repeat(60));

    // Get overall stats
    const overallResponse = await fetch(`${API_BASE}/usage`, {
      headers: { 'x-admin-token': ADMIN_TOKEN }
    });

    if (overallResponse.ok) {
      const overallResult = await overallResponse.json();
      console.log(`\n📈 累计独立用户数: ${overallResult.data.uniqueDevices}`);
    }

    console.log('\n💡 提示:');
    console.log('  - UV (Unique Visitors): 独立用户/设备数');
    console.log('  - PV (Page Views): 总使用次数');
    if (period === 'week' || period === 'month') {
      console.log('  - 注意: 周/月汇总的UV目前为0，需要实现跨期间去重');
    }
    console.log('');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

viewStats();
