# Repository Guidelines

## Project Structure
- `index.html`, `index.tsx`: Vite entry points.
- `App.tsx`: main UI and orchestration.
- `components/`: React UI components (PascalCase files, e.g. `StickerGrid.tsx`).
- `services/`: front-end API wrappers (calls the backend `/api/*`).
- `utils/`: pure helpers for image processing (e.g. `utils/imageProcessor.ts`).
- `constants.ts`, `types.ts`: shared constants and TypeScript types.
- `backend/`: Express + TypeScript API service (Gemini proxy + payment token validation).
- Build output goes to `dist/` (gitignored).

## Setup, Build, and Development
- Frontend: `npm install`, then `npm run dev` (Vite on `http://localhost:3000`).
- Backend: `cd backend && npm install && cp .env.example .env && npm run dev` (Express on `http://localhost:8080`).
- Frontend build: `npm run build`.
- Backend build/run: `cd backend && npm run build && npm start`.

## Configuration & Security
- Server-side secret: set `GEMINI_API_KEY` in `backend/.env` (do not commit `.env`).
- Client calls backend via `/api/*` (dev proxy configured in `vite.config.ts`), and sends `X-Device-Id` for user identification.

## Coding Style & Naming
- Language: TypeScript + React.
- Match existing style: 2-space indentation, semicolons, and single quotes.
- Prefer `@/…` imports (alias resolves to repository root).
- Components: `PascalCase.tsx`; utilities/services: `camelCase.ts`.

## Testing & Quality
- No dedicated test framework is configured.
- Before opening a PR: run `npm run build` (frontend) and ensure backend boots (`cd backend && npm run dev`).

## Commits & Pull Requests
- Keep commits small and descriptive; existing history uses concise中文主题（不强制前缀）。
- PRs should include: summary, screenshots/GIFs for UI changes, and any config changes (e.g. env vars) clearly called out.
