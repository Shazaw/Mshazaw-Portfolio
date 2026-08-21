'use client'

import Link from 'next/link'
import { useCallback, useRef } from 'react'
import { indexOf } from '@/lib/format'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'
import { ART_VIEWBOX, buildArtwork } from './artwork'
import type { SurveyItem } from '@/lib/types'
import styles from './CardStrip.module.css'

/**
 * One Still-Gardens card: wireframe artwork with the title laid over its
 * bottom edge, and the mono meta sitting outside beneath it.
 *
 * The tilt is applied to the media block only — the caption below stays flat so
 * its small type never smears.
 */
export const StripCell = ({
  item,
  index,
  total,
  href,
  variant,
}: {
  item: SurveyItem
  index: number
  total: number
  href: string
  variant: 'lead' | 'side'
}) => {
  const mediaRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const art = buildArtwork(item.artwork)
  const lead = variant === 'lead'
  // `slice` crops to fill, which over-zooms a motif on a card this large.
  const fit = lead ? 'xMidYMax meet' : 'xMidYMax slice'

  const onMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (reduced) return
      const node = mediaRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      node.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 5}deg) translateZ(6px)`
    },
    [reduced],
  )

  const reset = useCallback(() => {
    const node = mediaRef.current
    if (node) node.style.transform = ''
  }, [])

  return (
    <article
      className={[styles.card, lead ? styles.lead : styles.sideCard].join(' ')}
      onMouseMove={onMove}
      onMouseLeave={reset}
      onBlur={reset}
    >
      <div className={styles.media} ref={mediaRef}>
        <svg
          className={styles.art}
          viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
          preserveAspectRatio={fit}
          aria-hidden="true"
        >
          {art.main.map((d, i) => (
            <path key={`m${i}`} d={d} />
          ))}
        </svg>
        <svg
          className={`${styles.art} ${styles.artMuted}`}
          viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
          preserveAspectRatio={fit}
          aria-hidden="true"
        >
          {art.muted.map((d, i) => (
            <path key={`u${i}`} d={d} />
          ))}
        </svg>

        <span className={styles.scan} aria-hidden="true" />
        <span className={styles.scrim} aria-hidden="true" />

        <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 17 L17 7 M9 7 H17 V15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="square"
          />
        </svg>

        <div className={styles.overlay}>
          <h3 className={styles.title}>
            <Link href={href} className={styles.trigger}>
              {item.title}
            </Link>
          </h3>
          {item.subtag ? <span className={styles.subtag}>{item.subtag}</span> : null}
        </div>
      </div>

      <div className={styles.caption}>
        <span>
          {item.year} · {item.kicker}
        </span>
        <span className={styles.index}>{indexOf(index, total)}</span>
      </div>
      <p className={styles.summary}>{item.summary}</p>
    </article>
  )
}
