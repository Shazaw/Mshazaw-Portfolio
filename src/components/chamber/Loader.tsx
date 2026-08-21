import styles from './Loader.module.css'

/** The static form of this cube is the monogram and the favicon. */
export const ChamberLoader = ({ hidden, caption = 'Constructing grid…' }: { hidden: boolean; caption?: string }) => (
  <div
    className={[styles.loader, hidden ? styles.hidden : ''].filter(Boolean).join(' ')}
    aria-hidden={hidden}
    role="status"
  >
    <svg viewBox="0 0 74 74" className={styles.cube} aria-hidden="true">
      <path d="M15 24 L37 12 L59 24" />
      <path d="M59 24 L59 50 L37 62" />
      <path d="M37 62 L15 50 L15 24" />
      <path d="M15 24 L37 36 L59 24" />
      <path d="M37 36 L37 62" />
    </svg>
    <div className={styles.caption}>{caption}</div>
  </div>
)
