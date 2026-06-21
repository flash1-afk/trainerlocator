const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpload() {
  const buffer = Buffer.from('hello world');
  const filePath = 'avatars/test-image.txt';

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
        contentType: 'text/plain',
        upsert: true
    });
    
  console.log('Upload Result:', data, error);
}

testUpload();
