import { supabase } from '../lib/supabase'

export async function fetchDashboard(){
  const { data } = await supabase.rpc('admin_dashboard_stats')
  return data
}

export async function approveResultsBulk(ids){
  return await supabase.rpc('admin_approve_results_bulk', { ids })
}

export async function deleteResultsBulk(ids){
  return await supabase.rpc('admin_delete_results_bulk', { ids })
}

export async function searchStudents(q, className=''){
  const { data } = await supabase.rpc('admin_search_students', { q: q||'', class_name: className||'' })
  return data
}

export async function updateResult(resultId, obtained){
  return await supabase.rpc('admin_update_result', { result_id: resultId, obtained })
}

export async function createPasswordReset(identifier){
  return await supabase.rpc('admin_create_password_reset', { identifier })
}

export async function resetPassword(token, new_password){
  return await supabase.rpc('admin_reset_password', { token, new_password })
}

export async function importStudentsCSV(payload){
  return await supabase.rpc('admin_add_students_bulk', { payload })
}

export async function importResultsCSV(payload){
  return await supabase.rpc('admin_add_results_csv', { payload })
}
