import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui/Button'
import ImportCSV from '../../components/ImportCSV/ImportCSV'

const CLASSES = [
  'Playgroup','Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'
]

export default function AdminResults(){
  const [classSelected, setClassSelected] = useState(CLASSES[3])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(()=>{ load() }, [classSelected])
  useEffect(()=>{
    function onUpdated(){ load() }
    window.addEventListener('results-updated', onUpdated)
    return () => window.removeEventListener('results-updated', onUpdated)
  }, [classSelected])

  async function load(){
    setLoading(true)
    try{
        const [{ data: sdata, error: e1 }, { data: subj, error: e2 }] = await Promise.all([
          supabase.rpc('admin_list_students_by_class', { class_name: classSelected }),
          supabase.rpc('admin_list_subjects', { class_name: classSelected })
        ])
        if(e1) throw e1
        if(e2) throw e2
        setStudents(sdata || [])
        setSubjects(subj || [])
      setSelectedStudents([])
      setMarks({})
    }catch(err){
      toast.error(err.message || 'Failed to load')
    }finally{ setLoading(false) }
  }

  function toggleStudent(id){
    setSelectedStudents(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function setMark(studentId, subjectId, value){
    setMarks(prev=> ({...prev, [studentId+'_'+subjectId]: value}))
  }

  async function submit(){
    if(selectedStudents.length===0) return toast.error('Select at least one student')
    setSaving(true)
    try{
      // validate
      for(const sid of selectedStudents){
        for(const subj of subjects){
          const key = sid+'_'+subj.id
          if(marks[key]===undefined || marks[key]===''){
            throw new Error('All marks required')
          }
          if(Number(marks[key])>Number(subj.total_marks)) throw new Error('Obtained marks cannot exceed total')
        }
      }

      // prepare payload
      const payload = []
      for(const sid of selectedStudents){
        for(const subj of subjects){
          payload.push({
            student_id: sid,
            class_name: classSelected,
            subject_id: subj.id,
            total_marks: subj.total_marks,
            obtained_marks: Number(marks[sid+'_'+subj.id])
          })
        }
      }

      const { error } = await supabase.rpc('admin_add_results_batch', { results: payload })
      if(error) throw error
      window.dispatchEvent(new Event('results-updated'))
      toast.success('Results saved as Pending')
      await load()
    }catch(err){
      toast.error(err.message || 'Failed to save')
    }finally{ setSaving(false) }
  }

  // CSV import for results
  async function importResultsCSV(rows){
    // rows expected to contain roll_no, class, subject_name, obtained_marks
    if(!rows || rows.length===0) return
    setImporting(true)
    try{
      const payload = JSON.stringify(rows)
      const { error } = await supabase.rpc('admin_add_results_csv', { payload: payload })
      if(error) throw error
      toast.success('Results imported as Pending')
      load()
    }catch(err){
      toast.error(err.message || 'Import failed')
    }finally{ setImporting(false) }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Add Result</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 card-glass rounded">
          <label className="block text-sm text-slate-300">Class</label>
          <select className="w-full p-2 rounded bg-transparent border border-slate-700" value={classSelected} onChange={e=>setClassSelected(e.target.value)}>
            {CLASSES.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="mt-4 text-sm text-slate-300">Students</div>
          <div className="max-h-64 overflow-auto mt-2 space-y-2">
            {students.map(s=> (
              <label key={s.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/40">
                <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={()=>toggleStudent(s.id)} />
                <div>
                  <div className="font-medium">{s.student_name}</div>
                  <div className="text-sm text-slate-400">Roll {s.roll_no}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={()=>setSelectedStudents(students.map(s=>s.id))}>Select All</Button>
          </div>
        </div>

        <div className="p-4 card-glass rounded">
          <h3 className="mb-2">Import Results CSV</h3>
          <div className="text-sm text-slate-400 mb-2">CSV headers: roll_no, class, subject_name, obtained_marks</div>
          <ImportCSV mapping={{ roll_no: 'roll_no', class: 'class', subject_name: 'subject_name', obtained_marks: 'obtained_marks' }} onImport={importResultsCSV} />
        </div>

        <div className="md:col-span-2 p-4 card-glass rounded">
          <h3 className="mb-4 font-medium">Enter Marks for selected students</h3>
          <div className="overflow-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="p-2">Student</th>
                  {subjects.map(sub=> <th key={sub.id} className="p-2">{sub.subject_name}<div className="text-xs text-slate-500">({sub.total_marks})</div></th>)}
                </tr>
              </thead>
              <tbody>
                {students.filter(s=>selectedStudents.includes(s.id)).map(s=> (
                  <tr key={s.id} className="border-t border-slate-700">
                    <td className="p-2">{s.student_name}</td>
                    {subjects.map(sub=> (
                      <td key={sub.id} className="p-2">
                        <input type="number" min={0} max={sub.total_marks} className="w-24 p-1 rounded bg-transparent border border-slate-700" value={marks[s.id+'_'+sub.id]||''} onChange={e=>setMark(s.id, sub.id, e.target.value)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Button onClick={submit} loading={saving}>Save Results</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
