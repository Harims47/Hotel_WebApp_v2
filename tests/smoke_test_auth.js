/**
 * Quick end-to-end smoke test for Phase 2 auth integration.
 * Tests: login, cookie present, /me, logout, /me after logout.
 */
const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('=== Phase 2 Auth Smoke Tests ===\n');

  // 1. Login
  const loginRes = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'superadmin', password: 'superadmin123' }));

  console.log(`[1] POST /auth/login → ${loginRes.status} | Body: ${JSON.stringify(loginRes.body)}`);
  console.assert(loginRes.status === 200, `Expected 200 got ${loginRes.status}`);
  console.assert(loginRes.body.success === true, 'Expected success:true');
  console.assert(!loginRes.body.data?.session_id, 'session_id must NOT be in JSON');
  console.assert(!loginRes.body.data?.session_token, 'session_token must NOT be in JSON');

  const setCookie = loginRes.headers['set-cookie'] || [];
  const sessionCookie = setCookie.find(c => c.startsWith('session_id='));
  console.assert(sessionCookie, 'session_id cookie must be set');
  console.assert(sessionCookie?.includes('HttpOnly'), 'Cookie must be HttpOnly');
  console.log(`    Cookie: ${sessionCookie?.split(';')[0].substring(0, 30)}...`);
  console.log(`    HttpOnly: ${sessionCookie?.includes('HttpOnly')}`);
  console.log(`    session_id in JSON body: ${!!loginRes.body.data?.session_id} (must be false)`);
  console.log('    ✓ Login OK\n');

  // Extract cookie value for subsequent requests
  const cookieHeader = sessionCookie?.split(';')[0];

  // 2. GET /me
  const meRes = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/me', method: 'GET',
    headers: { 'Cookie': cookieHeader }
  });

  console.log(`[2] GET /auth/me → ${meRes.status}`);
  console.assert(meRes.status === 200, `Expected 200 got ${meRes.status}: ${JSON.stringify(meRes.body)}`);
  console.assert(meRes.body.data?.user?.username === 'superadmin', 'Expected username superadmin');
  console.assert(meRes.body.data?.memberships?.length > 0, 'Expected memberships');
  console.assert(meRes.body.data?.memberships?.[0]?.roles?.includes('SUPER_ADMIN'), 'Expected SUPER_ADMIN role');
  console.log(`    User: ${meRes.body.data?.user?.username}, Role: ${meRes.body.data?.memberships?.[0]?.roles}`);
  console.log('    ✓ /me OK\n');

  // 3. Invalid login
  const badRes = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'superadmin', password: 'wrongpassword' }));

  console.log(`[3] POST /auth/login (invalid) → ${badRes.status}`);
  console.assert(badRes.status === 400, `Expected 400 got ${badRes.status}`);
  console.assert(badRes.body.success === false, 'Expected success:false');
  console.log('    ✓ Invalid login rejected\n');

  // 4. /me without cookie → 401
  const unauthRes = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/me', method: 'GET',
    headers: {}
  });
  console.log(`[4] GET /auth/me (no cookie) → ${unauthRes.status}`);
  console.assert(unauthRes.status === 401, `Expected 401 got ${unauthRes.status}`);
  console.log('    ✓ Unauthenticated /me rejected\n');

  // 5. Waiter login and role check
  const waiterRes = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'waiter1', password: 'password123' }));
  const waiterCookie = (waiterRes.headers['set-cookie'] || []).find(c => c.startsWith('session_id='))?.split(';')[0];

  const waiterMe = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/me', method: 'GET',
    headers: { 'Cookie': waiterCookie }
  });
  console.log(`[5] Waiter /auth/me → ${waiterMe.status}`);
  console.assert(waiterMe.body.data?.memberships?.[0]?.roles?.includes('WAITER'), 'Expected WAITER role');
  console.assert(waiterMe.body.data?.active_context?.location_id, 'Waiter must have location bound');
  console.log(`    Role: ${waiterMe.body.data?.memberships?.[0]?.roles}, Location: ${waiterMe.body.data?.active_context?.location_id}`);
  console.log('    ✓ Waiter context OK\n');

  // 6. GM login — restaurant-wide access
  const gmRes = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'gm1', password: 'password123' }));
  const gmCookie = (gmRes.headers['set-cookie'] || []).find(c => c.startsWith('session_id='))?.split(';')[0];

  const gmMe = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/me', method: 'GET',
    headers: { 'Cookie': gmCookie }
  });
  console.log(`[6] GM /auth/me → ${gmMe.status}`);
  console.assert(gmMe.body.data?.memberships?.[0]?.roles?.includes('GM'), 'Expected GM role');
  console.log(`    Role: ${gmMe.body.data?.memberships?.[0]?.roles}, Location: ${gmMe.body.data?.active_context?.location_id} (null=restaurant-wide)`);
  console.log('    ✓ GM context OK\n');

  // 7. Logout
  const logoutRes = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/logout', method: 'POST',
    headers: { 'Cookie': cookieHeader }
  });
  console.log(`[7] POST /auth/logout → ${logoutRes.status}`);
  console.assert(logoutRes.status === 204, `Expected 204 got ${logoutRes.status}`);
  console.log('    ✓ Logout OK\n');

  // 8. /me after logout → 401
  const afterLogout = await request({
    hostname: 'localhost', port: 8000, path: '/api/v1/auth/me', method: 'GET',
    headers: { 'Cookie': cookieHeader }
  });
  console.log(`[8] GET /auth/me after logout → ${afterLogout.status}`);
  console.assert(afterLogout.status === 401, `Expected 401 got ${afterLogout.status}`);
  console.log('    ✓ Session invalidated after logout\n');

  console.log('=== All Phase 2 Auth Smoke Tests PASSED ===');
}

run().catch(e => { console.error('FAILED:', e.message || e); process.exit(1); });
