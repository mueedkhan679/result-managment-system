const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://koihrectipbnzbdplpkx.supabase.co','sb_publishable_0dDmcyUC-I49KE0zfLljSA_Y5UF2Sfj');

async function run() {
  const students = await supabase.rpc('admin_list_students');
  console.log('students count', students.error ? students.error.message : students.data.length);
  const id = students.data && students.data[0] && students.data[0].id;
  if (!id) return;
  console.log('testing student id', id);
  const testRpc = await supabase.rpc('admin_delete_student', { p_student_id: id });
  console.log('admin_delete_student', testRpc.error ? testRpc.error.message : testRpc.data);
  const directDel = await supabase.from('students').delete().eq('id', id);
  console.log('direct delete student', directDel.error ? directDel.error.message : directDel.data);
  const directResDel = await supabase.from('results').delete().eq('student_id', id);
  console.log('direct delete results', directResDel.error ? directResDel.error.message : directResDel.data);
}
run().catch(e=>{ console.error('unexpected', e.message); process.exit(1); });
