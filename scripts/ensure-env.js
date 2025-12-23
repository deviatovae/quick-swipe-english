const { cpSync, existsSync } = require("fs");
const { resolve } = require("path");

const envPairs = [
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/web/.env.example", "apps/web/.env.local"],
  ["apps/telegram-bot/.env.example", "apps/telegram-bot/.env"],
];

for (const [srcRel, destRel] of envPairs) {
  const src = resolve(__dirname, "..", srcRel);
  const dest = resolve(__dirname, "..", destRel);
  if (existsSync(dest)) continue;
  if (!existsSync(src)) continue;

  try {
    cpSync(src, dest);
    console.log(`Created ${destRel} from ${srcRel}`);
  } catch (err) {
    console.warn(`Failed to copy ${srcRel} -> ${destRel}:`, err);
  }
}
