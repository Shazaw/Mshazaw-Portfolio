import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from './Reveal'
import styles from './Chapter.module.css'

/** One scroll chapter: eyebrow, heading, supporting line, then its content. */
export const Chapter = ({
  eyebrow,
  heading,
  blurb,
  children,
  id,
  className,
}: {
  eyebrow: string
  heading?: string
  blurb?: string
  children?: React.ReactNode
  id?: string
  className?: string
}) => (
  <section id={id} className={[styles.chapter, className].filter(Boolean).join(' ')}>
    <Reveal>
      <Eyebrow>{eyebrow}</Eyebrow>
      {heading ? <h2 className={styles.heading}>{heading}</h2> : null}
      {blurb ? <p className={styles.sub}>{blurb}</p> : null}
    </Reveal>
    {children}
  </section>
)

export { styles as chapterStyles }
