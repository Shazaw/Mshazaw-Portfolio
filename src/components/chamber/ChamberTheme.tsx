'use client'

import { useEffect } from 'react'

/**
 * Flips the document to the chamber palette for the duration of a dark route:
 * scrollbars, overscroll and browser UI follow the page instead of fighting it.
 */
export const ChamberTheme = () => {
  useEffect(() => {
    const root = document.documentElement
    const previousTheme = root.dataset.theme
    const previousScheme = root.style.colorScheme
    const previousOverflow = document.body.style.overflow

    root.dataset.theme = 'chamber'
    root.style.colorScheme = 'dark'
    document.body.style.overflow = 'hidden'

    return () => {
      if (previousTheme) root.dataset.theme = previousTheme
      else delete root.dataset.theme
      root.style.colorScheme = previousScheme
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return null
}
