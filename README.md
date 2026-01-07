<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI 表情包批量工场

上传一张参考图，自动生成全套表情包。基于 Google Gemini API，支持多种角色类型和艺术风格。

**在线体验**：https://www.cines.top

## 功能特性

### 核心功能
- **AI 表情包生成** - 基于 Gemini API 智能生成表情包
- **批量生成** - 一次生成 4/8/12 张表情包
- **重绘功能** - 对不满意的表情包单独重新生成
- **打包下载** - ZIP 格式一键打包下载
- **全家福模式** - 生成适合手机分享的拼图

### 角色分类
支持 9 种角色类型：女性、男性、儿童、老人、宠物、情侣、朋友、家庭、人宠

### 艺术风格
支持 8 种艺术风格：
- 波普艺术 (Pop Art)
- 日漫风格 (Manga)
- 王者荣耀风 (Game Art)
- 古风水墨 (Ancient CN)
- 3D 萌趣 (Pixar 3D)
- 像素风 (Pixel Art)
- 赛博朋克 (Cyberpunk)
- 剪纸艺术 (Paper Cut)

### 免费体验模式
- 每日免费生成额度（可配置）
- VIP 白名单支持差异化额度
- 额度用完自动提示，次日重置

### 技术特性
- 多 API Key 负载均衡
- 图片自动压缩优化
- 速率限制保护
- 完善的错误处理

## 技术栈

| 前端 | 后端 |
|------|------|
| React 19 | Express.js |
| Vite | TypeScript |
| TypeScript | Gemini API |

## 项目结构

```
├── src/                  # 前端源码
├── components/           # React 组件
├── services/             # API 服务
├── backend/              # 后端源码
│   ├── src/
│   │   ├── routes/       # API 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── middleware/   # 中间件
│   │   └── utils/        # 工具函数
│   └── .env.example      # 环境变量示例
└── DEPLOY_GUIDE.md       # 部署指南
```

## 本地运行

**Prerequisites:** Node.js

### 1) 启动后端

```bash
cd backend
npm install
cp .env.example .env
# 编辑 .env，填入 GEMINI_API_KEY
npm run dev
```

后端默认监听 `http://localhost:8080`（健康检查：`/health`）。

### 2) 启动前端

```bash
npm install
npm run dev
```

前端默认监听 `http://localhost:3000`。

- 开发环境下，`vite.config.ts` 已将 `/api/*` 代理到后端（默认 `http://localhost:8080`）。
- 如需自定义后端地址，可设置 `VITE_API_URL`（例如 `http://localhost:8080`）。

## 部署

本项目采用 **Vercel（前端）+ Railway（后端）** 的部署方案。

详细步骤请参考 [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

### 快速部署流程

```
1. 推送代码到 GitHub
2. Railway 部署后端 (backend 目录)
3. Vercel 部署前端
4. 配置环境变量
```

## 环境变量

### 后端环境变量 (Railway)

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `NODE_ENV` | 是 | 运行环境 | `production` |
| `GEMINI_API_KEY` | 是 | Gemini API 密钥，多个用逗号分隔 | `key1,key2,key3` |
| `GEMINI_STICKER_IMAGE_SIZE` | 否 | 表情包输出分辨率档位（越小越省 token） | `512` |
| `ALLOWED_ORIGINS` | 是 | 允许跨域的前端地址 | `https://example.com` |
| `PAYMENT_MODE` | 否 | 支付模式 | `free` |
| `FREE_QUOTA_PER_DAY` | 否 | 每日免费次数 | `3` |
| `VIP_WHITELIST` | 否 | VIP 白名单 | `device-id:10` |

### 前端环境变量 (Vercel)

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `VITE_API_URL` | 是 | 后端 API 地址 | `https://xxx.railway.app` |

## 相关文档

- [部署指南](./DEPLOY_GUIDE.md)
- [免费模式配置](./backend/FREE_MODE_GUIDE.md)
- [VIP 白名单配置](./backend/VIP_WHITELIST_GUIDE.md)
- [多 API Key 配置](./backend/MULTI_API_KEY_GUIDE.md)

## License

MIT
