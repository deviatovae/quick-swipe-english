import { createDatabase } from '@quick-swipe-english/database';

import type { AppConfig } from './env.js';

export function initDb(config: AppConfig) {
  return createDatabase({ path: config.databasePath });
}
