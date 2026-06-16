const supabase = require('./config/supabase');

async function test() {
  try {
    const { count: totalUsers, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log('Total users:', totalUsers, 'Error:', error);
    
    const { data, error: tError } = await supabase
      .from('trainers')
      .select(`
        *,
        userId:users!inner(name, email)
      `)
      .limit(2);
    console.log('Trainers data:', data, 'Error:', tError);
  } catch (err) {
    console.error('Catch error:', err);
  }
}
test();
