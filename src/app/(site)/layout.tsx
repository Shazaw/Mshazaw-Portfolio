import type { Metadata, Viewport } from 'next'
import { fontVariables } from '@/lib/fonts'
import { getProfile } from '@/lib/data'
import '@/styles/globals.css'

export const generateMetadata = async (): Promise<Metadata> => {
  const profile = await getProfile()
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const title = profile.siteTitle || profile.name
  const description =
    profile.siteDescription ||
    `Portfolio of ${profile.name}${profile.role ? ` — ${profile.role}` : ''}.`

  return {
    metadataBase: new URL(base),
    title: {
      default: title,
      template: `%s · ${profile.initials || title}`,
    },
    description,
    applicationName: 'HOLOGRID',
    authors: [{ name: profile.name }],
    creator: profile.name,
    openGraph: {
      type: 'website',
      siteName: title,
      title,
      description,
      url: base,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8F9' },
    { media: '(prefers-color-scheme: dark)', color: '#04070D' },
  ],
  width: 'device-width',
  initialScale: 1,
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className={fontVariables}>
    <body>
      <a className="skipLink" href="#main">
        Skip to content
      </a>
      {children}
    </body>
  </html>
)

export default RootLayout
