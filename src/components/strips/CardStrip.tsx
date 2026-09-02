import { distinctMotifs } from './artwork'
import { StripCell } from './StripCell'
import type { SurveyItem } from '@/lib/types'
import styles from './CardStrip.module.css'

/**
 * The Still-Gardens group: a lead card carrying the heaviest item, with the
 * next two stacked beside it. Inset inside the page column — it aligns with the
 * chapter's text rather than running edge to edge.
 */
export const CardStrip = ({ items, route }: { items: SurveyItem[]; route: string }) => {
  if (items.length === 0) return null

  const shown = items.slice(0, 3)
  // Cards sit side by side, so their motifs are chosen as a set: seeding each
  // from its own slug alone can land three identical drawings in a row.
  const motifs = distinctMotifs(shown.map((item) => item.artwork))
  const [lead, ...rest] = shown
  const href = (item: SurveyItem) => `${route}?focus=${encodeURIComponent(item.slug)}`

  return (
    <div className={styles.gardens} data-count={shown.length}>
      <StripCell
        item={lead}
        index={0}
        total={shown.length}
        href={href(lead)}
        variant="lead"
        motif={motifs[0]}
      />

      {rest.length > 0 ? (
        <div className={styles.side}>
          {rest.map((item, i) => (
            <StripCell
              key={item.id}
              item={item}
              index={i + 1}
              total={shown.length}
              href={href(item)}
              variant="side"
              motif={motifs[i + 1]}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
