import argon2 from "argon2";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  createUser,
  findUserByEmail,
  findUserById,
  type Database,
} from "@ai-workshop/database";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerAuthRoutes(app: FastifyInstance, db: Database) {
  app.post("/auth/signup", async (request, reply) => {
    const body = credentialsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "Invalid credentials" });
    }
    const existing = await findUserByEmail(db, body.data.email);
    if (existing) {
      return reply.code(409).send({ error: "User already exists" });
    }
    const passwordHash = await argon2.hash(body.data.password);
    const user = await createUser(db, {
      email: body.data.email,
      passwordHash,
    });
    const token = app.jwt.sign({ sub: user.id });
    return reply.send({
      token,
      user: { id: user.id, email: user.email },
    });
  });

  app.post("/auth/signin", async (request, reply) => {
    const body = credentialsSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "Invalid credentials" });
    }
    const user = await findUserByEmail(db, body.data.email);
    if (!user) {
      return reply.code(401).send({ error: "Invalid email/password" });
    }
    const valid = await argon2.verify(user.passwordHash, body.data.password);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid email/password" });
    }
    const token = app.jwt.sign({ sub: user.id });
    return reply.send({
      token,
      user: { id: user.id, email: user.email },
    });
  });

  app.get(
    "/auth/me",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      const user = await findUserById(db, userId);
      if (!user) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      return reply.send({ id: user.id, email: user.email });
    },
  );
}

