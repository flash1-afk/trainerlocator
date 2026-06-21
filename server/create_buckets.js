const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createBuckets() {
  console.log('Creating avatars bucket...');
  const res1 = await supabase.storage.createBucket('avatars', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
    fileSizeLimit: 5242880
  });
  console.log(res1);

  console.log('Creating certificates bucket...');
  const res2 = await supabase.storage.createBucket('certificates', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'],
    fileSizeLimit: 5242880
  });
  console.log(res2);

  // also try to update if already exists
  await supabase.storage.updateBucket('avatars', { public: true });
  await supabase.storage.updateBucket('certificates', { public: true });
}

createBuckets();
