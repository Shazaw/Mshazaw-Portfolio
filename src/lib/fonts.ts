import localFont from 'next/font/local'

/**
 * Self-hosted, latin subset only. Per spec §2.2 the display face is the one
 * that gets preloaded — body and mono arrive with the CSS.
 */
export const spaceGrotesk = localFont({
  src: [
    { path: '../fonts/space-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/space-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export const plexSans = localFont({
  src: [
    { path: '../fonts/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/ibm-plex-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-plex-sans',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
})

export const plexMono = localFont({
  src: [{ path: '../fonts/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' }],
  variable: '--font-plex-mono',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'monospace'],
})

export const fontVariables = `${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`
