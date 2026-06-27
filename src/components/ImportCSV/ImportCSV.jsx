import React, { useState } from 'react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'

export default function ImportCSV({ onImport, mapping }){
  const [loading, setLoading] = useState(false)

  function handleFile(e){
    const file = e.target.files?.[0]
    if(!file) return
    setLoading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results){
        setLoading(false)
        const rows = results.data.map(r=>{
          const out = {}
          for(const key in mapping){
            out[key] = r[mapping[key]] || r[key] || ''
          }
          return out
        })
        onImport(rows)
      },
      error: function(err){ setLoading(false); toast.error(err.message) }
    })
  }

  return (
    <div>
      <input type="file" accept="text/csv,application/vnd.ms-excel" onChange={handleFile} />
      {loading && <div className="text-sm text-slate-400">Parsing CSV...</div>}
    </div>
  )
}
