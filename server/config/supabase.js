const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use SERVICE_ROLE_KEY if available to bypass RLS, otherwise fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !process.env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase URL or Key missing in .env. Please add SUPABASE_URL and SUPABASE_ANON_KEY.');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Using ANON key for backend. You may encounter RLS errors. Consider adding SUPABASE_SERVICE_ROLE_KEY to .env');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

module.exports = supabase;
