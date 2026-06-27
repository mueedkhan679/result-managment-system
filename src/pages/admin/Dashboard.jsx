import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({})

  async function loadStats(){
    const { data, error } = await supabase.rpc('admin_dashboard_stats')
    if (error) throw error

    setStats({
      total_students: data?.total_students ?? 0,
      total_classes: data?.total_classes ?? 0,
      total_subjects: data?.total_subjects ?? 0,
      pending_results: data?.pending_results ?? 0,
      published_results: data?.published_results ?? (data?.total_results && data?.pending_results ? data.total_results - data.pending_results : 0)
    })
  }

  useEffect(()=>{
    loadStats()
    const handler = () => loadStats()
    window.addEventListener('results-updated', handler)
    return () => window.removeEventListener('results-updated', handler)
  },[])

  const cards = [
    { label: 'Total Students', value: stats.total_students ?? '-', color: 'border-blue-200 bg-blue-50 text-blue-700' },
    { label: 'Total Classes', value: stats.total_classes ?? '-', color: 'border-purple-200 bg-purple-50 text-purple-700' },
    { label: 'Total Subjects', value: stats.total_subjects ?? '-', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    { label: 'Pending Results', value: stats.pending_results ?? '-', color: 'border-amber-200 bg-amber-50 text-amber-700' },
    { label: 'Published Results', value: stats.published_results ?? '-', color: 'border-green-200 bg-green-50 text-green-700' }
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(card => (
          <div key={card.label} className={`rounded-2xl border p-6 shadow-sm ${card.color}`}>
            <div className="text-sm font-medium opacity-80">{card.label}</div>
            <div className="mt-2 text-3xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
