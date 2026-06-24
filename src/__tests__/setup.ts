/**
 * Jest Setup — loads environment variables before tests
 */
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filePath: string) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {}
}

// Load .env.local first (higher priority), then .env
loadEnvFile('.env.local');
loadEnvFile('.env');
