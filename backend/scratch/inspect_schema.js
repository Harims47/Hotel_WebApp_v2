const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const r = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );
  console.log('Public Tables:', r.rows.map(x => x.tablename).join(', '));
  
  // Check restaurants table columns
  const rcols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = 'restaurants'"
  );
  console.log('restaurants columns:', rcols.rows.map(x => x.column_name).join(', '));

  // Check our 'tables' table (restaurant tables)
  const tcols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = 'tables'"
  );
  console.log('tables columns:', tcols.rows.map(x => x.column_name).join(', ') || '(not found)');

  const ucols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = 'users'"
  );
  console.log('users columns:', ucols.rows.map(x => x.column_name).join(', '));

  const policies = await pool.query(
    "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'"
  );
  console.log('Policies:', JSON.stringify(policies.rows));
  
  await pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
