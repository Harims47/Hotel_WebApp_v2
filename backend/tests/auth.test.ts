process.env.ENVIRONMENT = 'testing';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { cleanAndSeedDatabase } from './setup.js';
import { pool } from '../src/database/index.js';

const app = buildApp();

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe('Authentication API Tests', () => {
  beforeEach(async () => {
    await cleanAndSeedDatabase();
  });

  test('Valid Login Flow - cookie is set, session token is not in JSON', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/login')
      .send({ username: 'a_waiter', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('expires_at');
    expect(res.body.data.session_id).toBeUndefined(); // Session token must not be in JSON

    const cookies = (res.headers['set-cookie'] as string[]) || [];
    const hasSessionCookie = cookies.some((c: string) => c.startsWith('session_id=') && c.includes('HttpOnly'));
    expect(hasSessionCookie).toBe(true);
  });

  test('Invalid Credentials', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/login')
      .send({ username: 'a_waiter', password: 'wrongpassword' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('Inactive User Rejection', async () => {
    const res = await request(app.server)
      .post('/api/v1/auth/login')
      .send({ username: 'inactive_user', password: 'password123' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('Logout & Cookie Clearing', async () => {
    const loginRes = await request(app.server)
      .post('/api/v1/auth/login')
      .send({ username: 'a_waiter', password: 'password123' });
    const cookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(app.server)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(204);

    const clearedCookies = (logoutRes.headers['set-cookie'] as string[]) || [];
    const isCleared = clearedCookies.some((c: string) => c.startsWith('session_id=;') || c.includes('Max-Age=0') || c.includes('expires='));
    expect(isCleared).toBe(true);
  });

  test('Profile Recovery (/me) and session recovery', async () => {
    const loginRes = await request(app.server)
      .post('/api/v1/auth/login')
      .send({ username: 'a_waiter', password: 'password123' });
    const cookie = loginRes.headers['set-cookie'];

    const meRes = await request(app.server)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.username).toBe('a_waiter');
    expect(meRes.body.data.active_context.restaurant_name).toBe('Restaurant A');
  });

  test('Login Rate Limiting (Brute force protection)', async () => {
    // 5 failures
    for (let i = 0; i < 5; i++) {
      await request(app.server)
        .post('/api/v1/auth/login')
        .send({ username: 'a_waiter', password: 'wrongpassword' });
    }

    // 6th attempt should return 429
    const limitRes = await request(app.server)
      .post('/api/v1/auth/login')
      .send({ username: 'a_waiter', password: 'password123' });

    expect(limitRes.status).toBe(429);
    expect(limitRes.body.success).toBe(false);
    expect(limitRes.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
