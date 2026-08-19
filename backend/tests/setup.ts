import pg from 'pg';
import argon2 from 'argon2';
import { config } from '../src/config/index.js';

const { Client } = pg;

export async function cleanAndSeedDatabase(): Promise<void> {
  const client = new Client({ connectionString: config.TEST_DATABASE_URL });
  await client.connect();

  try {
    // 1. Create tables if they do not exist
    const checkTable = await client.query("SELECT 1 FROM pg_tables WHERE tablename = 'restaurants'");
    if (checkTable.rows.length === 0) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS restaurants (
          id UUID PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          tax_id VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          phone VARCHAR(15),
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS locations (
          id UUID PRIMARY KEY,
          restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
          name VARCHAR(100) NOT NULL,
          address TEXT,
          phone VARCHAR(20),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS restaurant_memberships (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE,
          CONSTRAINT unique_user_restaurant UNIQUE(user_id, restaurant_id)
        );

        CREATE TABLE IF NOT EXISTS user_roles (
          id UUID PRIMARY KEY,
          membership_id UUID REFERENCES restaurant_memberships(id) ON DELETE CASCADE NOT NULL,
          location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
          role VARCHAR(30) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS tables (
          id UUID PRIMARY KEY,
          restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
          location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
          table_number VARCHAR(10) NOT NULL,
          capacity INT NOT NULL,
          section VARCHAR(50),
          status VARCHAR(20) DEFAULT 'AVAILABLE' NOT NULL,
          config_status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          deleted_at TIMESTAMP WITH TIME ZONE,
          CONSTRAINT unique_location_table_number UNIQUE(location_id, table_number)
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY,
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
        );

        -- Enable RLS and FORCE RLS on owners
        ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
        ALTER TABLE restaurants FORCE ROW LEVEL SECURITY;
        ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE locations FORCE ROW LEVEL SECURITY;
        ALTER TABLE restaurant_memberships ENABLE ROW LEVEL SECURITY;
        ALTER TABLE restaurant_memberships FORCE ROW LEVEL SECURITY;
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
        ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
        ALTER TABLE tables FORCE ROW LEVEL SECURITY;
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY tenant_isolation_policy ON restaurants
        USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

        CREATE POLICY tenant_isolation_policy ON locations
        USING (restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

        CREATE POLICY tenant_isolation_policy ON restaurant_memberships
        USING (restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

        CREATE POLICY tenant_isolation_policy ON user_roles
        USING (
          EXISTS (
            SELECT 1 FROM restaurant_memberships rm
            WHERE rm.id = membership_id
            AND rm.restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
          )
        );

        CREATE POLICY tenant_isolation_policy ON tables
        USING (
          restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
          AND (
            NULLIF(current_setting('app.current_location_id', true), '') IS NULL
            OR location_id = NULLIF(current_setting('app.current_location_id', true), '')::uuid
            OR current_setting('app.current_user_role', true) IN ('GM', 'SUPER_ADMIN')
          )
        );

        CREATE POLICY tenant_isolation_policy ON audit_logs
        USING (
          restaurant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
          AND (
            NULLIF(current_setting('app.current_location_id', true), '') IS NULL
            OR location_id = NULLIF(current_setting('app.current_location_id', true), '')::uuid
            OR current_setting('app.current_user_role', true) IN ('GM', 'SUPER_ADMIN')
          )
        );
      `);

      // Ensure test role test_app_user exists
      const roleExists = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'test_app_user'");
      if (roleExists.rows.length === 0) {
        await client.query("CREATE ROLE test_app_user WITH LOGIN PASSWORD 'password'");
      }
      
      // Grant privileges
      await client.query("GRANT ALL ON SCHEMA public TO test_app_user;");
      await client.query("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_app_user;");
      await client.query("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_app_user;");
    }

    // 2. Truncate all tables CASCADE to clear state
    await client.query('SET LOCAL app.current_tenant_id = \'\'');
    await client.query('SET LOCAL app.current_location_id = \'\'');
    await client.query('SET LOCAL app.current_user_role = \'SUPER_ADMIN\'');
    
    await client.query(`
      TRUNCATE TABLE 
        restaurants, locations, users, restaurant_memberships, 
        user_roles, user_sessions, tables, audit_logs 
      CASCADE
    `);

    // 3. Hash password
    const passwordHash = await argon2.hash('password123');

    // 4. Seed Restaurants
    await client.query(`
      INSERT INTO restaurants (id, name) VALUES 
      ('a0000000-0000-0000-0000-000000000000', 'Restaurant A'),
      ('b0000000-0000-0000-0000-000000000000', 'Restaurant B')
    `);

    // 5. Seed Locations
    await client.query(`
      INSERT INTO locations (id, restaurant_id, name) VALUES 
      ('a1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000000', 'Coimbatore Main'),
      ('a2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000000', 'Chennai Branch'),
      ('b1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000000', 'Bangalore Outlet')
    `);

    // 6. Seed Users
    await client.query(`
      INSERT INTO users (id, name, username, password_hash, status) VALUES 
      ('11111111-1111-1111-1111-111111111111', 'A Waiter', 'a_waiter', $1, 'ACTIVE'),
      ('22222222-2222-2222-2222-222222222222', 'A GM', 'a_gm', $1, 'ACTIVE'),
      ('33333333-3333-3333-3333-333333333333', 'B Waiter', 'b_waiter', $1, 'ACTIVE'),
      ('44444444-4444-4444-4444-444444444444', 'Inactive User', 'inactive_user', $1, 'INACTIVE')
    `, [passwordHash]);

    // 7. Seed memberships
    await client.query(`
      INSERT INTO restaurant_memberships (id, user_id, restaurant_id, status) VALUES 
      ('a1f11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000000', 'ACTIVE'),
      ('a2f22222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000000', 'ACTIVE'),
      ('b1f11111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'b0000000-0000-0000-0000-000000000000', 'ACTIVE')
    `);

    // 8. Seed roles
    await client.query(`
      INSERT INTO user_roles (id, membership_id, location_id, role) VALUES 
      (gen_random_uuid(), 'a1f11111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'WAITER'),
      (gen_random_uuid(), 'a2f22222-2222-2222-2222-222222222222', NULL, 'GM'),
      (gen_random_uuid(), 'b1f11111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'WAITER')
    `);

    // 9. Seed Tables (Operational Data)
    await client.query(`
      INSERT INTO tables (id, restaurant_id, location_id, table_number, capacity, status, config_status) VALUES 
      ('a1a11111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000000', 'a1111111-1111-1111-1111-111111111111', 'T1', 4, 'AVAILABLE', 'ACTIVE'),
      ('a2a22222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000000', 'a2222222-2222-2222-2222-222222222222', 'T2', 2, 'AVAILABLE', 'ACTIVE'),
      ('b1b11111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000000', 'b1111111-1111-1111-1111-111111111111', 'T3', 6, 'AVAILABLE', 'ACTIVE')
    `);

  } finally {
    await client.end();
  }
}
