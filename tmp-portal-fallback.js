const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://koihrectipbnzbdplpkx.supabase.co','sb_publishable_0dDmcyUC-I49KE0zfLljSA_Y5UF2Sfj');
async function run() {
  const studentId = '8673805f-61a5-475d-bffe-7a0cf35d033a';
  const { data: studentData, error: studentError } = await supabase.from('students').select('id, student_name, father_name, class, roll_no').eq('id', studentId).maybeSingle();
  console.log('studentError', studentError && studentError.message);
  console.log('studentData', studentData);
  const published = await supabase.rpc('admin_list_results', { status: 'published' });
  console.log('published error', published.error && published.error.message);
  console.log('published rows count', published.data && published.data.filter(r => r.student_id === studentId).length);
  console.log('published rows sample', published.data && published.data.filter(r => r.student_id === studentId));
}
run().catch(err => { console.error('unexpected', err); process.exit(1); });
