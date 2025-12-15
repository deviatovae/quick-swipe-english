import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';

import { loadConfig } from './env.js';
import { initDb } from './db.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerProgressRoutes } from './routes/progress.js';
import { registerTelegramRoutes } from './routes/telegram.js';

export async function buildServer() {
  const config = loadConfig();
  const app = Fastify({
    logger: true,
  });

  const db = initDb(config);

  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await app.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: config.jwtExpiresIn,
    },
  });

  app.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const payload = await request.jwtVerify<{ sub: string }>();
        request.authUser = { id: payload.sub };
      } catch {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );

  await registerAuthRoutes(app, db);
  await registerProgressRoutes(app, db);
  await registerTelegramRoutes(app);

  return { app, config };
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    authUser?: {
      id: string;
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer()
    .then(({ app, config }) =>
      app.listen({ port: config.port, host: config.host }).then(() => {
        app.log.info(`API running at http://${config.host}:${config.port}`);
      })
    )
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
