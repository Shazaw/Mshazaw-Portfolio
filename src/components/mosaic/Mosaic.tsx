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
 * Opening a record expands it **where it sits**. The cells before it and the
 * cells after it are laid out as two independent runs, so each run still closes
 * every row to exactly six columns and the slab stays welded — the open record
 * simply claims a full-width row of its own at its own position.
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

  const runs = useMemo(() => {
    if (expandedIndex < 0) {
      return { before: items, expanded: null as SurveyItem | null, after: [] as SurveyItem[] }
    }
    return {
      before: items.slice(0, expandedIndex),
      expanded: items[expandedIndex],
      after: items.slice(expandedIndex + 1),
    }
  }, [items, expandedIndex])

  // Each run closes its own rows, so no run can leave a ragged edge.
  const layoutBefore = useMemo(
    () => buildMosaicLayout(runs.before.map((item) => item.mosaicSpan)),
    [runs.before],
  )
  const layoutAfter = useMemo(
    () => buildMosaicLayout(runs.after.map((item) => item.mosaicSpan)),
    [runs.after],
  )

  if (items.length === 0) {
    return (
      <div className={styles.mosaic}>
        <p className={styles.empty}>{emptyMessage}</p>
      </div>
    )
  }

  const renderCell = (item: SurveyItem, placement: { span: number; tall: boolean } | undefined) => {
    // The visible number stays tied to the record, not to its position in a run.
    const ordinal = items.indexOf(item)
    const span = placement?.span ?? 6
    const tall = placement?.tall ?? true

    return (
      <article
        key={item.id}
        className={styles.cell}
        style={{ gridColumn: `span ${span}`, minHeight: tall ? ROW_HEIGHT_TALL : ROW_HEIGHT_MID }}
      >
        <span className={styles.ghost} aria-hidden="true">
          {pad2(ordinal + 1)}
        </span>
        <h3 className={styles.title}>
          <button type="button" className={styles.trigger} onClick={() => onSelect(item.slug, ordinal)}>
            {item.title}
          </button>
          {item.subtag ? <em className={styles.subtag}>{item.subtag}</em> : null}
        </h3>
        <p className={styles.desc}>{item.summary}</p>
        <p className={styles.meta}>
          <span className={styles.metaAccent}>{item.dateLabel}</span>
          {item.periodLabel ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.periodLabel}</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.kicker}</span>
            </>
          )}
        </p>
      </article>
    )
  }

  return (
    <div className={styles.mosaic}>
      {runs.before.map((item, index) => renderCell(item, layoutBefore[index]))}

      {runs.expanded ? (
        <ExpandedCell
          key={`expanded-${runs.expanded.slug}`}
          item={runs.expanded}
          index={expandedIndex}
          collection={collection}
          onClose={onClose}
        />
      ) : null}

      {runs.after.map((item, index) => renderCell(item, layoutAfter[index]))}
    </div>
  )
}
