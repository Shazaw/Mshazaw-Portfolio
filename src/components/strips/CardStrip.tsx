import { distinctMotifs } from './artwork'
import { StripCell } from './StripCell'
import type { StripLayout, SurveyItem } from '@/lib/types'
import styles from './CardStrip.module.css'

/**
 * The Still-Gardens card group, inset inside the page column.
 *
 * `layout` comes from the section registry so each section on the homepage
 * arranges its three cards differently: a wide lead beside a narrow stack, the
 * same mirrored, three equal columns, or a wide lead above a pair. Without that
 * the page reads as the same block repeated four times.
 */
export const CardStrip = ({
  items,
  route,
  layout = 'lead-left',
  motifSeed,
}: {
  items: SurveyItem[]
  route: string
  layout?: StripLayout
  /** Offsets motif selection so two sections do not land on the same set. */
  motifSeed?: string
}) => {
  if (items.length === 0) return null

  const shown = items.slice(0, 3)
  // Cards sit side by side, so their motifs are chosen as a set: seeding each
  // from its own slug alone can land three identical drawings in a row, and
  // seeding without the section can repeat one section's set in the next.
  const motifs = distinctMotifs(
    shown.map((item) => item.artwork),
    motifSeed,
  )
  const href = (item: SurveyItem) => `${route}?focus=${encodeURIComponent(item.slug)}`

  const cell = (item: SurveyItem, index: number, variant: 'lead' | 'side') => (
    <StripCell
      key={item.id}
      item={item}
      index={index}
      total={shown.length}
      href={href(item)}
      variant={variant}
      motif={motifs[index]}
    />
  )

  // `even` has no lead, so all three sit as peers of the grid.
  if (layout === 'even' && shown.length === 3) {
    return (
      <div className={styles.gardens} data-layout={layout} data-count={shown.length}>
        {shown.map((item, index) => cell(item, index, index === 0 ? 'lead' : 'side'))}
      </div>
    )
  }

  const [lead, ...rest] = shown

  return (
    <div className={styles.gardens} data-layout={layout} data-count={shown.length}>
      {cell(lead, 0, 'lead')}

      {rest.length > 0 ? (
        <div className={styles.side}>{rest.map((item, i) => cell(item, i + 1, 'side'))}</div>
      ) : null}
    </div>
  )
}
