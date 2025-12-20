# VIP白名单使用指南

## 📋 功能说明

VIP白名单允许你为特定用户设置**不同的每日免费次数**，实现差异化的免费额度策略。

### 使用场景

| 场景 | 配置示例 | 说明 |
|------|---------|------|
| **内测用户** | VIP用户每天10次 | 给特定测试用户更多额度 |
| **推广活动** | 活动用户每天5次 | 临时提高某些用户的额度 |
| **开发测试** | 开发者无限次 | 方便本地开发调试 |
| **VIP会员** | 付费会员每天20次 | 会员享受更高额度 |
| **分级体验** | 普通1次，VIP3次 | 差异化免费体验 |

---

## ⚙️ 配置方法

### 步骤1：获取用户标识

用户可以通过以下方式查看自己的**Device ID**：

**方法1：浏览器控制台**
```javascript
// 在浏览器控制台(F12)输入
localStorage.getItem('deviceId')

// 输出示例: "abc123-def456-ghi789"
```

**方法2：查看后端日志**
```bash
# 后端日志会显示用户ID
[info] [FreeQuota] Initialized quota for user ::1_abc123-def456: 0/3
                                                   ↑    ↑
                                                  IP   Device ID
```

**用户标识类型：**
- **Device ID**: `abc123-def456-ghi789`（推荐，最精确）
- **IP地址**: `192.168.1.100` 或 `::1`（可能变化）
- **完整userId**: `192.168.1.100_abc123-def456`（IP+DeviceID组合）

---

### 步骤2：配置白名单

编辑 `backend/.env` 文件：

```env
# 基础配置：普通用户每天1次
FREE_QUOTA_PER_DAY=1

# VIP白名单：特定用户更高额度
VIP_WHITELIST=abc123-def456:10,192.168.1.100:5,::1_test-device:20
```

**配置格式：**
```
identifier1:quota1,identifier2:quota2,identifier3:quota3
```

---

## 📝 配置示例

### 示例1：基础VIP配置

**需求：** 普通用户1次/天，VIP用户3次/天

```env
FREE_QUOTA_PER_DAY=1
VIP_WHITELIST=abc123-def456:3,xyz789-uvw012:3
```

**解释：**
- 普通用户：每天1次
- Device ID为 `abc123-def456` 的用户：每天3次
- Device ID为 `xyz789-uvw012` 的用户：每天3次

---

### 示例2：内测用户高额度

**需求：** 普通用户1次/天，内测用户10次/天

```env
FREE_QUOTA_PER_DAY=1
VIP_WHITELIST=tester-001:10,tester-002:10,dev-alice:20
```

**解释：**
- `tester-001` 和 `tester-002`：每天10次（内测用户）
- `dev-alice`：每天20次（核心开发者）

---

### 示例3：按IP地址配置

**需求：** 公司内网IP用户无限次（9999次）

```env
FREE_QUOTA_PER_DAY=3
VIP_WHITELIST=192.168.1.100:9999,10.0.0.50:9999
```

**解释：**
- IP为 `192.168.1.100` 的用户：每天9999次（实际无限）
- IP为 `10.0.0.50` 的用户：每天9999次

**⚠️ 注意：** IP可能变化，推荐使用Device ID

---

### 示例4：完整userId配置

**需求：** 指定特定设备+IP组合

```env
FREE_QUOTA_PER_DAY=3
VIP_WHITELIST=::1_abc123-def456:50
```

**解释：**
- 只有当用户的IP是 `::1`（本地）且Device ID是 `abc123-def456` 时，才享受每天50次

---

## 🔍 查找用户标识

### 方法1：前端控制台查看

让用户在浏览器控制台(F12)执行：

```javascript
console.log('Device ID:', localStorage.getItem('deviceId'));
```

**输出示例：**
```
Device ID: f7b3c2a1-8d4e-4f9a-b5c6-1a2b3c4d5e6f
```

---

### 方法2：后端日志查看

用户访问时，后端会打印日志：

```bash
[info] [FreeQuota] Initialized quota for user ::1_f7b3c2a1-8d4e-4f9a-b5c6-1a2b3c4d5e6f: 0/3
```

**解析：**
- IP: `::1`（IPv6本地地址）
- Device ID: `f7b3c2a1-8d4e-4f9a-b5c6-1a2b3c4d5e6f`

---

### 方法3：添加查询接口（可选）

在 `backend/src/routes/payment.ts` 添加：

```typescript
router.get('/my-id', asyncHandler(async (req, res) => {
  const userId = req.userId!;
  const parts = userId.split('_');
  res.json(ok({
    userId,
    ip: parts[0],
    deviceId: parts.length > 1 ? parts[1] : ''
  }));
}));
```

**使用：**
```bash
curl http://localhost:8080/api/payment/my-id \
  -H "X-Device-Id: your-device-id"
```

---

## 🎯 优先级说明

当用户匹配多个白名单规则时，按以下优先级：

1. **Device ID** - 最高优先级（最精确）
2. **IP地址** - 中等优先级
3. **完整userId** - 最低优先级
4. **默认配置** - 兜底（FREE_QUOTA_PER_DAY）

**示例：**
```env
FREE_QUOTA_PER_DAY=1
VIP_WHITELIST=abc123:10,192.168.1.100:5,192.168.1.100_abc123:20
```

当用户ID为 `192.168.1.100_abc123` 时：
- ✅ 匹配 Device ID `abc123` → **10次/天**（优先级最高）
- ⏸️ 匹配 IP `192.168.1.100` → 5次/天（被覆盖）
- ⏸️ 匹配 userId `192.168.1.100_abc123` → 20次/天（被覆盖）

**实际额度：10次/天**

---

## 📊 测试验证

### 测试步骤

**1. 配置白名单**
```env
FREE_QUOTA_PER_DAY=1
VIP_WHITELIST=test-vip-user:10
```

**2. 重启后端**
```bash
cd backend
npm run dev
```

**3. 观察日志**

应该看到：
```
[info] [FreeQuota] VIP configured: test-vip-user → 10 quota/day
```

**4. 模拟VIP用户请求**

修改测试脚本或手动curl：
```bash
curl http://localhost:8080/api/payment/quota \
  -H "X-Device-Id: test-vip-user"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "mode": "free",
    "remaining": 10,
    "used": 0,
    "limit": 10,  // ← VIP用户的额度
    "resetAt": "...",
    "isFreeMode": true
  }
}
```

**5. 模拟普通用户请求**
```bash
curl http://localhost:8080/api/payment/quota \
  -H "X-Device-Id: normal-user"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "remaining": 1,
    "limit": 1,  // ← 普通用户的默认额度
    ...
  }
}
```

---

## 🛠️ 实际应用场景

### 场景1：内测阶段

**目标：** 内测用户高额度，公开用户低额度

```env
# 公开用户每天1次体验
FREE_QUOTA_PER_DAY=1

# 内测用户每天10次
VIP_WHITELIST=tester-alice:10,tester-bob:10,tester-charlie:10
```

**操作：**
1. 内测用户在控制台查看自己的Device ID
2. 发给你，你添加到VIP_WHITELIST
3. 重启后端，内测用户立即生效

---

### 场景2：推广活动

**目标：** 活动期间特定用户享受高额度

```env
FREE_QUOTA_PER_DAY=3

# 活动用户每天20次（活动结束后移除）
VIP_WHITELIST=promo-user-001:20,promo-user-002:20
```

**活动结束后：**
```env
# 注释掉或删除VIP_WHITELIST
# VIP_WHITELIST=promo-user-001:20,promo-user-002:20
```

---

### 场景3：开发者测试

**目标：** 开发者本地测试无限次

```env
FREE_QUOTA_PER_DAY=3

# 本地开发无限次
VIP_WHITELIST=::1_dev-local:9999,127.0.0.1_dev-local:9999
```

**说明：**
- `::1` 和 `127.0.0.1` 都是本地地址
- 设置9999次实际等于无限

---

## 🔒 安全建议

### 1. 不要泄露Device ID

Device ID是用户的唯一标识，不应公开展示：

❌ **错误做法：**
```tsx
// 不要在前端UI显示完整Device ID
<div>你的ID: {deviceId}</div>
```

✅ **正确做法：**
```tsx
// 只在控制台日志中显示（用户主动查看）
console.log('Device ID:', deviceId);
```

---

### 2. 定期清理过期白名单

```env
# 活动结束后，及时移除临时VIP
# VIP_WHITELIST=promo-user-001:20  ← 注释掉
```

---

### 3. 使用强随机Device ID

当前实现已使用 `crypto.randomUUID()`，无需额外处理。

---

## 📈 监控与统计

### 统计VIP用户使用情况

查看后端日志：

```bash
# 查看VIP用户的使用记录
grep "VIP user" backend/logs/app.log

# 输出示例：
[info] [FreeQuota] VIP user (Device ID): abc123 → 10 quota/day
[info] [FreeQuota] User abc123 consumed quota: 1/10
[info] [FreeQuota] User abc123 consumed quota: 2/10
```

---

## ❓ 常见问题

### Q1: 如何给所有用户提高额度？

**A:** 修改 `FREE_QUOTA_PER_DAY`，不需要配置白名单

```env
FREE_QUOTA_PER_DAY=5  # 所有用户每天5次
```

---

### Q2: 如何临时给某个用户无限次数？

**A:** 设置一个很大的数字（如9999）

```env
VIP_WHITELIST=special-user:9999
```

---

### Q3: 白名单配置后何时生效？

**A:** 需要重启后端服务

```bash
# 方法1: 重启进程
pkill -f "tsx watch" && npm run dev

# 方法2: 使用nodemon自动重启（如果配置了）
# 修改.env后会自动重启
```

---

### Q4: 用户更换网络后额度会变化吗？

**A:** 取决于配置方式

- **按Device ID配置** → ✅ 不变（推荐）
- **按IP配置** → ❌ 会变（不推荐）

---

### Q5: 如何撤销某个VIP用户的权限？

**A:** 从白名单中移除，并重启服务

```env
# 移除前
VIP_WHITELIST=user-a:10,user-b:10,user-c:10

# 移除user-b后
VIP_WHITELIST=user-a:10,user-c:10
```

---

## 📝 总结

**白名单配置三要素：**
1. **标识符** - Device ID / IP / userId
2. **额度** - 每日免费次数（数字）
3. **优先级** - Device ID > IP > userId > 默认

**推荐配置：**
```env
# 普通用户
FREE_QUOTA_PER_DAY=1

# VIP用户（按Device ID）
VIP_WHITELIST=device-id-1:5,device-id-2:10,device-id-3:20
```

**优势：**
- ✅ 灵活差异化额度策略
- ✅ 支持临时活动和长期VIP
- ✅ 无需数据库，配置即生效
- ✅ 开发测试友好

---

**文档版本：** v1.0
**最后更新：** 2025-12-19
**作者：** Claude Code
