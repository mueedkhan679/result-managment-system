import React from 'react'

export default function Spinner({ size = 4 }){
  const s = `${size}rem`
  return (
    <div style={{width: s, height: s}} className="rounded-full border-4 border-t-transparent border-slate-200 animate-spin" />
  )
}
