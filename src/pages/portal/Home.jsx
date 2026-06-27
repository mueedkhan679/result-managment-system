import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const CLASSES = [
  'Playgroup','Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'
]

export default function PortalHome(){
  const [roll, setRoll] = useState('')
  const [classSelected, setClassSelected] = useState(CLASSES[3])
  const nav = useNavigate()

  async function search(){
    const normalizedRoll = String(roll).trim()
    if (!normalizedRoll) {
      alert('Please enter a roll number')
      return
    }

    let student = null
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_name, father_name, class, roll_no')
        .eq('class', classSelected)
        .eq('roll_no', Number(normalizedRoll))
        .maybeSingle()
      if (error) throw error
      student = data
    } catch (err) {
      console.warn('portal_find_student missing or failed:', err.message)
    }

    if (!student) {
      const { data, error } = await supabase.rpc('admin_search_students', { q: normalizedRoll, class_name: classSelected })
      if (error) {
        console.error(error)
        alert('Unable to search results right now')
        return
      }
      student = Array.isArray(data) ? data[0] : data
    }

    if (student?.id) nav(`/result/${student.id}`)
    else alert('No result found for this roll number')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl p-8 rounded-xl card-glass">
        <h2 className="text-2xl font-semibold mb-4">Student Result Portal</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input placeholder="Roll Number" value={roll} onChange={e=>setRoll(e.target.value)} className="p-3 rounded bg-transparent border border-slate-700" />
          <select className="p-3 rounded bg-transparent border border-slate-700" value={classSelected} onChange={e=>setClassSelected(e.target.value)}>
            {CLASSES.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={search} className="px-4 py-3 rounded bg-primary text-white">Search</button>
        </div>
      </div>
    </div>
  )
}
