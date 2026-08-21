import { Navbar } from '@/components/nav/Navbar'
import { Footer } from '@/components/site/Footer'
import { getProfile } from '@/lib/data'
import { cvHref } from '@/lib/profile'

/** The white world: blueprint grid, paper navbar, footer. */
/**
 * Pages are statically generated and revalidated on demand by Payload's
 * afterChange hooks. The hourly floor is a safety net for changes that never
 * pass through a hook — a restored backup, a seed run, a direct DB edit —
 * so the site heals itself instead of serving a stale prerender forever.
 */
export const revalidate = 3600

const LightLayout = async ({ children }: { children: React.ReactNode }) => {
  const profile = await getProfile()

  return (
    <>
      <div className="bpGrid" aria-hidden="true" />
      <Navbar theme="paper" cvHref={cvHref(profile)} />
      {children}
      <Footer profile={profile} />
    </>
  )
}

export default LightLayout
