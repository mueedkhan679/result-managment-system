const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://koihrectipbnzbdplpkx.supabase.co','sb_publishable_0dDmcyUC-I49KE0zfLljSA_Y5UF2Sfj');
async function run() {
  const { data: students, error: studentsError } = await supabase.rpc('admin_list_students');
  if (studentsError) return console.error('list error', studentsError.message);
  console.log('before count', students.length);
  const student = students[0];
  if (!student) return console.log('no student');
  console.log('deleting id', student.id, student.student_name);
  const delRes = await supabase.from('results').delete().eq('student_id', student.id);
  console.log('delete results', delRes.error ? delRes.error.message : delRes.data);
  const delStu = await supabase.from('students').delete().eq('id', student.id).select();
  console.log('delete student', delStu.error ? delStu.error.message : delStu.data);
  const { data: after, error: afterErr } = await supabase.rpc('admin_list_students');
  if (afterErr) return console.error('after list error', afterErr.message);
  console.log('after count', after.length);
  console.log('still present', after.some(s => s.id === student.id));
}
run().catch(err => { console.error(err); process.exit(1); });
