import React from 'react'

export function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        className={`mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${className}`}
        {...props}
      />
    </label>
  )
}
