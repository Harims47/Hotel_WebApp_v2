/**
 * Restaurant OS — Node.js Schema Migration
 * 
 * Applies the Phase 1 schema to the target PostgreSQL database.
 * This is idempotent — safe to run multiple times.
 * 
 * Usage: node migrations/apply_schema.js
 */
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applySchema() {
  const client = await pool.connect();
  console.log(`Applying schema to: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}`);
  
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        tax_id VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✓ restaurants');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(15),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✓ users');

    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✓ locations');

    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        config_key VARCHAR(100) NOT NULL,
        config_value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✓ restaurant_configurations');

    await client.query(`
      CREATE TABLE IF NOT EXISTS location_configurations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        config_key VARCHAR(100) NOT NULL,
        config_value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✓ location_configurations');

    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurant_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT unique_user_restaurant UNIQUE(user_id, restaurant_id)
      )
    `);
    console.log('✓ restaurant_memberships');

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        membership_id UUID NOT NULL REFERENCES restaurant_memberships(id) ON DELETE CASCADE,
        location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
        role VARCHAR(30) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✓ user_roles');

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✓ user_sessions');

    await client.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
        table_number VARCHAR(10) NOT NULL,
        capacity INT NOT NULL,
        section VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
        config_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT unique_location_table_number UNIQUE(location_id, table_number)
      )
    `);
    console.log('✓ tables');

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        old_state JSONB,
        new_state JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);
    console.log('✓ audit_logs');

    // Enable RLS
    const rlsTables = ['restaurants', 'locations', 'restaurant_memberships', 'user_roles', 'tables', 'audit_logs'];
    for (const t of rlsTables) {
      await client.query(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE ${t} FORCE ROW LEVEL SECURITY`);
    }
    console.log('✓ RLS enabled on all protected tables');

    // Create RLS policies (DROP + CREATE for idempotency)
    const policies = [
      {
        table: 'restaurants',
        using: `id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
      },
      {
        table: 'locations',
        using: `restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
      },
      {
        table: 'restaurant_memberships',
        using: `restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid`
      },
      {
        table: 'user_roles',
        using: `EXISTS (SELECT 1 FROM restaurant_memberships rm WHERE rm.id = membership_id AND rm.restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`
      },
      {
        table: 'tables',
        using: `restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid AND (NULLIF(current_setting('app.current_location_id', true), '') IS NULL OR location_id = NULLIF(current_setting('app.current_location_id', true), '')::uuid OR current_setting('app.current_user_role', true) IN ('GM', 'SUPER_ADMIN'))`
      },
      {
        table: 'audit_logs',
        using: `restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid AND (NULLIF(current_setting('app.current_location_id', true), '') IS NULL OR location_id = NULLIF(current_setting('app.current_location_id', true), '')::uuid OR current_setting('app.current_user_role', true) IN ('GM', 'SUPER_ADMIN'))`
      }
    ];

    for (const p of policies) {
      await client.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${p.table}`);
      await client.query(`CREATE POLICY tenant_isolation_policy ON ${p.table} USING (${p.using})`);
    }
    console.log('✓ RLS policies applied');

    // Ensure app_user role exists with grants
    const roleExists = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = 'app_user'`);
    if (roleExists.rows.length === 0) {
      await client.query(`CREATE ROLE app_user`);
      console.log('✓ Created role app_user');
    }
    await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user`);
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user`);
    console.log('✓ Grants applied to app_user');

    await client.query('COMMIT');
    console.log('\n✅ Schema migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

applySchema().catch(() => process.exit(1));
