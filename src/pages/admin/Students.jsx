import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'
import ImportCSV from '../../components/ImportCSV/ImportCSV'

const CLASSES = [
  'Playgroup','Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'
]

export default function AdminStudents(){
  const [students, setStudents] = useState([])
  const [name, setName] = useState('')
  const [father, setFather] = useState('')
  const [cls, setCls] = useState(CLASSES[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [importing, setImporting] = useState(false)

  useEffect(()=>{ fetchStudents() }, [])

  async function fetchStudents(){
    setLoading(true)
    try{
      const { data, error } = await supabase.rpc('admin_list_students')
      if(error) throw error
      setStudents((data || []).slice().sort((a,b)=> Number(a.roll_no) - Number(b.roll_no)))
    }catch(err){
      toast.error(err.message || 'Failed to load students')
    }finally{ setLoading(false) }
  }

  async function addStudent(e){
    e.preventDefault()
    if(!name || !father) return toast.error('Student name and father name are required')
    setSaving(true)
    try{
      const { error } = await supabase.rpc('admin_add_student', { student_name: name, father_name: father, class_name: cls })
      if(error) throw error
      toast.success('Student added')
      setName('')
      setFather('')
      await fetchStudents()
    }catch(err){
      toast.error(err.message || 'Failed to add student')
    }finally{ setSaving(false) }
  }

  async function deleteStudent(studentId){
    if(!window.confirm('Delete this student and their results?')) return
    setDeletingId(studentId)
    setLoading(true)
    try{
      const { error } = await supabase.rpc('admin_delete_student', { p_student_id: studentId })
      if(error) throw error

      toast.success('Student removed')
      await fetchStudents()
    }catch(err){
      console.error('deleteStudent error', err)
      toast.error(err.message || 'Failed to delete student')
    }finally{
      setDeletingId(null)
      setLoading(false)
    }
  }

  async function importCSV(rows){
    if(!rows || rows.length===0) return
    setImporting(true)
    try{
      const payload = JSON.stringify(rows)
      const { error } = await supabase.rpc('admin_add_students_bulk', { payload })
      if(error) throw error
      toast.success('Imported students')
      await fetchStudents()
    }catch(err){
      toast.error(err.message || 'Import failed')
    }finally{ setImporting(false) }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-slate-600">Admin portal is live — delete works instantly</span>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Students</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Add, import, and manage your student roster with responsive controls, instant feedback, and mobile-friendly layouts.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <form onSubmit={addStudent} className="animate-fade-in-up rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Add Student</h3>
              <p className="mt-1 text-sm text-slate-500">Create one student record at a time.</p>
            </div>
            <label className="block text-sm text-slate-600">Student Name</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" value={name} onChange={e=>setName(e.target.value)} />
            <label className="block text-sm text-slate-600">Father's Name</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" value={father} onChange={e=>setFather(e.target.value)} />
            <label className="block text-sm text-slate-600">Class</label>
            <select className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" value={cls} onChange={e=>setCls(e.target.value)}>
              {CLASSES.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="mt-4">
              <Button type="submit" loading={saving}>Add Student</Button>
            </div>
          </div>
        </form>

        <div className="animate-fade-in-up rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Import Students</h3>
            <p className="mt-1 text-sm text-slate-500">Upload CSV data with student_name, father_name, and class fields.</p>
          </div>
          <div className="mt-6">
            <ImportCSV mapping={{ student_name: 'student_name', father_name: 'father_name', class: 'class' }} onImport={importCSV} />
          </div>
        </div>

        <div className="animate-fade-in-up xl:col-span-2 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:bg-slate-100 hover:shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Existing Students</h3>
              <p className="text-sm text-slate-500">Delete or review students from your current roster.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Live roster sync
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading && <div className="text-sm text-slate-500">Loading students...</div>}
            {students.map(s=> (
              <div key={s.id} className="group flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">{s.student_name}</div>
                  <div className="mt-1 text-sm text-slate-500">{s.class} • Roll {s.roll_no}</div>
                </div>
                <button
                  type="button"
                  disabled={deletingId === s.id}
                  onClick={() => deleteStudent(s.id)}
                  className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition duration-200 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === s.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            ))}
            {!loading && students.length===0 && <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No students yet. Add a student or import a CSV to begin.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
