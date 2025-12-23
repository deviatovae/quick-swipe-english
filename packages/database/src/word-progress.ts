import { randomUUID } from 'node:crypto';
import { eq, and, lte } from 'drizzle-orm';

import type { Database } from './client.js';
import {
  wordProgress,
  type WordProgressRow,
  type WordStatus,
} from './schema/index.js';

/**
 * SM-2 Algorithm implementation
 * quality: 0-5 (0-2 = incorrect, 3-5 = correct)
 * For our use case: "unknown" = 1, "known" = 4
 */
export interface SM2Input {
  quality: number; // 0-5
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Output {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export function calculateSM2(input: SM2Input): SM2Output {
  const {
    quality,
    easeFactor: prevEF,
    interval: prevInterval,
    repetitions: prevReps,
  } = input;

  let newEF = prevEF;
  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    // Incorrect response - reset
    newReps = 0;
    newInterval = 1;
  } else {
    // Correct response
    newReps = prevReps + 1;

    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(prevInterval * prevEF);
    }

    // Update ease factor
    newEF = prevEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEF < 1.3) {
      newEF = 1.3;
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: newEF,
    interval: newInterval,
    repetitions: newReps,
    nextReviewDate,
  };
}

export async function addWordToProgress(
  db: Database,
  userId: string,
  wordId: number,
  options: { status?: WordStatus; initialQuality?: number } = {}
): Promise<WordProgressRow> {
  const { status = 'unknown', initialQuality = 1 } = options;

  const existing = await db.query.wordProgress.findFirst({
    where: and(
      eq(wordProgress.userId, userId),
      eq(wordProgress.wordId, wordId)
    ),
  });

  if (existing) {
    // Word already in progress, update with quality=1 (unknown)
    return updateWordProgress(db, userId, wordId, 1);
  }

  const id = randomUUID();
  const now = new Date();

  await db.insert(wordProgress).values({
    id,
    userId,
    wordId,
    easeFactor: 2.5,
    interval: initialQuality >= 3 ? 6 : 1,
    repetitions: initialQuality >= 3 ? 1 : 0,
    nextReviewDate: now,
    lastReviewDate: now,
    status,
  });

  const created = await db.query.wordProgress.findFirst({
    where: eq(wordProgress.id, id),
  });

  if (!created) {
    throw new Error('Failed to add word to progress');
  }

  return created;
}

export async function updateWordProgress(
  db: Database,
  userId: string,
  wordId: number,
  quality: number,
  status?: WordStatus
): Promise<WordProgressRow> {
  const existing = await db.query.wordProgress.findFirst({
    where: and(
      eq(wordProgress.userId, userId),
      eq(wordProgress.wordId, wordId)
    ),
  });

  if (!existing) {
    throw new Error('Word progress not found');
  }

  const sm2Result = calculateSM2({
    quality,
    easeFactor: existing.easeFactor,
    interval: existing.interval,
    repetitions: existing.repetitions,
  });

  await db
    .update(wordProgress)
    .set({
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      nextReviewDate: sm2Result.nextReviewDate,
      lastReviewDate: new Date(),
      ...(status ? { status } : {}),
    })
    .where(eq(wordProgress.id, existing.id));

  const updated = await db.query.wordProgress.findFirst({
    where: eq(wordProgress.id, existing.id),
  });

  if (!updated) {
    throw new Error('Failed to update word progress');
  }

  return updated;
}

export async function getWordProgressByUser(
  db: Database,
  userId: string
): Promise<WordProgressRow[]> {
  return db.query.wordProgress.findMany({
    where: eq(wordProgress.userId, userId),
  });
}

export async function getDueWords(
  db: Database,
  userId: string
): Promise<WordProgressRow[]> {
  const now = new Date();

  return db.query.wordProgress.findMany({
    where: and(
      eq(wordProgress.userId, userId),
      eq(wordProgress.status, 'unknown'),
      lte(wordProgress.nextReviewDate, now)
    ),
  });
}

export async function deleteWordProgress(
  db: Database,
  userId: string,
  wordId: number
): Promise<void> {
  await db
    .delete(wordProgress)
    .where(
      and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId))
    );
}

export async function deleteAllWordProgress(
  db: Database,
  userId: string
): Promise<void> {
  await db.delete(wordProgress).where(eq(wordProgress.userId, userId));
}

export async function getWordProgress(
  db: Database,
  userId: string,
  wordId: number
): Promise<WordProgressRow | undefined> {
  return db.query.wordProgress.findFirst({
    where: and(
      eq(wordProgress.userId, userId),
      eq(wordProgress.wordId, wordId)
    ),
  });
}
