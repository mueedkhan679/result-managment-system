import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generateMarksheetPDF(schoolName, student, results){
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(schoolName || import.meta.env.VITE_SCHOOL_NAME || 'My School', 20, 20)
  doc.setFontSize(12)
  doc.text(`Name: ${student.student_name}`, 20, 32)
  doc.text(`Father: ${student.father_name}`, 20, 40)
  doc.text(`Class: ${student.class}`, 20, 48)
  doc.text(`Roll: ${student.roll_no}`, 20, 56)

  doc.autoTable({
    startY: 70,
    head: [['Subject','Total','Obtained','Grade']],
    body: results.map(r=> [r.subject_name, String(r.total_marks), String(r.obtained_marks), r.grade])
  })
  return doc
}
