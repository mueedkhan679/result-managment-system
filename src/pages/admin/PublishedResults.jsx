import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function PublishedResults(){
  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ fetchPublished() }, [])
  useEffect(()=>{
    function onUpdated(){ fetchPublished() }
    window.addEventListener('results-updated', onUpdated)
    return () => window.removeEventListener('results-updated', onUpdated)
  }, [])

  async function fetchPublished(){
    setLoading(true)
    try{
      const { data, error } = await supabase.rpc('admin_list_results',{status:'published'})
      if(error) throw error
      setResults(data || [])
    }catch(err){
      toast.error(err.message || 'Failed to load')
    }finally{ setLoading(false) }
  }

  async function del(id){
    if(!window.confirm('Delete this published result?')) return

    setLoading(true)
    try{
      const { error } = await supabase.rpc('admin_delete_result',{result_id: id})
      if(error) throw error
      setResults(prev => prev.filter(item => item.id !== id))
      window.dispatchEvent(new Event('results-updated'))
      toast.success('Deleted from the portal')
    }catch(err){
      toast.error(err.message || 'Failed')
    }finally{ setLoading(false) }
  }

  async function saveEdit(id){
    if(!editValue) return toast.error('Enter a value')
    setLoading(true)
    try{
      const { error } = await supabase.rpc('admin_update_result',{result_id: id, obtained: Number(editValue)})
      if(error) throw error
      setResults(prev => prev.map(item => item.id === id ? { ...item, obtained_marks: Number(editValue) } : item))
      toast.success('Updated')
      setEditing(null)
    }catch(err){
      toast.error(err.message || 'Failed')
    }finally{ setLoading(false) }
  }

  const filtered = results.filter(r => r.student_name.toLowerCase().includes(query.toLowerCase()) || String(r.roll_no).includes(query))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">Published Results</h2>
        <p className="text-sm text-slate-500">Review, edit, and remove published student results.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <input placeholder="Search by student name or roll" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" value={query} onChange={e=>setQuery(e.target.value)} />
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading published results…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No published results match your search.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <div className="font-medium text-slate-800">{r.student_name} • Roll {r.roll_no}</div>
                <div className="text-sm text-slate-500">{r.class} — {r.obtained_marks}/{r.total_marks}</div>
              </div>
              <div className="flex items-center gap-2">
                {editing===r.id ? (
                  <>
                    <input type="number" className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-slate-700 outline-none focus:border-blue-500" value={editValue} onChange={e=>setEditValue(e.target.value)} />
                    <button onClick={()=>saveEdit(r.id)} className="text-sm font-medium text-green-600">Save</button>
                    <button onClick={()=>setEditing(null)} className="text-sm text-slate-500">Cancel</button>
                  </>
                ) : (
                  <>
                    <a href={`/result/${r.student_id}`} className="text-sm font-medium text-blue-600">View</a>
                    <button onClick={()=>{ setEditing(r.id); setEditValue(String(r.obtained_marks)) }} className="text-sm font-medium text-amber-600">Edit</button>
                    <button onClick={()=>del(r.id)} className="text-sm font-medium text-red-600">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
