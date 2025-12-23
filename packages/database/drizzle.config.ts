/// <reference types="node" />

import { defineConfig } from 'drizzle-kit';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(new URL('.', import.meta.url).pathname); // packages/database
const dbUrl = process.env.DATABASE_PATH ?? resolve(root, 'data/app.sqlite');
mkdirSync(dirname(dbUrl), { recursive: true });

const distSchemaPath = resolve(root, 'dist/schema/index.js');
if (!existsSync(distSchemaPath)) {
  // eslint-disable-next-line no-console
  console.warn(
    '[drizzle] dist/schema/index.js not found. Run `pnpm --filter @quick-swipe-english/database run build` first.'
  );
}

export default defineConfig({
  out: 'drizzle',
  schema: distSchemaPath,
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
});
