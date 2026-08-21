'use client'

import Link from 'next/link'
import { useCallback, useRef } from 'react'
import { TagList } from '@/components/ui/Tag'
import { indexOf } from '@/lib/format'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'
import { ART_VIEWBOX, buildArtwork } from './artwork'
import type { SurveyItem } from '@/lib/types'
import styles from './CardStrip.module.css'

/**
 * One cell of a homepage strip. The "slightly 3D" treatment (§7) lives here:
 * pointer-tracked tilt on the cell, artwork and body lifted on separate Z
 * planes. Clicking navigates to the section page with this item focused.
 */
export const StripCell = ({
  item,
  index,
  total,
  href,
}: {
  item: SurveyItem
  index: number
  total: number
  href: string
}) => {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduced = usePrefersReducedMotion()
  const art = buildArtwork(item.artwork)

  const onMove = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (reduced) return
      const node = ref.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      node.style.transform = `rotateY(${x * 9}deg) rotateX(${-y * 7}deg) translateZ(4px)`
    },
    [reduced],
  )

  const reset = useCallback(() => {
    const node = ref.current
    if (node) node.style.transform = ''
  }, [])

  return (
    <Link
      ref={ref}
      href={href}
      className={styles.cell}
      onMouseMove={onMove}
      onMouseLeave={reset}
      onBlur={reset}
    >
      <div className={styles.visual}>
        <svg
          className={styles.art}
          viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          {art.main.map((d, i) => (
            <path key={`m${i}`} d={d} />
          ))}
        </svg>
        <svg
          className={`${styles.art} ${styles.artMuted}`}
          viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
        >
          {art.muted.map((d, i) => (
            <path key={`u${i}`} d={d} />
          ))}
        </svg>
        <span className={styles.scan} aria-hidden="true" />
      </div>

      <span className={styles.corner}>{item.cornerLabel}</span>

      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.summary}>{item.summary}</p>
        <TagList tags={item.tags} max={3} className={styles.tags} />
        <div className={styles.foot}>
          <span>
            {item.year} · {item.kicker}
          </span>
          <span className={styles.index}>{indexOf(index, total)}</span>
        </div>
      </div>
    </Link>
  )
}
