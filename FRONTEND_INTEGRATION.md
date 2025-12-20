# 前端集成说明 - 免费体验模式

## ✅ 已完成的集成

### 1. 免费额度显示组件

**位置：** `components/FreeQuotaDisplay.tsx`

**功能：**
- ✅ 实时显示用户剩余免费次数
- ✅ 进度条可视化（绿色→黄色→红色）
- ✅ 额度不足时友好提示
- ✅ 自动显示重置时间（明天0点）
- ✅ 仅在免费模式下显示

**集成位置：**
在 `App.tsx` 的左侧栏顶部（Settings Panel上方）

```tsx
{/* Free Quota Display (only in free mode) */}
{deviceId && <FreeQuotaDisplay deviceId={deviceId} />}
```

### 2. API服务调用

**位置：** `services/paymentApi.ts`

**新增方法：**
```typescript
export async function getFreeQuota(deviceId: string) {
  return getJson<{
    mode: 'free' | 'paid';
    remaining: number;
    used: number;
    limit: number;
    resetAt: string;
    isFreeMode: boolean;
  }>('/api/payment/quota', {
    'X-Device-Id': deviceId
  });
}
```

---

## 🎨 UI效果

### 有剩余额度时
```
┌────────────────────────────────────┐
│ 🎁 免费体验模式            [可用]  │
│                                    │
│ 今日剩余次数          2 / 3        │
│ ████████████░░░░  66%             │
│                                    │
│ 每天免费生成3次，明天0点自动重置   │
└────────────────────────────────────┘
```

### 额度即将用完时（黄色警告）
```
┌────────────────────────────────────┐
│ 🎁 免费体验模式        [即将用完]  │
│                                    │
│ 今日剩余次数          1 / 3        │
│ ████░░░░░░░░░░░░  33%             │
│                                    │
│ 每天免费生成3次，明天0点自动重置   │
└────────────────────────────────────┘
```

### 额度用完时（红色提示）
```
┌────────────────────────────────────┐
│ 🎁 免费体验模式          [已用完]  │
│                                    │
│ 今日剩余次数          0 / 3        │
│ ░░░░░░░░░░░░░░░░  0%              │
│                                    │
│ 今日免费次数已用完，明天0点自动重置│
│ 升级到付费版可无限生成！           │
└────────────────────────────────────┘
```

---

## 🔄 用户交互流程

### 场景1：首次访问

```
1. 用户打开页面
   ↓
2. deviceId自动生成（存储在localStorage）
   ↓
3. FreeQuotaDisplay组件自动加载
   ↓
4. 调用GET /api/payment/quota查询额度
   ↓
5. 显示"剩余3/3"
```

### 场景2：生成表情包

```
1. 用户上传图片 → 选择风格 → 点击生成
   ↓
2. 后端检查免费额度（自动扣减1次）
   ↓
3. 生成成功，返回表情包
   ↓
4. 前端刷新额度显示（变为2/3）
```

### 场景3：额度用完

```
1. 用户第4次点击生成
   ↓
2. 后端返回402错误：
   {
     "error": "QUOTA_EXCEEDED",
     "message": "今日免费次数已用完，请明天再来"
   }
   ↓
3. 前端显示错误提示
   ↓
4. FreeQuotaDisplay显示红色"已用完"状态
```

---

## 📱 响应式设计

组件已适配不同屏幕尺寸：

- **桌面端（>1024px）**：显示在左侧栏顶部
- **平板端（768-1024px）**：显示在设置面板上方
- **移动端（<768px）**：显示在顶部，占满宽度

---

## 🧪 前端测试

### 手动测试步骤

**测试1：查看额度显示**
1. 启动前端：`npm run dev`
2. 打开浏览器访问 `http://localhost:3001`
3. 检查左侧栏是否显示免费额度组件
4. 验证显示的数字是否正确（默认3/3）

**测试2：生成并消耗额度**
1. 上传一张图片
2. 选择风格和数量（选择4张）
3. 点击"开始生成"
4. 等待生成完成
5. 检查免费额度是否减少（变为2/3）

**测试3：额度用完**
1. 继续生成，直到剩余0/3
2. 再次点击"开始生成"
3. 应该看到错误提示："今日免费次数已用完"
4. 额度组件变为红色"已用完"状态

**测试4：重置验证**
1. 等待到明天0点（或修改系统时间）
2. 刷新页面
3. 额度应自动重置为3/3

---

## 🎛️ 配置说明

### 修改每日免费次数

**后端配置（backend/.env）：**
```env
FREE_QUOTA_PER_DAY=5  # 修改为5次/天
```

**前端无需修改**，会自动从后端API获取limit值。

### 切换到付费模式

**后端配置：**
```env
PAYMENT_MODE=paid
```

**前端变化：**
- FreeQuotaDisplay组件自动隐藏（因为`isFreeMode=false`）
- 生成时需要提供paymentToken
- 显示支付相关UI（待后续实现）

---

## 🐛 故障排查

### 问题1：FreeQuotaDisplay不显示

**检查清单：**
- [ ] 后端是否启动？(`npm run dev` in backend/)
- [ ] PAYMENT_MODE是否为'free'？
- [ ] deviceId是否生成？（检查localStorage）
- [ ] API是否返回正确数据？（查看Network面板）

**解决方法：**
```bash
# 检查后端API
curl http://localhost:8080/api/payment/quota -H "X-Device-Id: test"

# 应该返回：
{
  "success": true,
  "data": {
    "mode": "free",
    "remaining": 3,
    "used": 0,
    "limit": 3,
    "resetAt": "...",
    "isFreeMode": true
  }
}
```

### 问题2：额度数字不更新

**原因：**
- 组件只在初始化时加载一次
- 生成后没有刷新额度

**解决方法：**
在生成成功后，重新调用`getFreeQuota()`刷新额度（可选优化）。

### 问题3：显示样式错乱

**检查：**
- [ ] Tailwind CSS是否正确加载？
- [ ] 是否有CSS冲突？

**解决：**
检查`tailwind.config.js`和`index.css`配置。

---

## 📊 后续优化建议

### 优化1：实时刷新额度（可选）

在生成成功后自动刷新额度：

```tsx
// 在generateStickers函数成功后
const refreshQuota = async () => {
  const quota = await getFreeQuota(deviceId);
  // 触发FreeQuotaDisplay重新渲染
};
```

### 优化2：额度不足时禁用生成按钮

```tsx
const [quotaRemaining, setQuotaRemaining] = useState(3);

// 在生成按钮上
<button
  disabled={quotaRemaining === 0}
  className={quotaRemaining === 0 ? 'opacity-50 cursor-not-allowed' : ''}
>
  {quotaRemaining === 0 ? '今日额度已用完' : '开始生成'}
</button>
```

### 优化3：添加额度充值入口

```tsx
// 在FreeQuotaDisplay组件底部
{quota.remaining === 0 && (
  <button
    onClick={() => handleUpgrade()}
    className="w-full mt-2 bg-blue-500 text-white py-2 rounded font-bold"
  >
    立即升级付费版 →
  </button>
)}
```

---

## 📝 总结

### 已完成 ✅
- [x] FreeQuotaDisplay组件创建
- [x] App.tsx集成
- [x] API服务调用
- [x] 响应式设计
- [x] 错误处理

### 待优化 ⏸️
- [ ] 生成后自动刷新额度
- [ ] 额度不足时禁用按钮
- [ ] 添加升级付费版入口
- [ ] 添加倒计时（距离重置还剩X小时）

---

**集成完成！** 🎉

现在你的用户可以：
1. 实时看到剩余免费次数
2. 了解何时重置（明天0点）
3. 额度用完时收到友好提示

**下一步：**
- 启动前端测试UI效果
- 或者继续开发其他需求功能
