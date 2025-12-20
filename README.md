<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 表情包生成器（支持宠物）

本项目为 React + Vite 前端，配套一个 Express + TypeScript 后端，用于代理 Gemini 调用并承载按次计费的 Token 校验（开发环境提供模拟支付）。

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
