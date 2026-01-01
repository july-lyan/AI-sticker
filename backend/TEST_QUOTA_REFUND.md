# 免费额度返还测试指南

## 📋 测试目标
验证当图片生成失败时，免费额度会自动返还给用户。

---

## 🧪 方法1：后端代码模拟失败（推荐，最简单）

### 步骤：

1. **临时修改生成函数，强制抛出错误**

编辑 `backend/src/services/gemini.ts`，找到 `generateStickerGrid` 函数（约第308行），在函数开头添加：

```typescript
export async function generateStickerGrid(params: {
  referenceImageBase64: string;
  characterDescription: string;
  prompts: string[];
  styleId: StyleId;
  isSlaveBatch?: boolean;
}): Promise<string> {
  // ========== 测试代码：模拟生成失败 ==========
  throw new Error('TEST: 模拟生成失败，验证额度返还');
  // ==========================================

  // ... 原有代码 ...
}
```

2. **重启后端服务**
```bash
cd backend
npm run dev
```

3. **前端操作测试**
   - 打开浏览器，访问 http://localhost:3001
   - 上传图片
   - 点击"开始生成"
   - **预期结果**：
     - ❌ 生成失败（看到错误提示）
     - ✅ 免费次数**不减少**（仍然是 3/3 或 2/3）

4. **查看后端日志**
```bash
# 应该看到类似这样的日志：
[info] [FreeQuota] User 106.52.146.234_xxx consumed quota: 1/3
[error] TEST: 模拟生成失败，验证额度返还
[info] [FreeQuota] Refunded quota for user 106.52.146.234_xxx: 0/3
```

5. **测试完成后删除测试代码**

---

## 🧪 方法2：使用测试脚本（更专业）

创建一个自动化测试脚本：

### `backend/test-quota-refund.mjs`

```javascript
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';
const TEST_DEVICE_ID = 'test-' + Date.now();
const TEST_IP = '127.0.0.1';

async function testQuotaRefund() {
  console.log('🧪 开始测试：免费额度返还机制\n');

  // 1. 查看初始额度
  console.log('1️⃣ 查看初始额度...');
  let quota = await getQuota();
  console.log(`   初始额度: ${quota.remaining}/${quota.limit}\n`);

  const initialRemaining = quota.remaining;

  // 2. 尝试生成（会失败）
  console.log('2️⃣ 尝试生成图片（预期失败）...');
  try {
    await generateSticker();
    console.log('   ❌ 错误：生成应该失败但却成功了！');
  } catch (error) {
    console.log('   ✅ 生成失败（符合预期）:', error.message);
  }

  // 3. 等待一下让服务器处理完
  await sleep(1000);

  // 4. 再次查看额度
  console.log('\n3️⃣ 检查额度是否返还...');
  quota = await getQuota();
  console.log(`   当前额度: ${quota.remaining}/${quota.limit}`);

  // 5. 验证结果
  console.log('\n📊 测试结果:');
  if (quota.remaining === initialRemaining) {
    console.log('   ✅ 测试通过！额度已返还');
    console.log(`   ✅ 初始: ${initialRemaining}/${quota.limit}`);
    console.log(`   ✅ 现在: ${quota.remaining}/${quota.limit}`);
  } else {
    console.log('   ❌ 测试失败！额度未返还');
    console.log(`   ❌ 初始: ${initialRemaining}/${quota.limit}`);
    console.log(`   ❌ 现在: ${quota.remaining}/${quota.limit}`);
    console.log(`   ❌ 差值: ${initialRemaining - quota.remaining}`);
  }
}

async function getQuota() {
  const response = await fetch(`${API_BASE}/api/payment/quota`, {
    headers: {
      'X-Device-Id': TEST_DEVICE_ID
    }
  });
  const result = await response.json();
  return result.data;
}

async function generateSticker() {
  const response = await fetch(`${API_BASE}/api/generate-sticker-grid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': TEST_DEVICE_ID
    },
    body: JSON.stringify({
      characterDNA: 'test character',
      prompts: [
        { prompt: 'test 1' },
        { prompt: 'test 2' },
        { prompt: 'test 3' },
        { prompt: 'test 4' }
      ],
      style: 'popart',
      referenceImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '生成失败');
  }

  return await response.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
testQuotaRefund().catch(console.error);
```

### 运行测试：
```bash
cd backend
node test-quota-refund.mjs
```

---

## 🧪 方法3：浏览器开发者工具模拟超时

### 步骤：

1. **打开浏览器开发者工具**（F12）

2. **切换到 Network（网络）标签**

3. **设置网络限速**：
   - 点击 "No throttling" 下拉菜单
   - 选择 "Add custom profile..."
   - 设置：
     - Download: 1 kb/s
     - Upload: 1 kb/s
     - Latency: 5000 ms

4. **前端操作**：
   - 上传图片
   - 点击"开始生成"
   - 等待超时（120秒）

5. **观察结果**：
   - ❌ 生成超时失败
   - ✅ 刷新页面，查看额度是否返还

---

## 🧪 方法4：使用 curl 直接测试 API

### 步骤：

1. **先获取当前额度**：
```bash
curl -X GET http://localhost:3000/api/payment/quota \
  -H "X-Device-Id: test-$(date +%s)"
```

2. **模拟失败的生成请求**（需要先启用方法1的测试代码）：
```bash
curl -X POST http://localhost:3000/api/generate-sticker-grid \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-$(date +%s)" \
  -d '{
    "characterDNA": "test",
    "prompts": [
      {"prompt": "test1"},
      {"prompt": "test2"},
      {"prompt": "test3"},
      {"prompt": "test4"}
    ],
    "style": "popart",
    "referenceImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

3. **再次查看额度**：
```bash
# 使用相同的 Device ID
curl -X GET http://localhost:3000/api/payment/quota \
  -H "X-Device-Id: test-YOUR-TIMESTAMP"
```

---

## 📝 验证清单

测试成功的标志：

- [ ] 后端日志显示 `consumed quota: 1/3`
- [ ] 后端日志显示 `Refunded quota for user xxx: 0/3`
- [ ] 前端显示生成失败
- [ ] 前端额度数字**不减少**
- [ ] 可以继续使用免费次数

---

## 🔍 调试技巧

### 查看实时日志：
```bash
cd backend
npm run dev | grep -E "FreeQuota|Refund"
```

### 手动清空额度（重新测试）：
```bash
# 如果使用 Redis
redis-cli
> KEYS free_quota:*
> DEL free_quota:YOUR_USER_ID:2025-12-28
```

### 检查 Redis 中的额度：
```bash
redis-cli
> KEYS free_quota:*
> GET free_quota:106.52.146.234_xxx:2025-12-28
```

---

## ⚠️ 注意事项

1. **测试代码不要提交到生产环境**
2. **测试完记得删除临时代码**
3. **每次测试使用不同的 deviceId 或清空 Redis**
4. **生产环境测试前先在本地验证**

---

## 🎯 预期结果总结

| 场景 | 初始额度 | 操作 | 最终额度 | 结果 |
|------|---------|------|---------|------|
| 生成成功 | 3/3 | 生成1次 | 2/3 | ✅ 次数-1 |
| 生成失败（超时） | 3/3 | 生成失败 | 3/3 | ✅ 次数不变 |
| 生成失败（错误） | 2/3 | 生成失败 | 2/3 | ✅ 次数不变 |

