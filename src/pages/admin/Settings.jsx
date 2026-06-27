import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import toast from 'react-hot-toast'

export default function AdminSettings(){
  const { admin, setAdmin } = useAuth()
  const [fullName, setFullName] = useState(admin?.full_name||'')
  const [username, setUsername] = useState(admin?.username||'')
  const [password, setPassword] = useState('')

  async function saveProfile(e){
    e.preventDefault()
    const { data, error } = await supabase.rpc('admin_update_profile',{admin_id: admin.id, full_name: fullName, username_param: username})
    if(error) return toast.error(error.message)
    setAdmin(data)
    toast.success('Profile updated')
  }

  async function changePassword(e){
    e.preventDefault()
    if(!password) return toast.error('Enter new password')
    const { error } = await supabase.rpc('admin_change_password',{admin_id: admin.id, new_password: password})
    if(error) return toast.error(error.message)
    toast.success('Password changed')
    setPassword('')
  }

  async function uploadAvatar(e){
    const file = e.target.files?.[0]
    if(!file) return
    const ext = file.name.split('.').pop()
    const filePath = `avatars/${admin.id}.${ext}`
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if(error) return toast.error(error.message)
    const { data: publicData, error: publicError } = supabase.storage.from('avatars').getPublicUrl(filePath)
    if(publicError) return toast.error(publicError.message)
    const publicURL = publicData?.publicUrl
    if(!publicURL) return toast.error('Could not get public URL')
    // update profile image via RPC
    const { data: updated, error: err2 } = await supabase.rpc('admin_update_profile',{admin_id: admin.id, full_name: fullName, username_param: username, profile_image: publicURL})
    if(err2) return toast.error(err2.message)
    setAdmin(updated)
    toast.success('Profile image uploaded')
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <form onSubmit={saveProfile} className="p-4 card-glass rounded max-w-lg">
        <label className="block text-sm text-slate-300">Full name</label>
        <input className="w-full p-2 rounded bg-transparent border border-slate-700" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <label className="block text-sm text-slate-300 mt-2">Username</label>
        <input className="w-full p-2 rounded bg-transparent border border-slate-700" value={username} onChange={e=>setUsername(e.target.value)} />
        <div className="mt-4">
          <Button type="submit">Save</Button>
        </div>
      </form>

      <div className="p-4 card-glass rounded max-w-lg mt-4">
        <label className="block text-sm text-slate-300">Upload Profile Picture</label>
        <input type="file" accept="image/*" onChange={uploadAvatar} className="mt-2" />
      </div>

      <form onSubmit={changePassword} className="p-4 card-glass rounded max-w-lg mt-4">
        <label className="block text-sm text-slate-300">Change Password</label>
        <input type="password" className="w-full p-2 rounded bg-transparent border border-slate-700" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="mt-4">
          <Button type="submit">Change Password</Button>
        </div>
      </form>
    </div>
  )
}
