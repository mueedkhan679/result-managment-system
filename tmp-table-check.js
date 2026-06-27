const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://koihrectipbnzbdplpkx.supabase.co','sb_publishable_0dDmcyUC-I49KE0zfLljSA_Y5UF2Sfj');
async function run() {
  const students = await supabase.from('students').select('id, student_name, father_name, class, roll_no').limit(10);
  console.log('students rows', students.error ? students.error.message : students.data);
  const results = await supabase.from('results').select('id, student_id, status, subject_id, total_marks, obtained_marks').limit(10);
  console.log('results rows', results.error ? results.error.message : results.data);
}
run().catch(e=>{ console.error('unexpected', e.message); process.exit(1); });
