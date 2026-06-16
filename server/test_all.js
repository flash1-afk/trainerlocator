const jwt = require('jsonwebtoken');
const supabase = require('./config/supabase');
require('dotenv').config();

async function testAll() {
  try {
    const { data: admin } = await supabase.from('users').select('*').eq('role', 'admin').limit(1).single();
    const token = jwt.sign(
      { user: { id: admin.id, role: admin.role } },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );
    const headers = { 'x-auth-token': token };

    const endpoints = [
      '/api/admin/dashboard',
      '/api/admin/users',
      '/api/admin/trainers',
      '/api/admin/sessions',
      '/api/admin/bookings'
    ];

    for (const ep of endpoints) {
      console.log(`Fetching ${ep}...`);
      const res = await fetch(`http://localhost:5000${ep}`, { headers });
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      if (res.status !== 200) {
        console.log(`Response: ${text}`);
      } else {
        console.log(`Success! Data length: ${text.length} chars`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
testAll();
