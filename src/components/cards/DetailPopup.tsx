'use client'

import { useCallback, useRef } from 'react'
import { TagList } from '@/components/ui/Tag'
import { pad2 } from '@/lib/format'
import { useFocusTrap } from '@/lib/useFocusTrap'
import { useItemDetail } from '@/lib/useItemDetail'
import type { SurveyLink } from '@/lib/types'
import styles from './PopupCard.module.css'

export interface DetailPopupProps {
  open: boolean
  /** 1-based position shown as `/07`. */
  index: number
  /** Noun after the index, e.g. `PROJECT`. */
  singular: string
  title: string
  /** Mono line under the title. */
  meta: string
  /** Shown until (or instead of) the lazily fetched rich text. */
  fallbackBody: string
  tags: string[]
  links: SurveyLink[]
  /** Payload collection + slug used for the lazy detail fetch. */
  collection: string
  slug: string | null
  anchored: boolean
  /**
   * Short form: the summary, the stack and the links — no lazily fetched
   * write-up. The chamber uses this; the mosaic's expanded cell carries the
   * long version instead.
   */
  compact?: boolean
  onClose: () => void
  containerRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * The one detail surface in the site (spec §8.3): anchored to a tower in the
 * chamber, centred over the mosaic everywhere else. Rich text is fetched on
 * first open per item and cached for the session.
 */
export const DetailPopup = ({
  open,
  index,
  singular,
  title,
  meta,
  fallbackBody,
  tags,
  links,
  collection,
  slug,
  anchored,
  compact = false,
  onClose,
  containerRef,
}: DetailPopupProps) => {
  const localRef = useRef<HTMLDivElement>(null)
  const ref = containerRef ?? localRef
  // Compact never fetches — that request only exists to fill the long form.
  const { detail, loading } = useItemDetail(collection, open && !compact ? slug : null)

  const handleEscape = useCallback(() => onClose(), [onClose])
  useFocusTrap(ref, open, handleEscape)

  const shownTags = detail?.tags?.length ? detail.tags : tags
  const shownLinks = detail?.links?.length ? detail.links : links

  return (
    <div
      ref={ref}
      className={[styles.popup, anchored ? styles.anchored : styles.standalone, open ? styles.open : '']
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="false"
      aria-hidden={!open}
      aria-label={open ? `${title} detail` : undefined}
      inert={!open}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close detail">
        ✕
      </button>

      {open ? (
        <>
          <span className={styles.index}>
            /{pad2(index)} · {singular}
          </span>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.meta}>{meta}</div>

          <div className={styles.scroller}>
            {!compact && detail?.highlights?.length ? (
              <ul className={styles.highlights}>
                {detail.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}

            {!compact && detail?.html ? (
              <div className={styles.body} dangerouslySetInnerHTML={{ __html: detail.html }} />
            ) : loading ? (
              <p className={styles.loading}>Loading record…</p>
            ) : fallbackBody ? (
              <p className={styles.body}>{fallbackBody}</p>
            ) : null}
          </div>

          <TagList tags={shownTags} onDark className={styles.tags} />

          {shownLinks.length > 0 ? (
            <div className={styles.links}>
              {shownLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noreferrer noopener">
                  {link.label} ↗
                </a>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
