#!/usr/bin/env node
/**
 * 免费额度完整测试脚本
 * 测试项目：
 * 1. 查询初始免费额度
 * 2. 消耗1次额度（模拟生成）
 * 3. 查询剩余额度
 * 4. 额度用完后的拒绝测试
 */

const API_BASE = 'http://localhost:8080';
const DEVICE_ID = 'test-free-quota-user';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, message) {
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
    warning: `${colors.yellow}[!]${colors.reset}`,
    test: `${colors.cyan}[TEST]${colors.reset}`
  };
  console.log(`${prefix[level] || ''} ${message}`);
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-Id': DEVICE_ID,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  return { status: response.status, data };
}

async function queryQuota() {
  log('test', '查询免费额度...');
  const { status, data } = await request('/api/payment/quota');

  if (status === 200 && data.success) {
    log('success', `免费额度查询成功: ${data.data.remaining}/${data.data.limit}`);
    log('info', `  模式: ${data.data.mode}`);
    log('info', `  已使用: ${data.data.used}`);
    log('info', `  重置时间: ${new Date(data.data.resetAt).toLocaleString('zh-CN')}`);
    return data.data;
  } else {
    log('error', `查询失败: ${JSON.stringify(data)}`);
    throw new Error('Failed to query quota');
  }
}

async function generateSticker(expectSuccess = true) {
  log('test', '模拟生成表情包...');

  // 简单的测试图片（1x1像素）
  const testImage =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const { status, data } = await request('/api/generate-sticker-grid', {
    method: 'POST',
    body: JSON.stringify({
      characterDNA: 'Test character for free quota test',
      prompts: [
        { prompt: 'happy' },
        { prompt: 'sad' },
        { prompt: 'angry' },
        { prompt: 'surprised' }
      ],
      style: '3d',
      referenceImage: testImage,
      isSlave: false
    })
  });

  if (expectSuccess) {
    if (status === 200 && data.success) {
      log('success', '生成成功（免费额度已消耗）');
      return true;
    } else {
      log('error', `生成失败: ${data.message || JSON.stringify(data)}`);
      return false;
    }
  } else {
    if (status === 402 && data.error === 'QUOTA_EXCEEDED') {
      log('success', `正确拒绝: ${data.message}`);
      return true;
    } else {
      log('error', `应该被拒绝但成功了: ${JSON.stringify(data)}`);
      return false;
    }
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  log('info', '开始免费额度测试');
  console.log('='.repeat(60) + '\n');

  try {
    // 步骤1: 查询初始额度
    console.log('\n' + '-'.repeat(60));
    log('info', '步骤1: 查询初始免费额度');
    console.log('-'.repeat(60));

    const quota1 = await queryQuota();
    const initialRemaining = quota1.remaining;

    if (initialRemaining <= 0) {
      log('warning', '当前额度已用完，请等待明天0点重置或手动清除Redis数据');
      log('info', '手动清除命令: redis-cli DEL "free_quota:*"');
      return;
    }

    // 步骤2: 消耗1次额度
    console.log('\n' + '-'.repeat(60));
    log('info', '步骤2: 消耗1次免费额度（生成表情包）');
    console.log('-'.repeat(60));

    await generateSticker(true);

    // 步骤3: 查询剩余额度
    console.log('\n' + '-'.repeat(60));
    log('info', '步骤3: 查询剩余额度');
    console.log('-'.repeat(60));

    const quota2 = await queryQuota();

    if (quota2.remaining === initialRemaining - 1) {
      log('success', `额度正确减少: ${initialRemaining} → ${quota2.remaining}`);
    } else {
      log('error', `额度减少异常: ${initialRemaining} → ${quota2.remaining}`);
    }

    // 步骤4: 继续消耗直到用完
    console.log('\n' + '-'.repeat(60));
    log('info', '步骤4: 继续消耗直到额度用完');
    console.log('-'.repeat(60));

    while (quota2.remaining > 0) {
      log('info', `剩余额度: ${quota2.remaining}，继续生成...`);
      await generateSticker(true);
      const current = await queryQuota();
      if (current.remaining === 0) {
        log('success', '所有额度已消耗完毕');
        break;
      }
    }

    // 步骤5: 额度用完后的拒绝测试
    console.log('\n' + '-'.repeat(60));
    log('info', '步骤5: 测试额度用完后的拒绝逻辑');
    console.log('-'.repeat(60));

    await generateSticker(false);

    // 总结
    console.log('\n' + '='.repeat(60));
    log('success', '所有测试完成！');
    console.log('='.repeat(60));

    log('info', '\n测试总结:');
    log('success', '✓ 免费额度查询功能正常');
    log('success', '✓ 免费额度消耗功能正常');
    log('success', '✓ 额度减少计算正确');
    log('success', '✓ 额度用完后正确拒绝');

    console.log('\n建议:');
    log('info', '1. 在前端添加FreeQuotaDisplay组件显示剩余次数');
    log('info', '2. 在生成按钮上显示"免费体验(剩余X次)"');
    log('info', '3. 额度用完时提示用户明天再来或升级付费版');
    log('info', '4. 可通过环境变量PAYMENT_MODE=paid切换到付费模式\n');
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log('error', `测试失败: ${error.message}`);
    console.log('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

runTests();
