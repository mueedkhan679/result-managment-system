import React from 'react'

import Spinner from './Spinner'

export function Button({ children, className = '', loading=false, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white shadow-sm transition ${className || 'bg-blue-600 hover:bg-blue-700'} ${props.disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner size={1} />}
      {children}
    </button>
  )
}
