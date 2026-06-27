import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function AdminReset(){
  const { token } = useParams()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e){
    e.preventDefault()
    if(!password) return toast.error('Enter password')
    setLoading(true)
    try{
      const { error } = await supabase.rpc('admin_reset_password', { token, new_password: password })
      if(error) throw error
      toast.success('Password changed')
      nav('/admin/login')
    }catch(err){
      toast.error(err.message || 'Failed')
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-xl card-glass">
        <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
        <form onSubmit={submit} className="space-y-4">
          <Input label="New Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading? 'Saving...' : 'Reset Password'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
