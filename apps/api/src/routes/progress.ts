import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  addWordToProgress,
  getWordProgressByUser,
  getDueWords,
  updateWordProgress,
  deleteWordProgress,
  deleteAllWordProgress,
  getWordProgress,
  type Database,
} from "@ai-workshop/database";

const wordIdParamsSchema = z.object({
  wordId: z.coerce.number().int().positive(),
});

const updateBodySchema = z.object({
  quality: z.number().int().min(0).max(5),
});

export async function registerProgressRoutes(app: FastifyInstance, db: Database) {
  // Get all progress for user
  app.get(
    "/progress",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const progress = await getWordProgressByUser(db, userId);
      return reply.send(progress);
    }
  );

  // Get words due for review today
  app.get(
    "/progress/due",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const dueWords = await getDueWords(db, userId);
      return reply.send(dueWords);
    }
  );

  // Add word to progress (when user swipes "unknown")
  app.post(
    "/progress/:wordId",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const params = wordIdParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid word ID" });
      }

      const progress = await addWordToProgress(db, userId, params.data.wordId);
      return reply.send(progress);
    }
  );

  // Update word progress (for Telegram bot reviews)
  app.put(
    "/progress/:wordId",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const params = wordIdParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid word ID" });
      }

      const body = updateBodySchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: "Invalid quality value" });
      }

      const existing = await getWordProgress(db, userId, params.data.wordId);
      if (!existing) {
        return reply.code(404).send({ error: "Word not in progress" });
      }

      const progress = await updateWordProgress(
        db,
        userId,
        params.data.wordId,
        body.data.quality
      );
      return reply.send(progress);
    }
  );

  // Delete all words from progress (reset)
  app.delete(
    "/progress",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      await deleteAllWordProgress(db, userId);
      return reply.code(204).send();
    }
  );

  // Delete word from progress (marked as learned)
  app.delete(
    "/progress/:wordId",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const params = wordIdParamsSchema.safeParse(request.params);
      if (!params.success) {
        return reply.code(400).send({ error: "Invalid word ID" });
      }

      await deleteWordProgress(db, userId, params.data.wordId);
      return reply.code(204).send();
    }
  );
}

