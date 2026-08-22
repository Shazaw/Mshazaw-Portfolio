'use client'

import { useMemo } from 'react'
import { buildMosaicLayout, ROW_HEIGHT_MID, ROW_HEIGHT_TALL } from '@/lib/mosaic'
import { pad2 } from '@/lib/format'
import type { SurveyItem } from '@/lib/types'
import { ExpandedCell } from './ExpandedCell'
import styles from './Mosaic.module.css'

/**
 * The universal 2D surface: the CARDS view inside a chamber, and the only view
 * for mobile / reduced-motion / no-WebGL / loader-timeout visitors.
 *
 * Opening a record promotes it to the head of the block at full width; the
 * remaining cells re-flow beneath it, so the slab stays welded and simply
 * re-orders around whatever is open.
 *
 * The cell is an <article> with a real heading rather than a <button> wrapping
 * one — a heading inside a button is invalid and its role is dropped, which
 * would leave the mosaic with no headings to navigate by. The trigger sits in
 * the heading and stretches over the whole cell to keep it entirely clickable.
 */
export const Mosaic = ({
  items,
  collection,
  expandedSlug,
  onSelect,
  onClose,
  emptyMessage = 'NOTHING LOGGED IN THIS SECTION YET.',
}: {
  items: SurveyItem[]
  collection: string
  expandedSlug?: string | null
  onSelect: (slug: string, index: number) => void
  onClose: () => void
  emptyMessage?: string
}) => {
  const expandedIndex = expandedSlug ? items.findIndex((item) => item.slug === expandedSlug) : -1
  const expanded = expandedIndex >= 0 ? items[expandedIndex] : null

  // The rest keep their relative order; only the open record leaves the flow.
  const rest = useMemo(
    () => (expanded ? items.filter((item) => item.slug !== expanded.slug) : items),
    [items, expanded],
  )
  const layout = useMemo(() => buildMosaicLayout(rest.map((item) => item.mosaicSpan)), [rest])

  if (items.length === 0) {
    return (
      <div className={styles.mosaic}>
        <p className={styles.empty}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.mosaic}>
      {expanded ? (
        <ExpandedCell
          key={`expanded-${expanded.slug}`}
          item={expanded}
          index={expandedIndex}
          collection={collection}
          onClose={onClose}
        />
      ) : null}

      {rest.map((item, index) => {
        const placement = layout[index] ?? { span: 6, row: 0, tall: true }
        // Keep the visible number tied to the record, not its shuffled position.
        const ordinal = items.findIndex((candidate) => candidate.slug === item.slug)
        return (
          <article
            key={item.id}
            className={styles.cell}
            style={{
              gridColumn: `span ${placement.span}`,
              minHeight: placement.tall ? ROW_HEIGHT_TALL : ROW_HEIGHT_MID,
            }}
          >
            <span className={styles.ghost} aria-hidden="true">
              {pad2(ordinal + 1)}
            </span>
            <h3 className={styles.title}>
              <button
                type="button"
                className={styles.trigger}
                onClick={() => onSelect(item.slug, ordinal)}
              >
                {item.title}
              </button>
              {item.subtag ? <em className={styles.subtag}>{item.subtag}</em> : null}
            </h3>
            <p className={styles.desc}>{item.summary}</p>
            <p className={styles.meta}>
              <span>{item.year}</span>
              <span aria-hidden="true">·</span>
              <span className={styles.metaAccent}>W {item.weight}/5</span>
              {item.periodLabel ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{item.periodLabel}</span>
                </>
              ) : null}
            </p>
          </article>
        )
      })}
    </div>
  )
}
