# 部署指南 (Vercel + Railway)

本指南帮助你将表情包生成器部署到线上，使用 Vercel（前端）+ Railway（后端）的免费方案。

## 前置准备

1. [GitHub 账号](https://github.com) - 代码托管
2. [Vercel 账号](https://vercel.com) - 前端部署（用 GitHub 登录即可）
3. [Railway 账号](https://railway.app) - 后端部署（用 GitHub 登录即可）
4. Gemini API Key - 从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取

---

## 第一步：推送代码到 GitHub

```bash
# 1. 创建 GitHub 仓库（在 GitHub 网站上创建，不要勾选 README）

# 2. 在本地项目目录执行
git add .
git commit -m "准备部署"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

---

## 第二步：部署后端到 Railway

### 2.1 创建项目

1. 打开 [Railway](https://railway.app)，登录
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择你的仓库
4. **重要**：Railway 会检测到根目录，但我们需要部署 `backend` 子目录

### 2.2 配置 Root Directory

1. 进入项目后，点击服务卡片
2. 点击 **Settings** 标签
3. 找到 **Root Directory**，设置为：`backend`
4. 点击 **Deploy** 重新部署

### 2.3 设置环境变量

在 **Variables** 标签中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `8080` | 端口（Railway 会自动处理） |
| `GEMINI_API_KEY` | `你的API密钥` | 支持多个，用逗号分隔 |
| `GEMINI_STICKER_IMAGE_SIZE` | `512` | 表情包输出分辨率档位（越小越省 token） |
| `PAYMENT_MODE` | `free` | 免费体验模式 |
| `FREE_QUOTA_PER_DAY` | `3` | 每日免费次数 |
| `ALLOWED_ORIGINS` | `https://你的前端域名.vercel.app` | 允许跨域的前端地址 |

### 2.4 获取后端 URL

部署成功后，在 **Settings** → **Networking** → **Public Networking** 中：
1. 点击 **Generate Domain**
2. 你会得到类似 `https://xxx.railway.app` 的地址
3. **记下这个地址**，后面配置前端需要用

---

## 第三步：部署前端到 Vercel

### 3.1 导入项目

1. 打开 [Vercel](https://vercel.com)，登录
2. 点击 **Add New** → **Project**
3. 选择你的 GitHub 仓库
4. **Framework Preset** 选择 `Vite`

### 3.2 设置环境变量

在部署前，展开 **Environment Variables**，添加：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://你的后端.railway.app`（第二步获取的地址） |

### 3.3 部署

点击 **Deploy**，等待部署完成。

你会得到类似 `https://你的项目.vercel.app` 的地址。

---

## 第四步：更新后端 CORS

回到 Railway，更新环境变量：

```
ALLOWED_ORIGINS=https://你的项目.vercel.app
```

如果有多个域名，用逗号分隔：
```
ALLOWED_ORIGINS=https://xxx.vercel.app,https://你的自定义域名.com
```

---

## 第五步：绑定自定义域名（可选）

### Vercel 绑定域名

1. 进入 Vercel 项目 → **Settings** → **Domains**
2. 输入你的域名，点击 **Add**
3. 按提示在你的域名服务商处添加 DNS 记录

### Railway 绑定域名

1. 进入 Railway 项目 → **Settings** → **Networking**
2. 在 **Custom Domain** 处添加域名
3. 按提示配置 DNS

---

## 验证部署

1. 访问前端地址：`https://你的项目.vercel.app`
2. 尝试上传图片生成表情包
3. 检查是否正常工作

---

## 常见问题

### Q: 后端报 CORS 错误
检查 Railway 的 `ALLOWED_ORIGINS` 是否正确设置为前端地址（包含 `https://`）

### Q: 前端显示"请求失败"
1. 检查 Vercel 的 `VITE_API_URL` 是否正确
2. 在浏览器控制台查看具体错误

### Q: Railway 部署失败
1. 确认 Root Directory 设置为 `backend`
2. 查看部署日志定位问题

### Q: 免费额度用完了
在 Railway 环境变量中调整 `FREE_QUOTA_PER_DAY`

---

## 费用说明

| 平台 | 免费额度 |
|------|----------|
| Vercel | 每月 100GB 带宽，足够个人使用 |
| Railway | 每月 $5 免费额度，约可运行 500 小时 |
| Gemini API | 免费版有请求限制，够测试使用 |

**提示**：Railway 免费额度用完后会暂停服务，可绑定信用卡获得 $5/月额度或升级付费计划。

---

## 环境变量速查表

### 后端 (Railway)

| 变量 | 必填 | 示例 |
|------|------|------|
| `NODE_ENV` | 是 | `production` |
| `GEMINI_API_KEY` | 是 | `AIzaSy...` |
| `GEMINI_STICKER_IMAGE_SIZE` | 否 | `512` |
| `ALLOWED_ORIGINS` | 是 | `https://xxx.vercel.app` |
| `PAYMENT_MODE` | 否 | `free` |
| `FREE_QUOTA_PER_DAY` | 否 | `3` |
| `VIP_WHITELIST` | 否 | `device-id:10` |

### 前端 (Vercel)

| 变量 | 必填 | 示例 |
|------|------|------|
| `VITE_API_URL` | 是 | `https://xxx.railway.app` |
