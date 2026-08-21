import styles from './Eyebrow.module.css'

/** `— 02 · PROJECTS · SELECTED · N=14` */
export const Eyebrow = ({
  children,
  onDark = false,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  onDark?: boolean
  className?: string
  as?: 'div' | 'p' | 'h2'
}) => (
  <Tag className={[styles.eyebrow, onDark ? styles.onDark : '', className].filter(Boolean).join(' ')}>
    <span className={styles.tick} aria-hidden="true" />
    {children}
  </Tag>
)
