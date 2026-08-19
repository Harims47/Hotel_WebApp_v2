import { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../database/index.js';
import { validateSession } from '../auth/sessions.js';
import { getPermissionsForRoles } from '../rbac/permissions.js';

export interface TenantContext {
  user_id: string;
  restaurant_id: string;
  location_id: string | null;
  roles: string[];
  permissions: string[];
  active_role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    tenantContext?: TenantContext;
  }
}

export async function resolveTenantContext(request: FastifyRequest, reply: FastifyReply): Promise<TenantContext> {
  const sessionToken = request.cookies.session_id;
  if (!sessionToken) {
    reply.status(401).send({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} }
    });
    throw new Error('Unauthorized');
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    reply.status(401).send({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Session invalid or expired', details: {} }
    });
    throw new Error('Unauthorized');
  }

  // Fetch user, memberships, and roles
  const query = `
    SELECT 
      u.id AS user_id, u.status AS user_status,
      rm.id AS membership_id, rm.restaurant_id, rm.status AS membership_status,
      ur.role, ur.location_id
    FROM users u
    LEFT JOIN restaurant_memberships rm ON rm.user_id = u.id AND rm.deleted_at IS NULL
    LEFT JOIN user_roles ur ON ur.membership_id = rm.id AND ur.deleted_at IS NULL
    WHERE u.id = $1 AND u.deleted_at IS NULL
  `;
  const res = await pool.query(query, [session.user_id]);
  if (res.rows.length === 0) {
    reply.status(401).send({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'User not found', details: {} }
    });
    throw new Error('Unauthorized');
  }

  const firstRow = res.rows[0];
  if (firstRow.user_status !== 'ACTIVE') {
    reply.status(403).send({
      success: false,
      data: null,
      error: { code: 'FORBIDDEN', message: 'User account is inactive', details: {} }
    });
    throw new Error('Forbidden');
  }

  // Resolve headers
  const reqRestId = request.headers['x-restaurant-id'] as string | undefined;
  const reqLocId = request.headers['x-location-id'] as string | undefined;

  // Find active membership
  let activeMembershipRows = res.rows.filter(row => row.membership_status === 'ACTIVE');
  if (reqRestId) {
    activeMembershipRows = activeMembershipRows.filter(row => row.restaurant_id === reqRestId);
  }

  if (activeMembershipRows.length === 0) {
    reply.status(403).send({
      success: false,
      data: null,
      error: { code: 'FORBIDDEN', message: 'No active membership found for this brand', details: {} }
    });
    throw new Error('Forbidden');
  }

  const activeRestId = activeMembershipRows[0].restaurant_id;

  // Resolve unique roles for active restaurant membership
  const roles = Array.from(new Set(activeMembershipRows.map(row => row.role).filter(Boolean))) as string[];
  const permissions = getPermissionsForRoles(roles);

  let activeLocationId: string | null = null;
  const activeRole = roles[0] || 'GUEST';

  if (roles.includes('SUPER_ADMIN') || roles.includes('GM')) {
    if (reqLocId) {
      activeLocationId = reqLocId;
    }
  } else {
    const boundLocs = Array.from(new Set(activeMembershipRows.map(row => row.location_id).filter(Boolean))) as string[];
    if (boundLocs.length > 0) {
      if (reqLocId) {
        if (boundLocs.includes(reqLocId)) {
          activeLocationId = reqLocId;
        } else {
          reply.status(403).send({
            success: false,
            data: null,
            error: { code: 'FORBIDDEN', message: 'Unauthorized location access', details: {} }
          });
          throw new Error('Forbidden');
        }
      } else {
        activeLocationId = boundLocs[0];
      }
    } else {
      reply.status(403).send({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'No location assigned to user role', details: {} }
      });
      throw new Error('Forbidden');
    }
  }

  const context: TenantContext = {
    user_id: session.user_id,
    restaurant_id: activeRestId,
    location_id: activeLocationId,
    roles,
    permissions,
    active_role: activeRole,
  };

  request.tenantContext = context;
  return context;
}
