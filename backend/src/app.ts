import Fastify, { FastifyInstance } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { securityPlugin } from './middleware/security.js';
import { authRoutes } from './auth/routes.js';
import { healthRoutes } from './modules/health/routes.js';
import { config } from './config/index.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    bodyLimit: 2 * 1024 * 1024, // 2MB payload limit
    logger: false, // Disables standard stdout console logging noise during tests
  });

  // CORS integration
  app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, or tests)
      if (!origin) {
        cb(null, true);
        return;
      }
      if (config.CORS_ORIGINS.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Cookie parsing
  app.register(fastifyCookie);

  // Custom Security plugins
  app.register(securityPlugin);

  // API router registry
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(healthRoutes);

  return app;
}
