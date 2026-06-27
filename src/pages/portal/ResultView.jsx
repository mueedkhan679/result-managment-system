import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { gradeForPercentage } from '../../utils/grading'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ResultView(){
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [results, setResults] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{ load() }, [id])

  async function load(){
    setLoading(true)
    setError('')

    const { data, error: rpcError } = await supabase.rpc('portal_get_results', { student_id: id })

    if (!rpcError && data?.student) {
      setStudent(data.student)
      setResults(data.results || [])
      setLoading(false)
      return
    }

    const { data: studentsData, error: studentsError } = await supabase.rpc('admin_list_students')
    const studentData = Array.isArray(studentsData) ? studentsData.find(s => s.id === id) : null
    if (studentsError || !studentData) {
      setError('No result found for this student')
      setStudent(null)
      setResults([])
      setLoading(false)
      return
    }

    const { data: publishedResults, error: publishedError } = await supabase.rpc('admin_list_results', { status: 'published' })
    if (publishedError) {
      console.error(publishedError)
      setError('Unable to load result details')
      setStudent(null)
      setResults([])
      setLoading(false)
      return
    }

    const rows = Array.isArray(publishedResults) ? publishedResults.filter(r => String(r.student_id) === String(id)) : []
    setStudent(studentData)
    setResults(rows)
    setLoading(false)
    return

    const visibleRows = (resultRows || []).filter(row => {
      const status = String(row.status || '').toLowerCase()
      return status === 'published' || status === 'approved' || !status
    })

    const subjectIds = [...new Set((visibleRows.length ? visibleRows : (resultRows || [])).map(r => r.subject_id).filter(Boolean))]
    let subjectNames = {}
    if (subjectIds.length) {
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, subject_name')
        .in('id', subjectIds)
      subjectNames = Object.fromEntries((subjectsData || []).map(s => [s.id, s.subject_name]))
    }

    const rowsToShow = (visibleRows.length ? visibleRows : (resultRows || [])).map(r => ({ ...r, subject_name: subjectNames[r.subject_id] || 'Unknown' }))

    setStudent(studentData)
    setResults(rowsToShow)
    setLoading(false)
  }

  function totals(){
    const total = results.reduce((s,r)=> s + Number(r.total_marks),0)
    const obtained = results.reduce((s,r)=> s + Number(r.obtained_marks),0)
    const percentage = total? Math.round((obtained/total)*100*100)/100 : 0
    return { total, obtained, percentage }
  }

  function downloadPDF(){
    const doc = new jsPDF()
    const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'My School'
    doc.setFontSize(16)
    doc.text(schoolName, 20, 20)
    doc.setFontSize(12)
    doc.text(`Name: ${student.student_name}`, 20, 32)
    doc.text(`Father: ${student.father_name}`, 20, 40)
    doc.text(`Class: ${student.class}`, 20, 48)
    doc.text(`Roll: ${student.roll_no}`, 20, 56)

    let y = 70
    doc.autoTable({
      startY: y,
      head: [['Subject','Total','Obtained','Grade']],
      body: results.map(r=> [r.subject_name, String(r.total_marks), String(r.obtained_marks), gradeForPercentage((r.obtained_marks/r.total_marks)*100)])
    })
    const { total, obtained, percentage } = totals()
    doc.text(`Total: ${obtained}/${total}`, 20, doc.lastAutoTable.finalY + 10)
    doc.text(`Percentage: ${percentage}%`, 20, doc.lastAutoTable.finalY + 18)
    doc.save(`Marksheet-${student.roll_no}.pdf`)
  }

  if (loading) return <div className="p-8">Loading…</div>
  if (error || !student) return <div className="p-8">{error || 'No result found'}</div>

  const { total, obtained, percentage } = totals()

  return (
    <div className="min-h-screen p-8 flex justify-center">
      <div className="w-full max-w-3xl card-glass p-6 rounded">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{student.student_name}</h2>
            <div className="text-sm text-slate-400">Father: {student.father_name}</div>
            <div className="text-sm text-slate-400">Class: {student.class} • Roll {student.roll_no}</div>
          </div>
          <div>
            <button onClick={()=>window.print()} className="mr-2 px-3 py-1 rounded bg-primary text-white">Print</button>
            <button onClick={downloadPDF} className="px-3 py-1 rounded bg-slate-700 text-white">Download PDF</button>
          </div>
        </div>

        <div className="grid gap-4 mb-6 md:grid-cols-2">
          {results.length > 0 ? results.map(r => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{r.subject_name}</div>
                  <div className="text-sm text-slate-500">Total Marks: {r.total_marks}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {r.status ? String(r.status).toUpperCase() : 'PENDING'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-400">Obtained</div>
                  <div className="text-2xl font-semibold text-slate-900">{r.obtained_marks}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Grade</div>
                  <div className="text-2xl font-semibold text-slate-900">{gradeForPercentage((r.obtained_marks/r.total_marks)*100)}</div>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 md:col-span-2">
              No published results found for this student.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div>Total Marks: {total}</div>
            <div>Obtained: {obtained}</div>
            <div>Percentage: {percentage}%</div>
            <div>Overall Grade: {gradeForPercentage(percentage)}</div>
          </div>
          <div className="text-lg font-semibold">Status: {results.some(r => ['published','approved'].includes(String(r.status || '').toLowerCase())) ? 'Published' : (results.length ? 'Pending Review' : 'Not Found')}</div>
        </div>
      </div>
    </div>
  )
}
