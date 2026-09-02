'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Monogram } from '@/components/ui/Monogram'
import { CTF_ENABLED } from '@/lib/features'
import styles from './Navbar.module.css'

export interface NavLinkDef {
  label: string
  href: string
}

export const NAV_LINKS: NavLinkDef[] = [
  { label: 'Home', href: '/' },
  // About is a chapter of the homepage, not a page of its own.
  { label: 'Projects', href: '/projects' },
  { label: 'Experience', href: '/experience' },
  { label: 'Orgs', href: '/organizations' },
  ...(CTF_ENABLED ? [{ label: 'CTF', href: '/ctf' }] : []),
  { label: 'Awards', href: '/awards' },
]

/**
 * The theme is decided by the route group that renders the navbar, not by a
 * client-side pathname check — that keeps the server markup correct and avoids
 * a white flash on the way into a chamber.
 */
export const Navbar = ({ theme = 'paper', cvHref }: { theme?: 'paper' | 'chamber'; cvHref?: string | null }) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dark = theme === 'chamber'

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <nav className={[styles.nav, dark ? styles.dark : ''].filter(Boolean).join(' ')}>
        <Link href="/" className={styles.mark} aria-label="Home">
          <Monogram />
        </Link>

        <div className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[styles.link, isActive(link.href) ? styles.active : ''].filter(Boolean).join(' ')}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          {cvHref ? (
            <a
              href={cvHref}
              target="_blank"
              rel="noreferrer noopener"
              className={[styles.link, styles.cv].join(' ')}
            >
              [CV]
            </a>
          ) : null}
        </div>

        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="nav-sheet"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </nav>

      <div
        id="nav-sheet"
        className={[styles.sheet, dark ? styles.darkSheet : '', open ? styles.open : ''].filter(Boolean).join(' ')}
      >
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={styles.sheetLink}>
            {link.label}
          </Link>
        ))}
        {cvHref ? (
          <a href={cvHref} target="_blank" rel="noreferrer noopener" className={styles.sheetLink}>
            [CV]
          </a>
        ) : null}
      </div>
    </>
  )
}
