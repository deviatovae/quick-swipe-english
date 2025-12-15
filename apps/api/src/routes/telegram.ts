import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

const linkCodes = new Map<string, { token: string; expiresAt: number }>();

const CODE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const CODE_LENGTH = 8;

function generateCode(): string {
  return randomBytes(CODE_LENGTH / 2).toString("hex");
}

function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [code, data] of linkCodes.entries()) {
    if (data.expiresAt < now) {
      linkCodes.delete(code);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredCodes, 60 * 1000);

const exchangeSchema = z.object({
  code: z.string().min(1),
});

export async function registerTelegramRoutes(app: FastifyInstance) {
  app.post(
    "/telegram/link-code",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const userId = request.authUser?.id;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.code(401).send({ error: "No token provided" });
      }
      const token = authHeader.slice(7);

      const code = generateCode();
      const expiresAt = Date.now() + CODE_TTL_MS;

      linkCodes.set(code, { token, expiresAt });

      return reply.send({
        code,
        expiresIn: CODE_TTL_MS / 1000,
      });
    }
  );

  // Exchange a link code for the stored JWT
  app.post("/telegram/exchange", async (request, reply) => {
    const body = exchangeSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "Invalid request" });
    }

    const { code } = body.data;
    const data = linkCodes.get(code);

    if (!data) {
      return reply.code(404).send({ error: "Code not found or expired" });
    }

    if (data.expiresAt < Date.now()) {
      linkCodes.delete(code);
      return reply.code(410).send({ error: "Code expired" });
    }

    linkCodes.delete(code);

    return reply.send({ token: data.token });
  });
}

