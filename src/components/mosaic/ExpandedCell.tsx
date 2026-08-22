'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { ART_VIEWBOX, buildArtwork } from '@/components/strips/artwork'
import { useItemDetail } from '@/lib/useItemDetail'
import type { SurveyItem } from '@/lib/types'
import styles from './Mosaic.module.css'

/**
 * The opened record, welded into the block at full width: screenshot (or the
 * generated artwork), the long description fetched on open, the complete tech
 * stack, and the outbound links. Closing returns the block to its normal order.
 */
export const ExpandedCell = ({
  item,
  index,
  collection,
  onClose,
}: {
  item: SurveyItem
  index: number
  collection: string
  onClose: () => void
}) => {
  const ref = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const { detail, loading } = useItemDetail(collection, item.slug)
  const art = item.image ? null : buildArtwork(item.artwork)

  // Move focus into the panel so a keyboard user lands where the content went.
  // The record opens where it sits, so only scroll when it opened out of view.
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const node = ref.current
    if (!node) return
    const box = node.getBoundingClientRect()
    const offscreen = box.top < 80 || box.bottom > window.innerHeight
    if (offscreen) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [item.slug])

  const meta = [item.periodLabel ?? item.dateLabel, item.role ?? item.kicker].filter(Boolean).join(' · ')

  return (
    <article ref={ref} className={`${styles.cell} ${styles.expanded}`} aria-labelledby={`expanded-${item.slug}`}>
      <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="Close record">
        ✕
      </button>

      <div className={styles.expandedMedia}>
        {item.image ? (
          <Image
            src={item.image.url}
            alt={item.image.alt}
            width={item.image.width}
            height={item.image.height}
            sizes="(max-width: 860px) 100vw, 50vw"
          />
        ) : (
          <>
            <svg
              className={styles.expandedArt}
              viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
              preserveAspectRatio="xMidYMax slice"
              aria-hidden="true"
            >
              {art?.main.map((d, i) => (
                <path key={`m${i}`} d={d} />
              ))}
            </svg>
            <svg
              className={`${styles.expandedArt} ${styles.expandedArtMuted}`}
              viewBox={`${ART_VIEWBOX.x} ${ART_VIEWBOX.y} ${ART_VIEWBOX.w} ${ART_VIEWBOX.h}`}
              preserveAspectRatio="xMidYMax slice"
              aria-hidden="true"
            >
              {art?.muted.map((d, i) => (
                <path key={`u${i}`} d={d} />
              ))}
            </svg>
          </>
        )}
      </div>

      <div className={styles.expandedBody}>
        <span className={styles.ghost} aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 id={`expanded-${item.slug}`} className={styles.expandedTitle}>
          {item.title}
          {item.subtag ? <em className={styles.subtag}>{item.subtag}</em> : null}
        </h3>
        <p className={styles.expandedMeta}>{meta}</p>

        {detail?.highlights?.length ? (
          <ul className={styles.expandedProse}>
            {detail.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}

        {detail?.html ? (
          <div className={styles.expandedProse} dangerouslySetInnerHTML={{ __html: detail.html }} />
        ) : loading ? (
          <p className={styles.loading}>Loading record…</p>
        ) : (
          <p className={styles.expandedProse}>{item.summary}</p>
        )}

        {item.tags.length > 0 ? (
          <>
            <p className={styles.stackLabel}>Tech stack</p>
            <div className={styles.stack}>
              {item.tags.map((tag) => (
                <span key={tag} className={styles.chip}>
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : null}

        {item.links.length > 0 ? (
          <div className={styles.expandedLinks}>
            {item.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener">
                {link.label} ↗
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
