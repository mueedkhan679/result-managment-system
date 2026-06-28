import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { gradeForPercentage } from '../../utils/grading'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download, Printer, ArrowLeft, Award, TrendingUp, BookOpen, User2 } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'

const ACCENT_CLASSES = ['result-card-blue','result-card-green','result-card-purple','result-card-amber','result-card-rose','result-card-cyan']

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
  }

  function totals(){
    const total = results.reduce((s,r)=> s + Number(r.total_marks),0)
    const obtained = results.reduce((s,r)=> s + Number(r.obtained_marks),0)
    const percentage = total? Math.round((obtained/total)*100*100)/100 : 0
    return { total, obtained, percentage }
  }

  function gradeClass(g){
    if (!g) return 'grade-f'
    const upper = String(g).toUpperCase()
    if (upper === 'A+' || upper === 'A1') return 'grade-a-plus'
    if (upper === 'A') return 'grade-a'
    if (upper === 'B') return 'grade-b'
    if (upper === 'C') return 'grade-c'
    if (upper === 'D') return 'grade-d'
    return 'grade-f'
  }

  function getAccent(i){
    return ACCENT_CLASSES[i % ACCENT_CLASSES.length]
  }

  function downloadPDF(){
    const doc = new jsPDF()
    const schoolName = 'Result Management System'
    doc.setFontSize(18)
    doc.text(schoolName, 20, 20)
    doc.setFontSize(12)
    doc.text('Name: ' + student.student_name, 20, 32)
    doc.text('Father: ' + student.father_name, 20, 40)
    doc.text('Class: ' + student.class, 20, 48)
    doc.text('Roll: ' + student.roll_no, 20, 56)

    let y = 70
    doc.autoTable({
      startY: y,
      head: [['Subject', 'Total Marks', 'Obtained Marks', 'Grade']],
      body: results.map(r => [r.subject_name, String(r.total_marks), String(r.obtained_marks), gradeForPercentage((r.obtained_marks/r.total_marks)*100)])
    })
    const { total, obtained, percentage } = totals()
    doc.text('Total: ' + obtained + '/' + total, 20, doc.lastAutoTable.finalY + 10)
    doc.text('Percentage: ' + percentage + '%', 20, doc.lastAutoTable.finalY + 18)
    doc.save('Marksheet-' + student.roll_no + '.pdf')
  }

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center animate-fade-in-up'>
        <Spinner size={4} />
        <p className='mt-4 text-slate-500'>Loading results...</p>
      </div>
    </div>
  )
  if (error || !student) return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='card-glass rounded-2xl p-8 text-center animate-fade-in-up'>
        <p className='text-slate-500'>{error || 'No result found'}</p>
      </div>
    </div>
  )

  const { total, obtained, percentage } = totals()

  return (
    <div className='min-h-screen p-4 md:p-8 overflow-x-hidden'>
      <div className='bg-shapes'>
        <div className='bg-shape' />
        <div className='bg-shape' />
      </div>

      <div className='relative z-10 max-w-4xl mx-auto'>
        <button onClick={() => window.history.back()} className='mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm text-slate-600 hover:text-primary transition-colors animate-fade-in-left'>
          <ArrowLeft size={18} />
          <span className='text-sm font-medium'>Back</span>
        </button>

        <div className='card-glass rounded-3xl p-6 shadow-xl mb-6 animate-fade-in-up'>
          <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg animate-bounce-in'>
                <User2 size={32} className='text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-slate-800'>{student.student_name}</h2>
                <p className='text-sm text-slate-500'>Father: {student.father_name}</p>
                <p className='text-sm text-slate-500'>Class: {student.class} // Roll {student.roll_no}</p>
                {results[0]?.declared_at && (
                  <p className='text-xs font-medium text-emerald-600 mt-1'>
                    Result Declared: {new Date(results[0].declared_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className='flex gap-3'>
              <button onClick={() => window.print()} className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white shadow-sm text-slate-700 hover:shadow-md transition-all'>
                <Printer size={18} />
                <span className='text-sm font-medium'>Print</span>
              </button>
              <button onClick={downloadPDF} className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white shadow-md hover:shadow-lg transition-all'>
                <Download size={18} />
                <span className='text-sm font-medium'>Download PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='card-glass rounded-2xl p-4 text-center card-lift animate-fade-in-up delay-100'>
            <BookOpen size={20} className='text-primary mx-auto mb-1.5' />
            <div className='text-xs text-slate-500'>Total Subjects</div>
            <div className='text-xl font-bold text-slate-800'>{results.length}</div>
          </div>
          <div className='card-glass rounded-2xl p-4 text-center card-lift animate-fade-in-up delay-200'>
            <Award size={20} className='text-emerald-500 mx-auto mb-1.5' />
            <div className='text-xs text-slate-500'>Total Marks</div>
            <div className='text-xl font-bold text-slate-800'>{total}</div>
          </div>
          <div className='card-glass rounded-2xl p-4 text-center card-lift animate-fade-in-up delay-300'>
            <TrendingUp size={20} className='text-blue-500 mx-auto mb-1.5' />
            <div className='text-xs text-slate-500'>Obtained</div>
            <div className='text-xl font-bold text-slate-800'>{obtained}</div>
          </div>
          <div className='card-glass rounded-2xl p-4 text-center card-lift animate-fade-in-up delay-400'>
            <div className='inline-flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-1.5 bg-gradient-to-br from-primary to-purple-500'>
              <span className='text-sm font-bold text-white'>{gradeForPercentage(percentage)}</span>
            </div>
            <div className='text-xs text-slate-500'>Percentage</div>
            <div className='text-xl font-bold text-slate-800'>{percentage}%</div>
          </div>
        </div>

        <div className='grid gap-4 mb-6'>
          {results.length > 0 ? results.map((r, i) => (
            <div key={r.id} className={getAccent(i) + ' card-glass rounded-2xl p-5 shadow-sm card-lift animate-fade-in-up delay-' + Math.min((i+2)*100, 600)}>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400'>
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <div className='text-lg font-semibold text-slate-900'>{r.subject_name}</div>
                    <div className='text-sm text-slate-500'>Total Marks: {r.total_marks}</div>
                  </div>
                </div>
                <span className='px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide'>
                  {r.status ? String(r.status).toUpperCase() : 'PENDING'}
                </span>
              </div>

              <div className='mt-5 flex items-center justify-between gap-3'>
                <div className='flex-1'>
                  <div className='text-xs text-slate-400 mb-1'>Obtained Marks</div>
                  <div className='text-2xl font-bold text-slate-900'>{r.obtained_marks}</div>
                </div>
                <div className='flex-1 text-right'>
                  <div className='text-xs text-slate-400 mb-1'>Grade</div>
                  <div className='inline-flex items-center justify-center px-4 py-1.5 rounded-full text-base font-bold bg-gradient-to-r from-primary to-purple-500 text-white'>
                    {gradeForPercentage((r.obtained_marks/r.total_marks)*100)}
                  </div>
                </div>
              </div>

              <div className='mt-4 progress-bar'>
                <div className='progress-bar-fill bg-gradient-to-r from-primary to-purple-500' style={{ width: (Number(r.obtained_marks)/Number(r.total_marks)*100).toFixed(1) + '%' }} />
              </div>
            </div>
          )) : (
            <div className='card-glass rounded-2xl p-8 text-center text-slate-500'>
              No published results found for this student.
            </div>
          )}
        </div>

        <div className='card-glass rounded-2xl p-6 shadow-sm animate-slide-in-up'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex flex-wrap gap-6'>
              <div>
                <div className='text-sm text-slate-500'>Total Marks</div>
                <div className='text-lg font-bold text-slate-800'>{total}</div>
              </div>
              <div>
                <div className='text-sm text-slate-500'>Obtained</div>
                <div className='text-lg font-bold text-slate-800'>{obtained}</div>
              </div>
              <div>
                <div className='text-sm text-slate-500'>Percentage</div>
                <div className='text-lg font-bold text-slate-800'>{percentage}%</div>
              </div>
              <div>
                <div className='text-sm text-slate-500'>Overall Grade</div>
                <div className='inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-primary to-purple-500 text-white'>
                  {gradeForPercentage(percentage)}
                </div>
              </div>
            </div>
            <div className={`text-lg font-bold px-5 py-2.5 rounded-xl ${results.some(r => ['published','approved'].includes(String(r.status || '').toLowerCase())) ? 'bg-green-100 text-green-700' : (results.length ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}`}>
              {results.some(r => ['published','approved'].includes(String(r.status || '').toLowerCase())) ? 'Published' : (results.length ? 'Pending Review' : 'Not Found')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}