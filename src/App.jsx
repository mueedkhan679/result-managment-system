import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './pages/admin/Login'
import AdminForgot from './pages/admin/ForgotPassword'
import AdminReset from './pages/admin/ResetPassword'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminSubjects from './pages/admin/Subjects'
import AdminResults from './pages/admin/Results'
import PendingResults from './pages/admin/PendingResults'
import AdminSettings from './pages/admin/Settings'
import AdminGenerate from './pages/admin/GeneratePDF'
import PortalHome from './pages/portal/Home'
import ResultView from './pages/portal/ResultView'
import AdminLayout from './components/Layout/AdminLayout'
import { useAuth } from './context/AuthContext'

function ProtectedAdmin({ children }) {
  const { admin } = useAuth()
  if (!admin) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PortalHome />} />
      <Route path="/result/:id" element={<ResultView />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/forgot" element={<AdminForgot />} />
      <Route path="/admin/reset/:token" element={<AdminReset />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedAdmin>
            <AdminLayout />
          </ProtectedAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="results" element={<AdminResults />} />
        <Route path="pending" element={<PendingResults />} />
        <Route path="generate" element={<AdminGenerate />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
