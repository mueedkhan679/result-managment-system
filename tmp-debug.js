const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://koihrectipbnzbdplpkx.supabase.co','sb_publishable_0dDmcyUC-I49KE0zfLljSA_Y5UF2Sfj');
async function run() {
  console.log('--- students table ---');
  const students = await supabase.from('students').select('*').limit(20);
  console.log('students error:', students.error ? students.error.message : null);
  console.log('students data:', students.data);

  console.log('--- results table ---');
  const results = await supabase.from('results').select('*').limit(20);
  console.log('results error:', results.error ? results.error.message : null);
  console.log('results data:', results.data);

  const rpcs = [
    { name: 'admin_list_students', args: {} },
    { name: 'admin_list_students_by_class', args: { class_name: 'Class 1' } },
    { name: 'admin_dashboard_stats', args: {} },
    { name: 'admin_search_students', args: { q: '1', class_name: 'Class 1' } }
  ];

  for (const rpc of rpcs) {
    try {
      const res = await supabase.rpc(rpc.name, rpc.args);
      console.log(`--- rpc ${rpc.name} ---`);
      console.log('error:', res.error ? res.error.message : null);
      console.log('data:', res.data);
    } catch (err) {
      console.log(`rpc ${rpc.name} threw`, err.message);
    }
  }
}
run().catch(err => { console.error('unexpected', err); process.exit(1); });
