import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Students', path: '/admin/students' },
  { label: 'Subjects', path: '/admin/subjects' },
  { label: 'Add Result', path: '/admin/results' },
  { label: 'Pending Results', path: '/admin/pending' },
  { label: 'Generate PDF', path: '/admin/generate' },
  { label: 'Settings', path: '/admin/settings' }
]

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = useNavigate()

  function handleLogout() {
    logout()
    nav('/admin/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center rounded-2xl px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <img src={admin?.profile_image || '/favicon.svg'} alt="avatar" className="h-10 w-10 rounded-full border border-slate-200" />
          <div>
            <div className="text-sm font-semibold text-slate-900">{admin?.full_name || 'Administrator'}</div>
            <div className="text-xs text-slate-500">{admin?.role || 'Administrator'}</div>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(open => !open)}
          aria-label="Toggle admin menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-200 bg-white/95 p-6 shadow-2xl transition duration-300 ease-out backdrop-blur md:static md:translate-x-0 md:shadow-sm ${
            menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="mb-8 flex items-center gap-4">
            <img src={admin?.profile_image || '/favicon.svg'} alt="avatar" className="h-12 w-12 rounded-full border border-slate-200" />
            <div>
              <div className="font-semibold text-slate-800">{admin?.full_name || 'Administrator'}</div>
              <div className="text-sm text-slate-500">{admin?.role || 'Administrator'}</div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map(item => (
              <NavLink key={item.path} to={item.path} className={linkClass} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </aside>

        <button
          className={`fixed inset-0 z-20 bg-slate-900/40 transition-opacity duration-300 md:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-500 ease-out md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
