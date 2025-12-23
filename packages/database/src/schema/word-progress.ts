import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
import { users } from "./users.js";

export const WORD_STATUS = ["unknown", "known"] as const;
export type WordStatus = (typeof WORD_STATUS)[number];

export const wordProgress = sqliteTable(
  "word_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    wordId: integer("word_id").notNull(),
    easeFactor: real("ease_factor").notNull().default(2.5),
    interval: integer("interval").notNull().default(1),
    repetitions: integer("repetitions").notNull().default(0),
    nextReviewDate: integer("next_review_date", { mode: "timestamp" }),
    lastReviewDate: integer("last_review_date", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    status: text("status", { enum: WORD_STATUS })
      .notNull()
      .default("unknown"),
  },
  (table) => ({
    userWordUnique: uniqueIndex("word_progress_user_word_unique").on(
      table.userId,
      table.wordId,
    ),
  })
);

export type WordProgressRow = typeof wordProgress.$inferSelect;
export type WordProgressInsert = typeof wordProgress.$inferInsert;
