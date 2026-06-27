import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { generateMarksheetPDF } from '../../utils/pdfGenerator'
import toast from 'react-hot-toast'

const CLASSES = [
  'Playgroup','Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'
]

export default function AdminGenerate(){
  const [classSelected, setClassSelected] = useState(CLASSES[3])
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState([])

  useEffect(()=>{ load() }, [classSelected])

  async function load(){
    const { data } = await supabase.rpc('admin_list_students_by_class', { class_name: classSelected })
    setStudents(data || [])
    setSelected([])
  }

  function toggle(id){
    setSelected(prev=> prev.includes(id)? prev.filter(x=>x!==id) : [...prev, id])
  }

  async function generate(){
    if(selected.length===0) return toast.error('Select students')
    const docs = []
    for(const sid of selected){
      const { data, error } = await supabase.rpc('portal_get_results', { student_id: sid })
      if(error) return toast.error(error.message)
      if(!data || !data.student) continue
      const student = data.student
      const results = data.results
      const doc = generateMarksheetPDF(import.meta.env.VITE_SCHOOL_NAME || 'School Name', student, results)
      docs.push(doc)
    }
    if(docs.length===0) return toast.error('No marks found for selected students')
    docs[0].save(`Marksheets-${classSelected}.pdf`)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Generate PDF</h2>
      <div className="p-4 card-glass rounded max-w-2xl">
        <label className="block text-sm text-slate-300">Class</label>
        <select className="w-full p-2 rounded bg-transparent border border-slate-700" value={classSelected} onChange={e=>setClassSelected(e.target.value)}>
          {CLASSES.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="mt-4">
          <div className="max-h-64 overflow-auto">
            {students.map(s=> (
              <label key={s.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/40">
                <input type="checkbox" checked={selected.includes(s.id)} onChange={()=>toggle(s.id)} />
                <div>
                  <div className="font-medium">{s.student_name}</div>
                  <div className="text-sm text-slate-400">Roll {s.roll_no}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={()=>setSelected(students.map(s=>s.id))} className="mr-2">Select All</Button>
          <Button onClick={generate}>Generate PDF</Button>
        </div>
      </div>
    </div>
  )
}
