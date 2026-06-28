import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { GraduationCap, Search, BookOpen, Users, Award } from 'lucide-react'

const CLASSES = ['Playgroup','Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12']

export default function PortalHome(){
  const [roll, setRoll] = useState('')
  const [classSelected, setClassSelected] = useState(CLASSES[3])
  const [searching, setSearching] = useState(false)
  const nav = useNavigate()

  async function search(){
    const normalizedRoll = String(roll).trim()
    if (!normalizedRoll) {
      alert('Please enter a roll number')
      return
    }
    setSearching(true)
    try {
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
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 grid-pattern" />
      {[...Array(15)].map((_, i) => (
        <div key={i} className="particle" style={{ width: Math.random() * 8 + 3 + 'px', height: Math.random() * 8 + 3 + 'px', left: Math.random() * 100 + '%', animationDelay: Math.random() * 15 + 's', animationDuration: Math.random() * 10 + 10 + 's' }} />
      ))}

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg mb-5 animate-bounce-in">
            <GraduationCap size={40} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            Student <span className="gradient-text">Result Portal</span>
          </h1>
          <p className="text-slate-500 mt-2">Search and view your academic results</p>
        </div>

        <div className="card-glass rounded-3xl p-8 shadow-xl animate-fade-in-up delay-200">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Roll Number</label>
              <input type="text" value={roll} onChange={e=>setRoll(e.target.value)} placeholder="e.g. 101" className="input-beautiful w-full px-4 py-3 rounded-xl text-slate-700 placeholder-slate-400" onKeyDown={e => e.key === 'Enter' && search()} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Class</label>
              <select className="input-beautiful w-full px-4 py-3 rounded-xl text-slate-700" value={classSelected} onChange={e=>setClassSelected(e.target.value)}>
                {CLASSES.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={search} disabled={searching} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg shimmer-btn">
                <Search size={18} />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
            <div className="animate-fade-in-up delay-300">
              <BookOpen size={20} className="text-primary mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">Multiple Classes</p>
            </div>
            <div className="animate-fade-in-up delay-400">
              <Users size={20} className="text-primary mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">Student Search</p>
            </div>
            <div className="animate-fade-in-up delay-500">
              <Award size={20} className="text-primary mx-auto mb-1.5" />
              <p className="text-xs text-slate-500">Instant Results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
