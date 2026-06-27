import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function AdminForgot(){
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e){
    e.preventDefault()
    if(!identifier) return toast.error('Enter username or email')
    setLoading(true)
    try{
      const { data, error } = await supabase.rpc('admin_create_password_reset', { identifier })
      if(error) throw error
      // Here you would email the token. We'll display notification with shortened token for dev only.
      toast.success('Password reset token created. Check Supabase logs or email.')
    }catch(err){
      toast.error(err.message || 'Error')
    }finally{ setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-xl card-glass">
        <h2 className="text-2xl font-semibold mb-4">Forgot Password</h2>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email or Username" value={identifier} onChange={e=>setIdentifier(e.target.value)} />
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading? 'Sending...' : 'Send Reset Link'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
