const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://koihrectipbnzbdplpkx.supabase.co','sb_publishable_0dDmcyUC-I49KE0zfLljSA_Y5UF2Sfj');

async function run() {
  const students = await supabase.rpc('admin_list_students');
  console.log('students count', students.error ? students.error.message : students.data.length);
  if (!students.data || students.data.length < 1) return;
  const student = students.data[0];
  console.log('student to delete', student);
  const resDel = await supabase.from('results').delete().eq('student_id', student.id);
  console.log('results delete', resDel.error ? resDel.error.message : resDel.data);
  const stuDel = await supabase.from('students').delete().eq('id', student.id);
  console.log('student delete', stuDel.error ? stuDel.error.message : stuDel.data);
  const afterStudents = await supabase.rpc('admin_list_students');
  console.log('after students count', afterStudents.error ? afterStudents.error.message : afterStudents.data.length);
  const search = await supabase.rpc('admin_search_students', { q: String(student.roll_no), class_name: student.class || student.class_name });
  console.log('search after delete', search.error ? search.error.message : search.data);
  try {
    const portalFind = await supabase.rpc('portal_find_student', { class_name: student.class || student.class_name, roll_no: String(student.roll_no) });
    console.log('portal_find_student after delete', portalFind.error ? portalFind.error.message : portalFind.data);
  } catch (e) {
    console.log('portal_find_student exception', e.message);
  }
}
run().catch(e => { console.error('unexpected', e.message); process.exit(1); });
