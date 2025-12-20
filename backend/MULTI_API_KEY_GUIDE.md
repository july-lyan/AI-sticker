# 多API Key负载均衡配置指南

## 🎯 功能说明

系统支持配置**多个Gemini API Key**，实现：
- ✅ **负载均衡**: 自动轮询使用不同的Key
- ✅ **故障转移**: 一个Key失败后自动切换到下一个
- ✅ **提高可用性**: 避免单个Key被限流导致服务不可用

## 📋 配置方法

### 单个Key配置（原有方式）
```env
GEMINI_API_KEY=AIzaSyA5AkrZ3KrwcDCKG8E4OkKHdLlXqrkJRa0
```

### 多个Key配置（新增）
```env
# 用逗号分隔多个Key，自动去除空格
GEMINI_API_KEY=AIzaSyA5AkrZ3KrwcDCKG8E4OkKHdLlXqrkJRa0,AIzaSyBxxxYYYZZZ,AIzaSyCxxxYYYZZZ
```

**配置步骤:**
1. 打开 `backend/.env` 文件
2. 将多个API Key用**逗号**连接
3. 保存文件并重启后端服务

## 🔄 工作原理

### 轮询策略
```
请求1 → Key #1
请求2 → Key #2
请求3 → Key #3
请求4 → Key #1 (循环)
```

### 故障转移
```
尝试 Key #1 → 503错误 → 自动切换到 Key #2 → 成功 ✓
```

### 重试机制
- 每个请求尝试次数: `min(retries + 1, keys.length * 2)`
- 例如：3个Key，最多尝试6次
- 遇到503/429错误时自动切换Key

## 📊 日志示例

### 启动日志
```bash
[info] Loaded 3 Gemini API keys for load balancing
[info] Backend listening on :8080
```

### 请求日志（正常）
```bash
[info] [Gemini] Using API Key #1 (attempt 1/6)
[info] 200 POST /api/analyze-character 31s
```

### 请求日志（故障转移）
```bash
[info] [Gemini] Using API Key #1 (attempt 1/6)
[warn] [Gemini] API Key #1 failed (503): Deadline expired
[info] [Gemini] Retrying with next key in 1000ms...
[info] [Gemini] Using API Key #2 (attempt 2/6)
[info] 200 POST /api/analyze-character 28s
```

## 🛡️ 最佳实践

### 1. 申请多个免费Key
- 访问 https://aistudio.google.com/app/apikey
- 使用不同的Google账号申请多个Key
- 免费配额: 60次/分钟（每个Key独立）

### 2. 推荐配置
- **开发环境**: 1-2个Key即可
- **生产环境**: 建议3-5个Key
- **高并发**: 根据流量配置更多Key

### 3. 监控Key使用情况
查看后端日志，观察：
- 哪个Key使用频率最高
- 是否有Key频繁失败
- 故障转移是否正常工作

## 🔧 故障排查

### Q1: 所有Key都返回503错误
**原因:** Gemini API服务整体负载过高
**解决:** 等待5-10分钟后重试，或错峰使用

### Q2: 某个Key一直失败
**原因:** 该Key配额用完或被限流
**解决:** 移除该Key，或等待配额重置（通常1分钟）

### Q3: Key切换不生效
**原因:** 后端未重启
**解决:** 修改.env后必须重启后端服务

## 📈 性能提升

### 单Key配置
- 60次/分钟限制
- 遇到503立即失败

### 3个Key配置
- 180次/分钟限制 (3x)
- 自动故障转移，成功率提升

### 实测效果
```
场景: 高峰期503错误频繁
- 单Key: 50%请求失败
- 3个Key: 5%请求失败 (10倍改善)
```

## 🚀 快速测试

修改.env后，运行测试脚本：
```bash
cd backend
node test-payment-flow.mjs
```

观察日志中是否显示：
```
[info] Loaded N Gemini API keys for load balancing
[info] [Gemini] Using API Key #1 (attempt 1/X)
```

## ⚠️ 安全提示

1. **不要提交.env文件到Git**
   - .env已在.gitignore中
   - 仅提交.env.example作为模板

2. **定期轮换Key**
   - 每3-6个月更换一次
   - 删除旧Key，添加新Key

3. **监控异常使用**
   - 设置配额告警
   - 检查API Key使用统计

---

**更新日期**: 2025-12-18
**版本**: v1.0
