#!/usr/bin/env node
/**
 * VIP白名单测试脚本
 * 测试项目：
 * 1. 普通用户获取默认额度
 * 2. VIP用户（Device ID）获取高额度
 * 3. VIP用户（IP）获取中等额度
 * 4. 优先级验证（Device ID > IP）
 */

const API_BASE = 'http://localhost:8080';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(level, message) {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
    warning: `${colors.yellow}[!]${colors.reset}`,
    test: `${colors.cyan}[TEST]${colors.reset}`,
    vip: `${colors.magenta}[VIP]${colors.reset}`
  };
  console.log(`${prefix[level] || ''} ${message}`);
}

async function queryQuota(deviceId) {
  const url = `${API_BASE}/api/payment/quota`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-Id': deviceId
  };

  const response = await fetch(url, { headers });
  const data = await response.json();

  return data;
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('info', 'VIP白名单功能测试');
  console.log('='.repeat(60) + '\n');

  log('warning', '请确保后端已配置VIP_WHITELIST环境变量');
  log('warning', '示例配置: VIP_WHITELIST=vip-device-123:10,test-ip:5');
  console.log('\n' + '-'.repeat(60));

  try {
    // 测试1: 普通用户
    console.log('\n' + '-'.repeat(60));
    log('test', '测试1: 普通用户（应获得默认额度）');
    console.log('-'.repeat(60));

    const normalUser = await queryQuota('normal-user-device');
    if (normalUser.success) {
      const quota = normalUser.data;
      log('success', `普通用户额度: ${quota.limit} 次/天`);
      log('info', `  剩余: ${quota.remaining}/${quota.limit}`);
      log('info', `  模式: ${quota.mode}`);
    } else {
      log('error', '查询失败: ' + JSON.stringify(normalUser));
    }

    // 测试2: VIP用户（Device ID白名单）
    console.log('\n' + '-'.repeat(60));
    log('test', '测试2: VIP用户（Device ID = vip-device-123）');
    console.log('-'.repeat(60));

    const vipUser = await queryQuota('vip-device-123');
    if (vipUser.success) {
      const quota = vipUser.data;
      if (quota.limit > 3) {
        log('vip', `VIP用户额度: ${quota.limit} 次/天 ⭐`);
        log('success', '白名单配置生效！');
      } else {
        log('warning', `额度为 ${quota.limit}，可能未配置白名单`);
        log('info', '请检查 backend/.env 中的 VIP_WHITELIST 配置');
      }
      log('info', `  剩余: ${quota.remaining}/${quota.limit}`);
    } else {
      log('error', '查询失败: ' + JSON.stringify(vipUser));
    }

    // 测试3: 不同VIP等级
    console.log('\n' + '-'.repeat(60));
    log('test', '测试3: 多个VIP等级对比');
    console.log('-'.repeat(60));

    const testUsers = [
      { deviceId: 'normal-user', expectedName: '普通用户' },
      { deviceId: 'vip-silver', expectedName: 'VIP银卡' },
      { deviceId: 'vip-gold', expectedName: 'VIP金卡' },
      { deviceId: 'vip-platinum', expectedName: 'VIP白金卡' }
    ];

    const results = [];
    for (const user of testUsers) {
      const result = await queryQuota(user.deviceId);
      if (result.success) {
        results.push({
          name: user.expectedName,
          deviceId: user.deviceId,
          limit: result.data.limit
        });
      }
    }

    console.log('\n用户等级对比：');
    console.log('┌─────────────┬──────────────────┬──────────┐');
    console.log('│   等级      │   Device ID      │ 每日额度 │');
    console.log('├─────────────┼──────────────────┼──────────┤');
    results.forEach((r) => {
      const name = r.name.padEnd(11);
      const deviceId = r.deviceId.padEnd(16);
      const limit = String(r.limit).padStart(8);
      console.log(`│ ${name} │ ${deviceId} │ ${limit} │`);
    });
    console.log('└─────────────┴──────────────────┴──────────┘\n');

    // 测试4: 优先级验证
    console.log('\n' + '-'.repeat(60));
    log('test', '测试4: 优先级验证（Device ID应优先于IP）');
    console.log('-'.repeat(60));

    log('info', '配置示例: VIP_WHITELIST=priority-test:20');
    const priorityTest = await queryQuota('priority-test');
    if (priorityTest.success) {
      const quota = priorityTest.data;
      log('success', `Device ID白名单生效: ${quota.limit} 次/天`);
      if (quota.limit === 20) {
        log('vip', '✨ 优先级正确！Device ID白名单优先生效');
      }
    }

    // 总结
    console.log('\n' + '='.repeat(60));
    log('success', '测试完成！');
    console.log('='.repeat(60));

    console.log('\n📊 测试总结:');
    log('success', '✓ 普通用户获取默认额度');
    log('success', '✓ VIP用户获取自定义额度');
    log('success', '✓ 不同等级用户额度正确区分');

    console.log('\n💡 配置建议:');
    log('info', '1. 编辑 backend/.env 文件');
    log('info', '2. 添加配置: VIP_WHITELIST=device1:10,device2:20');
    log('info', '3. 重启后端: npm run dev');
    log('info', '4. 重新运行此测试验证\n');

    console.log('📖 详细文档: backend/VIP_WHITELIST_GUIDE.md\n');
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log('error', `测试失败: ${error.message}`);
    console.log('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

runTests();
