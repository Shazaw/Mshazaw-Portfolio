'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'
import { hasWebGL, isSmallViewport } from '@/lib/webgl'
import type { HomeSceneHandle } from './scene'
import styles from './HomeScene.module.css'

/**
 * The fixed background canvas behind the whole journey. Loaded only once the
 * device has proven it can carry it — mobile and reduced-motion get the plain
 * blueprint grid instead, which is the intended fallback.
 */
export const HomeScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion || !hasWebGL() || isSmallViewport()) return
    const canvas = canvasRef.current
    if (!canvas) return

    let handle: HomeSceneHandle | null = null
    let cancelled = false

    const progress = () => {
      const doc = document.documentElement
      const span = doc.scrollHeight - window.innerHeight
      return span > 0 ? doc.scrollTop / span : 0
    }

    void import('./scene').then(({ createHomeScene }) => {
      if (cancelled) return
      handle = createHomeScene({ canvas, reducedMotion, progress })
    })

    return () => {
      cancelled = true
      handle?.dispose()
      handle = null
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
