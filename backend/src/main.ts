import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isTruthyEnv = (value: string | undefined): boolean => {
  const raw = value?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
};

// Prefer backend-local env files regardless of the current working directory.
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

// Load order (later overrides earlier):
// - repoRoot .env/.env.local (backward compatible during migration)
// - backendRoot .env/.env.local (preferred)
const envPaths = [
  path.join(repoRoot, '.env'),
  path.join(repoRoot, '.env.local'),
  path.join(backendRoot, '.env'),
  path.join(backendRoot, '.env.local')
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
  }
}

console.log(
  `[info] GEMINI_STICKER_IMAGE_SIZE=${(process.env.GEMINI_STICKER_IMAGE_SIZE || '1024').trim()}`
);
console.log(`[info] LOG_GEMINI_USAGE=${isTruthyEnv(process.env.LOG_GEMINI_USAGE) ? 'enabled' : 'disabled'}`);

if (!process.env.GEMINI_API_KEY) {
  console.warn('[warn] GEMINI_API_KEY is not set. Create backend/.env with GEMINI_API_KEY=...');
} else {
  const keyCount = process.env.GEMINI_API_KEY.split(',').filter(k => k.trim()).length;
  if (keyCount > 1) {
    console.log(`[info] Loaded ${keyCount} Gemini API keys for load balancing`);
  }
}

await import('./index.js');
