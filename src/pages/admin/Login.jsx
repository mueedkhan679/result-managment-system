import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GraduationCap, Lock, Eye, EyeOff, User } from 'lucide-react'
import Spinner from '../../components/ui/Spinner'

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ identifier, password })
      nav('/admin/dashboard')
    } catch (err) {
      // handled by toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="bg-shapes">
        <div className="bg-shape" />
        <div className="bg-shape" />
        <div className="bg-shape" />
        <div className="bg-shape" />
      </div>
      <div className="absolute inset-0 grid-pattern" />
      {[...Array(20)].map((_, i) => (
        <div key={i} className="particle" style={{ width: Math.random() * 8 + 3 + 'px', height: Math.random() * 8 + 3 + 'px', left: Math.random() * 100 + '%', animationDelay: Math.random() * 15 + 's', animationDuration: Math.random() * 10 + 10 + 's' }} />
      ))}
      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-scale">
        <div className="card-glass-dark rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 mb-5 animate-rotate-in">
              <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome <span className="gradient-text-white">Back</span>
            </h1>
            <p className="text-indigo-200 text-sm">Result Management System</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="animate-fade-in-up delay-100">
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Email or Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-3.5 text-indigo-300" />
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Enter email or username" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all" required />
              </div>
            </div>
            <div className="animate-fade-in-up delay-200">
              <label className="block text-sm font-medium text-indigo-100 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-3.5 text-indigo-300" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-indigo-300 hover:text-white transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end animate-fade-in-up delay-200">
              <a href="/admin/forgot" className="text-sm text-indigo-300 hover:text-white transition-colors">Forgot password?</a>
            </div>
            <div className="animate-fade-in-up delay-300 pt-2">
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold text-white rounded-xl shimmer-btn shadow-lg">
                {loading && <Spinner size={1.2} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
          <div className="text-center mt-6 animate-fade-in-up delay-400">
            <p className="text-xs text-indigo-300">Secured by Result Management System</p>
          </div>
        </div>
      </div>
    </div>
  )
}
