import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'

const CLASSES = [
  'Playgroup','Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'
]

export default function AdminSubjects(){
  const [classSelected, setClassSelected] = useState(CLASSES[0])
  const [subjects, setSubjects] = useState([])
  const [newSubjects, setNewSubjects] = useState([{name:'', total:100}])

  useEffect(()=>{ fetchSubjects() }, [classSelected])

  async function fetchSubjects(){
    const { data } = await supabase.rpc('admin_list_subjects',{class_name: classSelected})
    setSubjects(data || [])
  }

  function updateNew(i, field, value){
    const copy = [...newSubjects]
    copy[i][field]=value
    setNewSubjects(copy)
  }

  function addRow(){ setNewSubjects(prev=>[...prev, {name:'', total:100}]) }
  function removeRow(i){ setNewSubjects(prev=> prev.filter((_,idx)=>idx!==i)) }

  async function save(){
    // validate
    const names = newSubjects.map(s=>s.name.trim())
    if(names.some(n=>!n)) return toast.error('Subject names required')
    const { error } = await supabase.rpc('admin_add_subjects',{class_name: classSelected, subjects: newSubjects})
    if(error) return toast.error(error.message)
    toast.success('Subjects added')
    setNewSubjects([{name:'', total:100}])
    fetchSubjects()
  }

  async function del(id){
    const { error } = await supabase.rpc('admin_delete_subject', {subject_id: id})
    if(error) return toast.error(error.message)
    toast.success('Deleted')
    fetchSubjects()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Subjects</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 card-glass rounded">
          <label className="block text-sm text-slate-300">Class</label>
          <select className="w-full p-2 rounded bg-transparent border border-slate-700" value={classSelected} onChange={e=>setClassSelected(e.target.value)}>
            {CLASSES.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="mt-4 space-y-2">
            {newSubjects.map((s, i)=> (
              <div key={i} className="flex gap-2">
                <input placeholder="Subject name" className="flex-1 p-2 rounded bg-transparent border border-slate-700" value={s.name} onChange={e=>updateNew(i,'name', e.target.value)} />
                <input type="number" className="w-24 p-2 rounded bg-transparent border border-slate-700" value={s.total} onChange={e=>updateNew(i,'total', Number(e.target.value))} />
                <button type="button" onClick={()=>removeRow(i)} className="text-sm text-red-400">Delete</button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Button type="button" onClick={addRow}>Add Subject</Button>
              <Button type="button" onClick={save}>Save</Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-4 card-glass rounded">
          <h3 className="mb-4 font-medium">Existing Subjects for {classSelected}</h3>
          <div className="space-y-2">
            {subjects.map(s=> (
              <div key={s.id} className="p-3 rounded bg-slate-800/40 flex justify-between items-center">
                <div>
                  <div className="font-medium">{s.subject_name}</div>
                  <div className="text-sm text-slate-400">Total Marks: {s.total_marks}</div>
                </div>
                <button onClick={()=>del(s.id)} className="text-red-400">Delete</button>
              </div>
            ))}
            {subjects.length===0 && <div className="text-sm text-slate-400">No subjects yet for this class.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
