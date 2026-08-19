import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nextstep_ecommerce',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/postgres_test',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  SESSION_COOKIE_NAME: 'session_id',
  IDLE_TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours
  ABSOLUTE_TIMEOUT_MS: 12 * 60 * 60 * 1000, // 12 hours
};
