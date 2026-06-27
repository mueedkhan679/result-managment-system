import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function PendingResults(){
  const [results, setResults] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(()=>{ fetchPending() }, [])
  useEffect(()=>{
    function onUpdated(){ fetchPending() }
    window.addEventListener('results-updated', onUpdated)
    return () => window.removeEventListener('results-updated', onUpdated)
  }, [])

  async function fetchPending(){
    setLoading(true)
    try{
      const { data, error } = await supabase.rpc('admin_list_results', { status: 'pending' })
      if(error) throw error
      setResults(data || [])
    }catch(err){
      toast.error(err.message || 'Failed to load pending results')
    }finally{ setLoading(false) }
  }

  const groupedResults = useMemo(()=>{
    const grouped = {}

    results.forEach(result => {
      const className = result.class || 'Unassigned'
      const studentKey = result.student_id ? result.student_id : `${result.student_name}-${result.roll_no || ''}`

      if(!grouped[className]) grouped[className] = {}
      if(!grouped[className][studentKey]) {
        grouped[className][studentKey] = {
          student_id: result.student_id,
          student_name: result.student_name || 'Unknown Student',
          roll_no: result.roll_no || '—',
          class: className,
          items: []
        }
      }

      grouped[className][studentKey].items.push(result)
    })

    return Object.entries(grouped)
      .map(([className, students]) => ({
        className,
        students: Object.values(students).sort((a,b) => Number(a.roll_no||0) - Number(b.roll_no||0))
      }))
      .sort((a,b) => a.className.localeCompare(b.className))
  }, [results])

  function toggleStudent(studentKey){
    setSelectedStudents(prev => prev.includes(studentKey) ? prev.filter(item => item !== studentKey) : [...prev, studentKey])
  }

  async function publishResults(ids){
    const { error } = await supabase.rpc('admin_approve_results_bulk', { ids })
    if (error) throw error
  }

  async function deletePendingResults(ids){
    if(!ids || ids.length===0) return
    if(!window.confirm('Delete selected pending result(s)?')) return
    setProcessing(true)
    try{
      const { error } = await supabase.rpc('admin_delete_results_bulk', { ids })
      if(error) throw error
      window.dispatchEvent(new Event('results-updated'))
      toast.success('Pending result(s) deleted')
      await fetchPending()
    }catch(err){
      toast.error(err.message || 'Failed to delete')
    }finally{ setProcessing(false) }
  }

  async function submitSelected(){
    if(selectedStudents.length === 0) return toast.error('Select at least one student')

    const ids = groupedResults.flatMap(group =>
      group.students
        .filter(student => selectedStudents.includes(student.student_id || `${student.student_name}-${student.roll_no || ''}`))
        .flatMap(student => student.items.map(item => item.id))
    )

    if(ids.length === 0) return toast.error('No pending results selected')

    setProcessing(true)
    try{
      await publishResults(ids)
      window.dispatchEvent(new Event('results-updated'))
      toast.success('Results uploaded to student portal')
      setSelectedStudents([])
      await fetchPending()
    }catch(err){
      toast.error(err.message || 'Failed to publish')
    }finally{ setProcessing(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Pending Results</h2>
          <p className="text-sm text-slate-500">Group results by class, pick the students you want to publish, and submit.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={submitSelected} loading={processing}>Submit Selected</Button>
          <Button onClick={fetchPending} className="bg-slate-100 text-slate-700 hover:bg-slate-200">Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading pending results…</div>
      ) : groupedResults.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No pending results found.</div>
      ) : (
        <div className="space-y-4">
          {groupedResults.map(group => (
            <div key={group.className} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{group.className}</h3>
                  <p className="text-sm text-slate-500">{group.students.length} student(s) with pending results</p>
                </div>
              </div>
              <div className="space-y-2">
                {group.students.map(student => {
                  const studentKey = student.student_id || `${student.student_name}-${student.roll_no || ''}`
                  const selected = selectedStudents.includes(studentKey)
                  const totalMarks = student.items.reduce((sum, item) => sum + Number(item.total_marks || 0), 0)
                  const obtainedMarks = student.items.reduce((sum, item) => sum + Number(item.obtained_marks || 0), 0)

                  return (
                    <label key={studentKey} className={`flex items-center justify-between rounded-xl border p-3 ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selected} onChange={() => toggleStudent(studentKey)} />
                        <div>
                          <div className="font-medium text-slate-800">{student.student_name} • Roll {student.roll_no || '—'}</div>
                          <div className="text-sm text-slate-500">{student.items.length} pending result(s)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-slate-500">{obtainedMarks}/{totalMarks} marks</div>
                        <button onClick={async (e)=>{ e.preventDefault(); const ids = student.items.map(i=>i.id); await deletePendingResults(ids) }} className="text-sm text-red-600">Delete</button>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
