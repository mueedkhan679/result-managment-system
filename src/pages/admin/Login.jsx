import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    try {
      await login({ identifier, password })
      nav('/admin/dashboard')
    } catch (err) {
      // handled by toast
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-xl card-glass">
        <h2 className="text-2xl font-semibold mb-4">Admin Login</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email or Username" value={identifier} onChange={e => setIdentifier(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="flex justify-between items-center">
            <a href="/admin/forgot" className="link-faint text-sm">Forgot password?</a>
            <Button type="submit">Sign in</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
