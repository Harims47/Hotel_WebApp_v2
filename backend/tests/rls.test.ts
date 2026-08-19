process.env.ENVIRONMENT = 'testing';
import { cleanAndSeedDatabase } from './setup.js';
import { pool, withTenancy } from '../src/database/index.js';

beforeAll(async () => {
});

afterAll(async () => {
  await pool.end();
});

describe('Row Level Security & Context Isolation Tests', () => {
  beforeEach(async () => {
    await cleanAndSeedDatabase();
  });

  test('Tenant Isolation - Restaurant A cannot see Restaurant B records', async () => {
    const tables = await withTenancy(
      'a0000000-0000-0000-0000-000000000000',
      'a1111111-1111-1111-1111-111111111111',
      'WAITER',
      async (client) => {
        const res = await client.query('SELECT * FROM tables');
        return res.rows;
      }
    );

    // Should only see Restaurant A Coimbatore Main table
    expect(tables.length).toBe(1);
    expect(tables[0].restaurant_id).toBe('a0000000-0000-0000-0000-000000000000');
    expect(tables[0].location_id).toBe('a1111111-1111-1111-1111-111111111111');
  });

  test('Location Isolation - Coimbatore waiter cannot see Chennai tables', async () => {
    const tables = await withTenancy(
      'a0000000-0000-0000-0000-000000000000',
      'a1111111-1111-1111-1111-111111111111',
      'WAITER',
      async (client) => {
        const res = await client.query('SELECT * FROM tables');
        return res.rows;
      }
    );

    expect(tables.length).toBe(1);
    expect(tables[0].location_id).not.toBe('a2222222-2222-2222-2222-222222222222');
  });

  test('GM Wildcard - Restaurant A GM can see all locations within Restaurant A but not B', async () => {
    const tables = await withTenancy(
      'a0000000-0000-0000-0000-000000000000',
      null, // GM wildcard location context
      'GM',
      async (client) => {
        const res = await client.query('SELECT * FROM tables');
        return res.rows;
      }
    );

    // Should see both tables in Restaurant A (Coimbatore & Chennai)
    expect(tables.length).toBe(2);
    const restIds = tables.map(t => t.restaurant_id);
    expect(restIds.every(id => id === 'a0000000-0000-0000-0000-000000000000')).toBe(true);
    expect(restIds.includes('b0000000-0000-0000-0000-000000000000')).toBe(false);
  });

  test('Connection Pooling Leak Prevention', async () => {
    // Acquire a client, set context, commit and release it.
    await withTenancy(
      'a0000000-0000-0000-0000-000000000000',
      'a1111111-1111-1111-1111-111111111111',
      'WAITER',
      async (client) => {
        // Query to trigger transaction block
        await client.query('SELECT 1');
      }
    );

    // Acquire another connection (which might be the same reused client connection)
    // Run query without active tenant context.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Execute SET LOCAL ROLE so we run as test_app_user (forcing RLS)
      await client.query('SET LOCAL ROLE test_app_user');
      
      // Since context was committed/released, transaction settings must be cleared
      const res = await client.query('SELECT * FROM tables');
      await client.query('COMMIT');
      // Running under restricted role with empty context must return 0 rows.
      expect(res.rows.length).toBe(0);
    } finally {
      client.release();
    }
  });

  test('Concurrent requests are isolated', async () => {
    const runReqA = withTenancy(
      'a0000000-0000-0000-0000-000000000000',
      'a1111111-1111-1111-1111-111111111111',
      'WAITER',
      async (client) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const res = await client.query('SELECT * FROM tables');
        return res.rows;
      }
    );

    const runReqB = withTenancy(
      'b0000000-0000-0000-0000-000000000000',
      'b1111111-1111-1111-1111-111111111111',
      'WAITER',
      async (client) => {
        const res = await client.query('SELECT * FROM tables');
        return res.rows;
      }
    );

    const [tablesA, tablesB] = await Promise.all([runReqA, runReqB]);

    expect(tablesA.length).toBe(1);
    expect(tablesA[0].restaurant_id).toBe('a0000000-0000-0000-0000-000000000000');

    expect(tablesB.length).toBe(1);
    expect(tablesB[0].restaurant_id).toBe('b0000000-0000-0000-0000-000000000000');
  });
});
