import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:8080';
const TEST_DEVICE_ID = 'test-refund-' + Date.now();

console.log('🧪 免费额度返还测试');
console.log('='.repeat(50));
console.log(`API: ${API_BASE}`);
console.log(`Device ID: ${TEST_DEVICE_ID}`);
console.log('='.repeat(50));
console.log('');

async function testQuotaRefund() {
  try {
    // 1. 查看初始额度
    console.log('📊 步骤 1: 查看初始额度');
    let quota = await getQuota();
    console.log(`   剩余额度: ${quota.remaining}/${quota.limit}`);
    console.log(`   已使用: ${quota.used}`);
    console.log(`   重置时间: ${quota.resetAt}`);
    console.log('');

    const initialRemaining = quota.remaining;
    const initialUsed = quota.used;

    if (initialRemaining <= 0) {
      console.log('❌ 错误：没有剩余额度，无法测试');
      console.log('💡 提示：清空 Redis 或等到明天重置');
      console.log('   命令: redis-cli DEL free_quota:*');
      return;
    }

    // 2. 尝试生成（预期失败）
    console.log('🎨 步骤 2: 尝试生成图片（预期失败）');
    console.log('   发送生成请求...');

    let generationFailed = false;
    let errorMessage = '';

    try {
      await generateSticker();
      console.log('   ⚠️  意外：生成成功了（应该失败）');
    } catch (error) {
      generationFailed = true;
      errorMessage = error.message;
      console.log(`   ✅ 生成失败（符合预期）`);
      console.log(`   错误信息: ${errorMessage}`);
    }
    console.log('');

    if (!generationFailed) {
      console.log('⚠️  警告：测试无法继续，因为生成没有失败');
      console.log('💡 提示：请确保已添加测试代码到 gemini.ts');
      return;
    }

    // 3. 等待服务器处理
    console.log('⏳ 步骤 3: 等待服务器处理返还...');
    await sleep(2000);
    console.log('   完成');
    console.log('');

    // 4. 再次查看额度
    console.log('🔍 步骤 4: 检查额度是否返还');
    quota = await getQuota();
    console.log(`   剩余额度: ${quota.remaining}/${quota.limit}`);
    console.log(`   已使用: ${quota.used}`);
    console.log('');

    // 5. 验证结果
    console.log('📋 测试结果');
    console.log('='.repeat(50));

    const remainingMatches = quota.remaining === initialRemaining;
    const usedMatches = quota.used === initialUsed;

    if (remainingMatches && usedMatches) {
      console.log('✅ 测试通过！额度成功返还');
      console.log('');
      console.log('   详细对比:');
      console.log(`   初始剩余: ${initialRemaining}/${quota.limit}`);
      console.log(`   现在剩余: ${quota.remaining}/${quota.limit}`);
      console.log(`   初始使用: ${initialUsed}`);
      console.log(`   现在使用: ${quota.used}`);
      console.log('');
      console.log('✨ 失败返还机制工作正常！');
    } else {
      console.log('❌ 测试失败！额度未正确返还');
      console.log('');
      console.log('   详细对比:');
      console.log(`   初始剩余: ${initialRemaining}/${quota.limit} → 现在: ${quota.remaining}/${quota.limit} ${remainingMatches ? '✅' : '❌'}`);
      console.log(`   初始使用: ${initialUsed} → 现在: ${quota.used} ${usedMatches ? '✅' : '❌'}`);
      console.log('');
      if (!remainingMatches) {
        console.log(`   ⚠️  剩余次数变化: ${initialRemaining - quota.remaining}`);
      }
      if (!usedMatches) {
        console.log(`   ⚠️  使用次数变化: ${quota.used - initialUsed}`);
      }
      console.log('');
      console.log('🐛 可能的问题:');
      console.log('   1. 返还逻辑未执行');
      console.log('   2. 返还函数有bug');
      console.log('   3. Redis 同步问题');
      console.log('');
      console.log('💡 检查后端日志中的 [FreeQuota] Refunded quota');
    }

    console.log('='.repeat(50));

  } catch (error) {
    console.error('');
    console.error('❌ 测试过程中出错:');
    console.error('   ', error.message);
    console.error('');
    console.error('💡 可能的原因:');
    console.error('   1. 后端服务未启动');
    console.error('   2. API 地址错误');
    console.error('   3. 网络问题');
  }
}

async function getQuota() {
  const response = await fetch(`${API_BASE}/api/payment/quota`, {
    headers: {
      'X-Device-Id': TEST_DEVICE_ID
    }
  });

  if (!response.ok) {
    throw new Error(`获取额度失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || '获取额度失败');
  }

  return result.data;
}

async function generateSticker() {
  // 使用最小的测试图片（1x1 透明 PNG）
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const response = await fetch(`${API_BASE}/api/generate-sticker-grid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': TEST_DEVICE_ID
    },
    body: JSON.stringify({
      characterDNA: 'Test character for quota refund testing',
      prompts: [
        { prompt: 'test emotion 1' },
        { prompt: 'test emotion 2' },
        { prompt: 'test emotion 3' },
        { prompt: 'test emotion 4' }
      ],
      style: 'popart',
      referenceImage: testImage,
      isSlave: false
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `生成失败: ${response.status}`);
  }

  return await response.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
console.log('');
testQuotaRefund()
  .then(() => {
    console.log('');
    console.log('✅ 测试执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
