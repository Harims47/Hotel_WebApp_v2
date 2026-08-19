import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.ENVIRONMENT === 'testing' ? config.TEST_DATABASE_URL : config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function withTenancy<T>(
  tenantId: string,
  locationId: string | null,
  role: string,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (config.ENVIRONMENT === 'testing') {
      // Switch active role to test_app_user for testing RLS enforcement
      await client.query('SET LOCAL ROLE test_app_user');
    }

    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    await client.query("SELECT set_config('app.current_location_id', $1, true)", [locationId || '']);
    await client.query("SELECT set_config('app.current_user_role', $1, true)", [role]);

    const result = await fn(client);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
