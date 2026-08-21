import Link from 'next/link'
import styles from './EnterButton.module.css'

/** `◫ ENTER PROJECT GRID` — the one call to action on each homepage chapter. */
export const EnterButton = ({ href, label }: { href: string; label: string }) => (
  <Link href={href} className={styles.btn}>
    <span className={styles.glyph} aria-hidden="true">
      ◫
    </span>
    {label}
  </Link>
)
