'use client'

import { useCallback, useEffect, useState } from 'react'
import { isCtfMode, type CtfMode } from './ctf'

/**
 * `?mode=` holds the state, but it is read and written on the client so the
 * CTF pages stay statically generated and switch instantly.
 */
export const useCtfMode = (): [CtfMode, (mode: CtfMode) => void] => {
  const [mode, setMode] = useState<CtfMode>('solved')

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('mode')
    if (isCtfMode(requested)) setMode(requested)
  }, [])

  const update = useCallback((next: CtfMode) => {
    setMode(next)
    const url = new URL(window.location.href)
    if (next === 'solved') url.searchParams.delete('mode')
    else url.searchParams.set('mode', next)
    window.history.replaceState(null, '', url.toString())
  }, [])

  return [mode, update]
}
