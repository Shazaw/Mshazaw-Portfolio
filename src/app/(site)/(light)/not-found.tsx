import Link from 'next/link'
import { Eyebrow } from '@/components/ui/Eyebrow'
import styles from './not-found.module.css'

const NotFound = () => (
  <main id="main" className={styles.page}>
    <Eyebrow>Error · 404 · Off the survey</Eyebrow>
    <h1 className={styles.title}>
      No record at
      <br />
      <span className={styles.stroke}>this coordinate</span>
    </h1>
    <p className={styles.body}>
      The page you asked for is not part of this survey. Everything that exists is reachable from the
      grid.
    </p>
    <Link href="/" className={styles.link}>
      ◫ &nbsp;Return to the survey
    </Link>
  </main>
)

export default NotFound
