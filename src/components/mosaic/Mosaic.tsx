'use client'

import { buildMosaicLayout, ROW_HEIGHT_MID, ROW_HEIGHT_TALL } from '@/lib/mosaic'
import { pad2 } from '@/lib/format'
import type { SurveyItem } from '@/lib/types'
import styles from './Mosaic.module.css'

/**
 * The universal 2D surface: the CARDS view inside a chamber, and the only view
 * for mobile / reduced-motion / no-WebGL / loader-timeout visitors.
 *
 * The cell is an <article> with a real heading rather than a <button> wrapping
 * one — a heading inside a button is invalid and its role is dropped, which
 * would leave the mosaic with no headings to navigate by. The trigger sits in
 * the heading and stretches over the whole cell to keep it entirely clickable.
 */
export const Mosaic = ({
  items,
  selectedSlug,
  onSelect,
  emptyMessage = 'NOTHING LOGGED IN THIS SECTION YET.',
}: {
  items: SurveyItem[]
  selectedSlug?: string | null
  onSelect: (slug: string, index: number) => void
  emptyMessage?: string
}) => {
  const layout = buildMosaicLayout(items.map((item) => item.mosaicSpan))

  if (items.length === 0) {
    return (
      <div className={styles.mosaic}>
        <p className={styles.empty}>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.mosaic}>
      {items.map((item, index) => {
        const placement = layout[index] ?? { span: 6, row: 0, tall: true }
        return (
          <article
            key={item.id}
            className={styles.cell}
            data-selected={selectedSlug === item.slug ? 'true' : undefined}
            style={{
              gridColumn: `span ${placement.span}`,
              minHeight: placement.tall ? ROW_HEIGHT_TALL : ROW_HEIGHT_MID,
            }}
          >
            <span className={styles.ghost} aria-hidden="true">
              {pad2(index + 1)}
            </span>
            <h3 className={styles.title}>
              <button type="button" className={styles.trigger} onClick={() => onSelect(item.slug, index)}>
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
