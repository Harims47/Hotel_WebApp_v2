const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:password@localhost:5432/nextstep_ecommerce' });

async function main() {
  const cols = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
  );
  console.log('Users columns:', cols.rows.map(r => r.column_name).join(', '));

  const users = await pool.query(
    'SELECT id, username, status FROM users LIMIT 5'
  );
  console.log('Users:', JSON.stringify(users.rows, null, 2));

  const rests = await pool.query('SELECT id, name FROM restaurants LIMIT 5');
  console.log('Restaurants:', JSON.stringify(rests.rows, null, 2));

  const mems = await pool.query('SELECT * FROM restaurant_memberships LIMIT 5');
  console.log('Memberships:', JSON.stringify(mems.rows, null, 2));

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
