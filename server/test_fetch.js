const jwt = require('jsonwebtoken');
const supabase = require('./config/supabase');
require('dotenv').config();

async function testDashboard() {
  try {
    // 1. Get an admin user
    const { data: admin } = await supabase.from('users').select('*').eq('role', 'admin').limit(1).single();
    if (!admin) {
      console.log('No admin found, creating one...');
      return;
    }
    
    // 2. Generate token
    const token = jwt.sign(
      { user: { id: admin.id, role: admin.role } },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );
    console.log('Admin token:', token);
    
    // 3. Make fetch request to localhost:5000
    const res = await fetch('http://localhost:5000/api/admin/dashboard', {
      headers: { 'x-auth-token': token }
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }
}
testDashboard();
