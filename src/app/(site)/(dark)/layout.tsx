import { Navbar } from '@/components/nav/Navbar'
import { ChamberTheme } from '@/components/chamber/ChamberTheme'
import { getProfile } from '@/lib/data'
import { cvHref } from '@/lib/profile'

/** The inverted world: chamber palette, dark navbar, no footer, no scroll. */
/**
 * Pages are statically generated and revalidated on demand by Payload's
 * afterChange hooks. The hourly floor is a safety net for changes that never
 * pass through a hook — a restored backup, a seed run, a direct DB edit —
 * so the site heals itself instead of serving a stale prerender forever.
 */
export const revalidate = 3600

const DarkLayout = async ({ children }: { children: React.ReactNode }) => {
  const profile = await getProfile()

  return (
    <>
      <ChamberTheme />
      <Navbar theme="chamber" cvHref={cvHref(profile)} />
      <main id="main">{children}</main>
    </>
  )
}

export default DarkLayout
