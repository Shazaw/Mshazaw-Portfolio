'use client'

import { useEffect, useState } from 'react'
import styles from './Blog.module.css'

export const CopyCode = ({ code }: { code: string }) => {
  const [status, setStatus] = useState('Copy')
  useEffect(() => {
    if (status === 'Copy') return
    const timer = window.setTimeout(() => setStatus('Copy'), 2400)
    return () => window.clearTimeout(timer)
  }, [status])

  return (
    <button
      type="button"
      className={styles.copy}
      aria-label="Copy code"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code)
          setStatus('Copied')
        } catch {
          setStatus('Select to copy')
        }
      }}
    >
      <span aria-live="polite">{status}</span>
    </button>
  )
}
