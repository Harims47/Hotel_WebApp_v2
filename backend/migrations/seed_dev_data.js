/**
 * Seed development data for Restaurant OS
 * 
 * Creates a restaurant, locations, and role-specific users for development.
 * Safe to re-run — uses ON CONFLICT DO NOTHING.
 * 
 * Usage: node migrations/seed_dev_data.js
 */
const { Pool } = require('pg');
const argon2 = require('argon2');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  console.log(`Seeding dev data in: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);

  try {
    await client.query('BEGIN');

    const pwHash = await argon2.hash('password123');
    const superHash = await argon2.hash('superadmin123');

    // Restaurant
    await client.query(`
      INSERT INTO restaurants (id, name)
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NS Resto Cafe')
      ON CONFLICT DO NOTHING
    `);

    // Locations
    await client.query(`
      INSERT INTO locations (id, restaurant_id, name, address) VALUES
        ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Branch', 'Coimbatore'),
        ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'City Branch', 'Chennai')
      ON CONFLICT DO NOTHING
    `);

    // Users
    const userInserts = [
      { id: 'aaaaaaaa-aaaa-aaaa-0001-000000000001', name: 'Super Admin', username: 'superadmin', hash: superHash },
      { id: 'aaaaaaaa-aaaa-aaaa-0002-000000000002', name: 'General Manager', username: 'gm1', hash: pwHash },
      { id: 'aaaaaaaa-aaaa-aaaa-0003-000000000003', name: 'Waiter One', username: 'waiter1', hash: pwHash },
      { id: 'aaaaaaaa-aaaa-aaaa-0004-000000000004', name: 'Waiter Two', username: 'waiter2', hash: pwHash },
      { id: 'aaaaaaaa-aaaa-aaaa-0005-000000000005', name: 'Cashier One', username: 'cashier1', hash: pwHash },
      { id: 'aaaaaaaa-aaaa-aaaa-0006-000000000006', name: 'KOT Screen', username: 'kot1', hash: pwHash },
      { id: 'aaaaaaaa-aaaa-aaaa-0007-000000000007', name: 'Delivery Boy', username: 'delivery1', hash: pwHash },
      { id: 'aaaaaaaa-aaaa-aaaa-0008-000000000008', name: 'Inventory Manager', username: 'invmgr1', hash: pwHash },
    ];

    for (const u of userInserts) {
      await client.query(`
        INSERT INTO users (id, name, username, password_hash, status) VALUES ($1, $2, $3, $4, 'ACTIVE')
        ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
      `, [u.id, u.name, u.username, u.hash]);
    }
    console.log('✓ Users seeded');

    // Memberships
    const memberships = [
      { id: 'bbbbbbbb-bbbb-bbbb-0001-000000000001', userId: 'aaaaaaaa-aaaa-aaaa-0001-000000000001' },
      { id: 'bbbbbbbb-bbbb-bbbb-0002-000000000002', userId: 'aaaaaaaa-aaaa-aaaa-0002-000000000002' },
      { id: 'bbbbbbbb-bbbb-bbbb-0003-000000000003', userId: 'aaaaaaaa-aaaa-aaaa-0003-000000000003' },
      { id: 'bbbbbbbb-bbbb-bbbb-0004-000000000004', userId: 'aaaaaaaa-aaaa-aaaa-0004-000000000004' },
      { id: 'bbbbbbbb-bbbb-bbbb-0005-000000000005', userId: 'aaaaaaaa-aaaa-aaaa-0005-000000000005' },
      { id: 'bbbbbbbb-bbbb-bbbb-0006-000000000006', userId: 'aaaaaaaa-aaaa-aaaa-0006-000000000006' },
      { id: 'bbbbbbbb-bbbb-bbbb-0007-000000000007', userId: 'aaaaaaaa-aaaa-aaaa-0007-000000000007' },
      { id: 'bbbbbbbb-bbbb-bbbb-0008-000000000008', userId: 'aaaaaaaa-aaaa-aaaa-0008-000000000008' },
    ];

    for (const m of memberships) {
      await client.query(`
        INSERT INTO restaurant_memberships (id, user_id, restaurant_id, status)
        VALUES ($1, $2, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ACTIVE')
        ON CONFLICT DO NOTHING
      `, [m.id, m.userId]);
    }
    console.log('✓ Memberships seeded');

    // Roles
    const roles = [
      { memId: 'bbbbbbbb-bbbb-bbbb-0001-000000000001', locId: null, role: 'SUPER_ADMIN' },
      { memId: 'bbbbbbbb-bbbb-bbbb-0002-000000000002', locId: null, role: 'GM' },
      { memId: 'bbbbbbbb-bbbb-bbbb-0003-000000000003', locId: '11111111-1111-1111-1111-111111111111', role: 'WAITER' },
      { memId: 'bbbbbbbb-bbbb-bbbb-0004-000000000004', locId: '22222222-2222-2222-2222-222222222222', role: 'WAITER' },
      { memId: 'bbbbbbbb-bbbb-bbbb-0005-000000000005', locId: '11111111-1111-1111-1111-111111111111', role: 'CASHIER' },
      { memId: 'bbbbbbbb-bbbb-bbbb-0006-000000000006', locId: '11111111-1111-1111-1111-111111111111', role: 'KOT' },
      { memId: 'bbbbbbbb-bbbb-bbbb-0007-000000000007', locId: '11111111-1111-1111-1111-111111111111', role: 'DELIVERY_BOY' },
      { memId: 'bbbbbbbb-bbbb-bbbb-0008-000000000008', locId: '11111111-1111-1111-1111-111111111111', role: 'INVENTORY_MANAGER' },
    ];

    for (const r of roles) {
      await client.query(`
        INSERT INTO user_roles (id, membership_id, location_id, role)
        VALUES (gen_random_uuid(), $1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [r.memId, r.locId, r.role]);
    }
    console.log('✓ Roles seeded');

    await client.query('COMMIT');
    console.log('\n✅ Dev seed complete.');
    console.log('\nLogin credentials:');
    console.log('  superadmin / superadmin123  → Super Admin');
    console.log('  gm1 / password123           → General Manager (all locations)');
    console.log('  waiter1 / password123       → Waiter (Main Branch)');
    console.log('  waiter2 / password123       → Waiter (City Branch)');
    console.log('  cashier1 / password123      → Cashier (Main Branch)');
    console.log('  kot1 / password123          → KOT Screen (Main Branch)');
    console.log('  delivery1 / password123     → Delivery Boy (Main Branch)');
    console.log('  invmgr1 / password123       → Inventory Manager (Main Branch)');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
