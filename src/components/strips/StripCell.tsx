import Image from 'next/image'
import Link from 'next/link'
import { ART_VIEWBOX, buildArtwork } from './artwork'
import type { SurveyItem } from '@/lib/types'
import styles from './CardStrip.module.css'

/** Image, title, summary and quiet metadata, in the same order on every card. */
export const StripCell = ({ item, index, href, motif }: {
  item: SurveyItem
  index: number
  href: string
  motif?: string
}) => {
  const art = item.image ? null : buildArtwork(item.artwork, motif)
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {item.image ? (
          <Image className={styles.shot} src={item.image.url} alt={item.image.alt}
            width={item.image.width} height={item.image.height}
            sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 400px" />
        ) : (
          <svg className={styles.art}
            viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
            preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {art?.main.map((path, i) => <path key={`m${i}`} d={path} />)}
            {art?.muted.map((path, i) => <path className={styles.artMuted} key={`u${i}`} d={path} />)}
          </svg>
        )}
      </div>

      <div className={styles.caption}>
        <span title={`${item.dateLabel} · ${item.role ?? item.kicker}`}>{item.dateLabel} · {item.role ?? item.kicker}</span>
        <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3 className={styles.title}>
        <Link href={href} className={styles.trigger}>{item.title}<span aria-hidden="true">↗</span></Link>
      </h3>
      <p className={styles.summary}>{item.summary}</p>

      {item.tags.length ? (
        <ul className={styles.stack} aria-label="Tech stack">
          {item.tags.map(tag => <li key={tag}>{tag}</li>)}
        </ul>
      ) : null}

      {item.links.length ? (
        <div className={styles.links}>
          {item.links.map(link => (
            <a key={link.url} className={styles.linkBtn} href={link.url} target="_blank" rel="noreferrer noopener">
              {link.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      ) : null}
    </article>
  )
}
