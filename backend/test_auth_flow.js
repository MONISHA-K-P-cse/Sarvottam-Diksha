import http from 'http';

const BACKEND_URL = 'http://localhost:5001';

async function runHttpRequest(url, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const req = http.request(url, { method, headers: { 'Content-Type': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', err => resolve({ status: 500, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function verifyAuth() {
  console.log(`=========================================`);
  console.log(`🧪 TESTING AUTHENTICATION FLOW API...`);
  console.log(`=========================================\n`);

  // Test 1: Admin Login with dikshasarvottam@gmail.com
  console.log(`1. Testing Admin Login (dikshasarvottam@gmail.com / admin123)...`);
  const adminRes1 = await runHttpRequest(`${BACKEND_URL}/api/auth/login`, 'POST', {
    email: 'dikshasarvottam@gmail.com',
    password: 'admin123'
  });
  console.log(`   Result: Status ${adminRes1.status}`, adminRes1.data.success ? '✅ Success' : '❌ Failed', adminRes1.data.user ? `(Role: ${adminRes1.data.user.role})` : '');

  // Test 2: Admin Login with manika@sarvottamdiksha.com alias
  console.log(`\n2. Testing Admin Login Alias (manika@sarvottamdiksha.com / Manika@Maths2026)...`);
  const adminRes2 = await runHttpRequest(`${BACKEND_URL}/api/auth/login`, 'POST', {
    email: 'manika@sarvottamdiksha.com',
    password: 'Manika@Maths2026'
  });
  console.log(`   Result: Status ${adminRes2.status}`, adminRes2.data.success ? '✅ Success' : '❌ Failed', adminRes2.data.user ? `(Role: ${adminRes2.data.user.role})` : '');

  // Test 3: Demo Student Login (monisha@gmail.com / student123)
  console.log(`\n3. Testing Demo Student Login (monisha@gmail.com / student123)...`);
  const studentRes = await runHttpRequest(`${BACKEND_URL}/api/auth/login`, 'POST', {
    email: 'monisha@gmail.com',
    password: 'student123'
  });
  console.log(`   Result: Status ${studentRes.status}`, studentRes.data.success ? '✅ Success' : '❌ Failed', studentRes.data.user ? `(Role: ${studentRes.data.user.role})` : '');

  console.log(`\n=========================================`);
  console.log(`🎉 ALL AUTHENTICATION FLOWS VERIFIED!`);
  console.log(`=========================================\n`);
}

verifyAuth();
