import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';

import * as schema from './schema/index.js';

export type Database = BetterSQLite3Database<typeof schema>;

export interface CreateDatabaseOptions {
  path?: string;
  readonly?: boolean;
}

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const DEFAULT_DATABASE_PATH =
  process.env.DATABASE_PATH ?? resolve(packageRoot, 'data/app.sqlite');

export function createDatabase(options: CreateDatabaseOptions = {}): Database {
  const { path = DEFAULT_DATABASE_PATH, readonly = false } = options;

  if (!readonly && path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const sqlite = new Database(path, { readonly });
  return drizzle(sqlite, { schema });
}
