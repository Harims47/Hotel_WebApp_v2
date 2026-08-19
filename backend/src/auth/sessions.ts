import crypto from 'crypto';
import pg from 'pg';
import { config } from '../config/index.js';
import { pool } from '../database/index.js';

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: Date;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createSession(
  userId: string,
  ipAddress: string | null,
  userAgent: string | null,
  client?: pg.PoolClient
): Promise<UserSession> {
  const db = client || pool;
  const token = crypto.randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.IDLE_TIMEOUT_MS);

  const query = `
    INSERT INTO user_sessions (id, user_id, session_token, expires_at, ip_address, user_agent)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
    RETURNING id, user_id, session_token, expires_at, ip_address, user_agent, created_at, updated_at
  `;
  const res = await db.query(query, [userId, token, expiresAt, ipAddress, userAgent]);
  return res.rows[0];
}

export async function validateSession(token: string, client?: pg.PoolClient): Promise<UserSession | null> {
  const db = client || pool;
  const query = `
    SELECT id, user_id, session_token, expires_at, ip_address, user_agent, created_at, updated_at
    FROM user_sessions
    WHERE session_token = $1 AND deleted_at IS NULL
  `;
  const res = await db.query(query, [token]);
  const session = res.rows[0] as UserSession | undefined;

  if (!session) return null;

  const now = new Date();

  // Enforce idle timeout
  if (new Date(session.expires_at).getTime() < now.getTime()) {
    await deleteSession(token, db);
    return null;
  }

  // Enforce absolute timeout (12 hours)
  if (new Date(session.created_at).getTime() + config.ABSOLUTE_TIMEOUT_MS < now.getTime()) {
    await deleteSession(token, db);
    return null;
  }

  // Update idle timeout expiration
  const newExpiresAt = new Date(now.getTime() + config.IDLE_TIMEOUT_MS);
  await db.query(
    'UPDATE user_sessions SET expires_at = $1, updated_at = $2 WHERE session_token = $3',
    [newExpiresAt, now, token]
  );
  session.expires_at = newExpiresAt;

  return session;
}

export async function deleteSession(token: string, client?: pg.PoolClient | pg.Pool): Promise<void> {
  const db = client || pool;
  await db.query('UPDATE user_sessions SET deleted_at = NOW() WHERE session_token = $1', [token]);
}
