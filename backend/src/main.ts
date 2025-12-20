import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prefer backend-local env files regardless of the current working directory.
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');

const envPaths = [
  path.join(backendRoot, '.env'),
  path.join(backendRoot, '.env.local'),
  // Backward-compatible: allow using the existing repo-root .env.local during migration.
  path.join(repoRoot, '.env.local'),
  path.join(repoRoot, '.env')
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

if (!process.env.GEMINI_API_KEY) {
  console.warn('[warn] GEMINI_API_KEY is not set. Create backend/.env with GEMINI_API_KEY=...');
} else {
  const keyCount = process.env.GEMINI_API_KEY.split(',').filter(k => k.trim()).length;
  if (keyCount > 1) {
    console.log(`[info] Loaded ${keyCount} Gemini API keys for load balancing`);
  }
}

await import('./index.js');
