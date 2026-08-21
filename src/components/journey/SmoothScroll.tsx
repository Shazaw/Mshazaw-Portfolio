'use client'

import { useEffect } from 'react'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'

/**
 * Lenis carries the homepage scroll; IntersectionObserver handles the reveals.
 * One scroll system, never two (spec §1).
 */
export const SmoothScroll = () => {
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null
    let cancelled = false

    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return
      const instance = new Lenis({ duration: 1.05, smoothWheel: true })
      lenis = instance
      const loop = (time: number) => {
        instance.raf(time)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      lenis?.destroy()
    }
  }, [reducedMotion])

  return null
}
