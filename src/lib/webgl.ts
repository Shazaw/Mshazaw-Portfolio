'use client'

/** One cached probe — creating throwaway contexts is not free. */
let cached: boolean | null = null

export const hasWebGL = (): boolean => {
  if (cached !== null) return cached
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    cached = Boolean(gl)
    const lose = (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')
    lose?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

/**
 * Small screens get the mosaic only (§8.5) — a 40-tower cluster on a phone is
 * neither legible nor affordable.
 */
export const isSmallViewport = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 860px)').matches
