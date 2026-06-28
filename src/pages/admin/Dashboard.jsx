import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Users, BookOpen, FileText, Clock, CheckCircle, User } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({})
  const { admin } = useAuth()

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
    { label: 'Total Students', value: stats.total_students ?? '-', icon: Users, color: 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700' },
    { label: 'Total Classes', value: stats.total_classes ?? '-', icon: BookOpen, color: 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700' },
    { label: 'Total Subjects', value: stats.total_subjects ?? '-', icon: FileText, color: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700' },
    { label: 'Pending Results', value: stats.pending_results ?? '-', icon: Clock, color: 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700' },
    { label: 'Published Results', value: stats.published_results ?? '-', icon: CheckCircle, color: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 text-green-700' },
  ]

  return (
    <div>
      {/* Welcome Banner */}
      <div className="mb-8 animate-fade-in-up">
        <div className="welcome-banner rounded-2xl p-6 text-white">
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center animate-bounce-in">
              <User size={28} className="text-white" />
            </div>
            <div>
              <p className="text-indigo-100 text-sm">Welcome back!</p>
              <h2 className="text-2xl font-bold">{admin?.full_name || 'Administrator'}</h2>
              <p className="text-indigo-200 text-sm mt-0.5">Manage your institution results efficiently</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`${card.color} rounded-2xl border p-6 shadow-sm card-lift animate-fade-in-up delay-${(i + 1) * 100}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-sm font-medium opacity-80">{card.label}</div>
                  <div className="mt-1 text-3xl font-bold">{card.value}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
