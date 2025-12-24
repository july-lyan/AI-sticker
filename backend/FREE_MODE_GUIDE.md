# 免费体验模式使用指南

## 📋 概述

免费体验模式允许每个用户每天免费生成**3次**表情包（可配置），无需支付即可体验产品。该模式支持一键切换到真实支付模式，方便后续商业化升级。

---

## 🎯 核心特性

### 1. 每日免费额度
- ✅ 每个用户每天**3次**免费生成（默认配置）
- ✅ 次数按用户ID（IP + Device ID）计算
- ✅ 每天0点自动重置
- ✅ 使用Redis/内存存储，过期自动清理

### 2. 免费模式数量限制（前端）
- ✅ 免费模式下仅支持生成 **4 张**（包含**四格漫画**）
- ✅ **8 张 / 12 张**默认置灰（需切换到付费模式后开放）

### 3. 灵活配置
- ✅ 通过环境变量切换免费/付费模式
- ✅ 可自定义每日免费次数
- ✅ 保留完整支付系统架构

### 4. 用户友好
- ✅ 前端显示剩余次数
- ✅ 额度用完时友好提示
- ✅ 自动显示重置时间

---

## 🚀 快速开始

### 环境变量配置

在 `backend/.env` 文件中设置：

```env
# 支付模式：'free'（免费体验）或 'paid'（真实支付）
PAYMENT_MODE=free

# 每日免费次数（仅在免费模式下生效）
FREE_QUOTA_PER_DAY=3
```

### 启动服务

```bash
# 后端
cd backend
npm run dev

# 前端
npm run dev
```

---

## 🔄 API文档

### 1. 查询免费额度

**请求：**
```http
GET /api/payment/quota
Headers:
  X-Device-Id: <设备ID>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "mode": "free",
    "remaining": 2,
    "used": 1,
    "limit": 3,
    "resetAt": "2025-12-20T00:00:00.000Z",
    "isFreeMode": true
  }
}
```

### 2. 生成表情包（免费模式）

**请求：**
```http
POST /api/generate-sticker-grid
Headers:
  X-Device-Id: <设备ID>
Body:
{
  "characterDNA": "...",
  "prompts": [...],
  "style": "3d",
  "referenceImage": "..."
}
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "gridImage": "data:image/png;base64,..."
  }
}
```

**额度不足响应：**
```json
{
  "success": false,
  "error": "QUOTA_EXCEEDED",
  "message": "今日免费次数已用完，请明天再来",
  "data": {
    "mode": "free",
    "suggestion": "升级到付费版可无限生成"
  }
}
```

---

## 💡 工作原理

### 数据存储

```typescript
// Redis/内存存储
Key: free_quota:{userId}:{date}
Value: {
  userId: "192.168.1.1_abc123",
  date: "2025-12-19",
  used: 2,
  limit: 3,
  resetAt: "2025-12-20T00:00:00Z"
}
TTL: 24小时
```

### 流程图

```
用户请求生成表情包
    ↓
检查PAYMENT_MODE环境变量
    ↓
[免费模式]               [付费模式]
    ↓                       ↓
查询今日使用次数          检查paymentToken
    ↓                       ↓
是否还有额度?            Token是否有效?
    ↓                       ↓
[有额度]  [无额度]      [有效]  [无效]
    ↓        ↓             ↓       ↓
消耗1次    拒绝          消耗   拒绝
    ↓        ↓             ↓       ↓
调用Gemini  返回402    调用     返回402
    ↓                   Gemini
返回表情包              返回
                       表情包
```

---

## 🔧 后端实现

### 核心文件

#### 1. `backend/src/services/freeQuota.ts`
免费额度管理服务，提供以下函数：

- `getFreeQuota(store, userId)` - 获取用户今日额度
- `consumeFreeQuota(store, userId)` - 消耗一次额度
- `hasFreeQuota(store, userId)` - 检查是否还有额度
- `getRemainingQuota(store, userId)` - 获取剩余次数

#### 2. `backend/src/routes/sticker.ts`
在生成表情包路由中添加免费模式检查：

```typescript
if (PAYMENT_MODE === 'free') {
  // 检查免费额度
  const hasQuota = await hasFreeQuota(store, userId);
  if (!hasQuota) {
    res.status(402).json(fail('QUOTA_EXCEEDED', '今日免费次数已用完'));
    return;
  }

  // 消耗额度
  await consumeFreeQuota(store, userId);
} else {
  // 检查支付Token
  const check = await assertPaymentTokenValid(store, token, userId, true);
  // ...
}
```

---

## 💻 前端集成

### 0. 节日 Prompt（圣诞 / 新年）

前端内置了节日相关的 Prompt（用于随机/自定义模式选择）：

- **圣诞快乐**：`*_*xmas`（例如 `p_xmas`、`fam_xmas`）
- **新年快乐**：`*_*newyear`（例如 `p_newyear`、`fam_newyear`）

### 1. 查询免费额度

```typescript
import { getFreeQuota } from '../services/paymentApi';

const quota = await getFreeQuota(deviceId);
console.log(`剩余次数: ${quota.remaining}/${quota.limit}`);
```

### 2. 显示额度组件

```tsx
import FreeQuotaDisplay from './components/FreeQuotaDisplay';

function App() {
  return (
    <div>
      <FreeQuotaDisplay deviceId={deviceId} />
      {/* 其他内容 */}
    </div>
  );
}
```

---

## 📊 监控与日志

### 日志示例

```
[info] [FreeQuota] Initialized quota for user 192.168.1.1_abc123: 0/3
[info] [FreeQuota] User 192.168.1.1_abc123 consumed quota: 1/3
[info] [FreeQuota] User 192.168.1.1_abc123 consumed quota: 2/3
[info] [FreeQuota] User 192.168.1.1_abc123 consumed quota: 3/3
[warn] [FreeQuota] User 192.168.1.1_abc123 exceeded daily limit: 3/3
```

### 数据统计

可以通过Redis查询：

```bash
# 查看所有免费额度记录
redis-cli KEYS "free_quota:*"

# 查看特定用户的额度
redis-cli GET "free_quota:192.168.1.1_abc123:2025-12-19"
```

---

## 🔄 升级到付费模式

### 步骤1：配置环境变量

```env
PAYMENT_MODE=paid
```

### 步骤2：配置支付平台

选择以下之一：
- **微信支付**：配置商户号和API密钥
- **支付宝**：配置App ID和私钥
- **聚合支付**：配置虎皮椒/PayJS等平台

### 步骤3：实现支付回调

参考 `迭代需求文档-v2.0.md` 中的"阶段4: 支付平台对接"部分。

### 步骤4：重启服务

```bash
# 重启后端
npm run dev

# 清除Redis缓存（可选）
redis-cli FLUSHDB
```

---

## 🎨 自定义配置

### 修改每日免费次数

```env
# 每天5次
FREE_QUOTA_PER_DAY=5

# 每天10次
FREE_QUOTA_PER_DAY=10
```

### 修改错误提示

编辑 `backend/src/routes/sticker.ts`：

```typescript
res.status(402).json(
  fail('QUOTA_EXCEEDED', '你的自定义提示文字', {
    mode: 'free',
    suggestion: '你的建议文字'
  })
);
```

---

## ❓ 常见问题

### Q1: 如何重置某个用户的额度？

```bash
# 删除该用户今日的额度记录
redis-cli DEL "free_quota:{userId}:2025-12-19"
```

### Q2: 如何临时给某个用户无限额度？

修改 `backend/src/services/freeQuota.ts`：

```typescript
// 添加白名单
const UNLIMITED_USERS = ['192.168.1.100_special'];

export async function hasFreeQuota(store: PaymentStore, userId: string): Promise<boolean> {
  if (UNLIMITED_USERS.includes(userId)) {
    return true; // 白名单用户无限额度
  }

  const quota = await getFreeQuota(store, userId);
  return quota.used < quota.limit;
}
```

### Q3: 免费模式和付费模式可以共存吗？

当前设计不支持共存，但可以实现"前N次免费，之后付费"：

```typescript
if (quota.used >= FREE_QUOTA_PER_DAY) {
  // 额度用完，检查支付Token
  const token = req.header('x-payment-token');
  if (!token) {
    res.status(402).json(fail('PAYMENT_REQUIRED', '免费次数已用完，请付费继续使用'));
    return;
  }
  // 验证Token...
} else {
  // 消耗免费额度
  await consumeFreeQuota(store, userId);
}
```

---

## 📈 数据分析

### 统计每日用户数

```typescript
// 获取所有今日额度记录
const keys = await redis.keys(`free_quota:*:${getTodayDate()}`);
console.log(`今日活跃用户: ${keys.length}`);
```

### 统计总使用次数

```typescript
let totalUsed = 0;
for (const key of keys) {
  const quota = await redis.get(key);
  totalUsed += JSON.parse(quota).used;
}
console.log(`今日总生成次数: ${totalUsed}`);
```

---

## 🛠️ 故障排查

### 问题：额度一直显示0/0

**原因：** Redis连接失败或环境变量未配置

**解决：**
```bash
# 检查环境变量
echo $PAYMENT_MODE
echo $FREE_QUOTA_PER_DAY

# 检查Redis连接
redis-cli PING
```

### 问题：额度消耗后没有减少

**原因：** Redis写入失败

**解决：**
```typescript
// 检查日志中的错误信息
[error] Failed to save quota: ...
```

---

## 📝 总结

免费体验模式的核心优势：

1. ✅ **降低门槛**：用户无需支付即可体验
2. ✅ **验证市场**：收集用户数据和反馈
3. ✅ **灵活升级**：随时切换到付费模式
4. ✅ **成本可控**：每日限额防止滥用

适用场景：
- 产品初期MVP测试
- 市场验证阶段
- 引流和推广活动
- 用户教育和培训

---

**文档版本：** v1.0
**最后更新：** 2025-12-19
**作者：** Claude Code
