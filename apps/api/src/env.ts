import 'dotenv/config';

import { DEFAULT_DATABASE_PATH } from '@quick-swipe-english/database';

export interface AppConfig {
  port: number;
  host: string;
  databasePath: string;
  jwtSecret: string;
  corsOrigin: string;
  jwtExpiresIn: string;
}

export function loadConfig(): AppConfig {
  return {
    port: parseNumber(process.env.PORT, 3333),
    host: process.env.HOST ?? '0.0.0.0',
    databasePath: process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH,
    jwtSecret: requireEnv('JWT_SECRET'),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  };
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}
