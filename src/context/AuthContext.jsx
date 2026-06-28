import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('rms_admin')
    if (saved) {
      const parsed = JSON.parse(saved)
      setAdmin(parsed.admin)
      setToken(parsed.token)
    }
  }, [])

  async function login({ identifier, password }) {
    // call RPC admin_login
    const { data, error } = await supabase.rpc('admin_login', {
      identifier_param: identifier,
      password_param: password
    })
    if (error || !data) {
      toast.error(error?.message || 'Invalid credentials')
      throw error
    }
    const payload = data
    setAdmin(payload.admin)
    setToken(payload.token)
    localStorage.setItem('rms_admin', JSON.stringify(payload))
    const welcomeHtml = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C5CE7, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px'
        }}>
          👋
        </div>
        <div>
          <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '14px' }}>Welcome, Zoyan!</div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>Ready to manage results today?</div>
        </div>
      </div>
    )
    toast(welcomeHtml, { duration: 4000, icon: '🎉' })
    return payload
  }

  async function forgotPassword(identifier){
    const { data, error } = await supabase.rpc('admin_create_password_reset', { identifier })
    if(error) {
      toast.error(error.message)
      throw error
    }
    // data is token string — in production you would email it
    toast.success('Password reset token created')
    return data
  }

  async function resetPassword(token, newPassword){
    const { error } = await supabase.rpc('admin_reset_password', { token, new_password: newPassword })
    if(error){
      toast.error(error.message)
      throw error
    }
    toast.success('Password reset successful')
    return true
  }

  function logout() {
    setAdmin(null)
    setToken(null)
    localStorage.removeItem('rms_admin')
    toast.success('Logged out')
  }

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, setAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

