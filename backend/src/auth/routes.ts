import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import argon2 from 'argon2';
import { pool } from '../database/index.js';
import { createSession, deleteSession } from './sessions.js';
import { resolveTenantContext } from '../tenancy/context.js';
import { getPermissionsForRoles } from '../rbac/permissions.js';

// In-Memory Brute-Force Rate Limiter
interface LoginAttempt {
  count: number;
  lockUntil: Date | null;
}
const loginAttempts = new Map<string, LoginAttempt>();

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/auth/login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = request.body as any;

    if (!username || !password) {
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'BAD_REQUEST', message: 'Username and password are required', details: {} }
      });
    }

    const now = new Date();
    const attempt = loginAttempts.get(username) || { count: 0, lockUntil: null };

    if (attempt.lockUntil && attempt.lockUntil > now) {
      return reply.status(429).send({
        success: false,
        data: null,
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many failed login attempts. Please try again after 15 minutes.', details: {} }
      });
    }

    const query = 'SELECT id, username, password_hash, status FROM users WHERE username = $1 AND deleted_at IS NULL';
    const res = await pool.query(query, [username]);
    const user = res.rows[0];

    if (!user || !(await argon2.verify(user.password_hash, password))) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockUntil = new Date(now.getTime() + 15 * 60 * 1000);
      }
      loginAttempts.set(username, attempt);
      return reply.status(400).send({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Invalid username or password', details: {} }
      });
    }

    if (user.status !== 'ACTIVE') {
      return reply.status(403).send({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'User account is inactive', details: {} }
      });
    }

    // Reset attempts on success
    loginAttempts.delete(username);

    // Create session
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'] || null;
    const session = await createSession(user.id, ipAddress, userAgent);

    // Set cookie
    reply.setCookie('session_id', session.session_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: 'strict'
    });

    return reply.status(200).send({
      success: true,
      data: { expires_at: session.expires_at.toISOString() },
      message: 'Login successful',
      meta: null
    });
  });

  // POST /api/v1/auth/logout
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionToken = request.cookies.session_id;
    if (sessionToken) {
      await deleteSession(sessionToken);
    }
    reply.clearCookie('session_id', { path: '/' });
    return reply.status(204).send();
  });

  // GET /api/v1/auth/me
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const context = await resolveTenantContext(request, reply);

    // Load full user details, memberships, and roles
    const userQuery = `
      SELECT 
        u.id AS user_id, u.name, u.username, u.phone,
        rm.id AS membership_id, rm.restaurant_id, r.name AS restaurant_name, rm.status AS membership_status,
        ur.role, ur.location_id, l.name AS location_name
      FROM users u
      LEFT JOIN restaurant_memberships rm ON rm.user_id = u.id AND rm.deleted_at IS NULL
      LEFT JOIN restaurants r ON r.id = rm.restaurant_id
      LEFT JOIN user_roles ur ON ur.membership_id = rm.id AND ur.deleted_at IS NULL
      LEFT JOIN locations l ON l.id = ur.location_id AND l.deleted_at IS NULL
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `;
    const res = await pool.query(userQuery, [context.user_id]);
    if (res.rows.length === 0) {
      return reply.status(401).send({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'User not found', details: {} }
      });
    }

    const rows = res.rows;
    const userRow = rows[0];

    // Build memberships data
    const membershipsMap = new Map<string, any>();
    for (const row of rows) {
      if (!row.membership_id) continue;
      if (!membershipsMap.has(row.restaurant_id)) {
        membershipsMap.set(row.restaurant_id, {
          restaurant_id: row.restaurant_id,
          restaurant_name: row.restaurant_name,
          roles: new Set<string>(),
          locations: new Map<string, string>()
        });
      }
      const m = membershipsMap.get(row.restaurant_id);
      if (row.role) {
        m.roles.add(row.role);
      }
      if (row.location_id && row.location_name) {
        m.locations.set(row.location_id, row.location_name);
      }
    }

    const membershipsData = Array.from(membershipsMap.values()).map(m => {
      const rolesList = Array.from(m.roles) as string[];
      return {
        restaurant_id: m.restaurant_id,
        restaurant_name: m.restaurant_name,
        roles: rolesList,
        permissions: getPermissionsForRoles(rolesList),
        locations: Array.from(m.locations.entries()).map(([id, name]) => ({
          location_id: id,
          name: name
        }))
      };
    });

    // Resolve active names
    const activeRestRow = rows.find(r => r.restaurant_id === context.restaurant_id);
    const activeRestName = activeRestRow ? activeRestRow.restaurant_name : 'Unknown Brand';
    const activeLocRow = rows.find(r => r.location_id === context.location_id);
    const activeLocName = activeLocRow ? activeLocRow.location_name : null;

    return reply.status(200).send({
      success: true,
      data: {
        user: {
          id: userRow.user_id,
          name: userRow.name,
          username: userRow.username,
          phone: userRow.phone
        },
        active_context: {
          restaurant_id: context.restaurant_id,
          restaurant_name: activeRestName,
          location_id: context.location_id,
          location_name: activeLocName
        },
        memberships: membershipsData
      },
      message: null,
      meta: null
    });
  });
}
