import { defineConfig } from 'drizzle-kit';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(new URL('.', import.meta.url).pathname); // packages/database
const dbUrl = process.env.DATABASE_PATH ?? resolve(root, 'data/app.sqlite');
mkdirSync(dirname(dbUrl), { recursive: true });

export default defineConfig({
  out: 'drizzle',
  schema: resolve(root, 'src/schema/index.ts'),
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl,
  },
});
