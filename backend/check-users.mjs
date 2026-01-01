import fetch from 'node-fetch';
import dotenv from 'dotenv';

// 加载 .env
dotenv.config();

const API_BASE = process.env.API_URL || 'http://localhost:8080';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('❌ 错误: 未设置 ADMIN_TOKEN');
  console.error('💡 请在 backend/.env 中设置 ADMIN_TOKEN');
  process.exit(1);
}

async function checkUsers() {
  console.log('📊 查询累计用户数...');
  console.log(`API: ${API_BASE}`);
  console.log('');

  try {
    const response = await fetch(`${API_BASE}/api/admin/usage`, {
      headers: {
        'X-Admin-Token': ADMIN_TOKEN
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ 查询失败:');
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const result = await response.json();

    if (result.success) {
      console.log('✅ 累计去重用户数:', result.data.uniqueDevices);
      console.log('');
      console.log('💡 说明:');
      console.log('   - 按 X-Device-Id 去重统计');
      console.log('   - 只统计成功生成过至少一次的用户');
      if (process.env.REDIS_URL) {
        console.log('   - 数据持久化到 Redis（重启不丢失）');
      } else {
        console.log('   - ⚠️  使用内存存储（重启会归零）');
      }
    } else {
      console.error('❌ 查询失败:', result.message);
    }
  } catch (error) {
    console.error('❌ 请求错误:', error.message);
    console.error('');
    console.error('💡 可能的原因:');
    console.error('   1. 后端未启动');
    console.error('   2. ADMIN_TOKEN 不正确');
    console.error('   3. 端口不对（当前: ${API_BASE})');
  }
}

checkUsers();
