import { StripCell } from './StripCell'
import type { SurveyItem } from '@/lib/types'
import styles from './CardStrip.module.css'

/**
 * A connected full-bleed strip of uniform cells. Column count adapts to the
 * item count but never mixes widths — mixed widths belong to the mosaic (§7).
 */
export const CardStrip = ({ items, route }: { items: SurveyItem[]; route: string }) => {
  if (items.length === 0) return null
  const cols = Math.min(items.length, 3)

  return (
    <div className={styles.strip} style={{ ['--strip-cols' as string]: cols }}>
      {items.map((item, index) => (
        <StripCell
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          href={`${route}?focus=${encodeURIComponent(item.slug)}`}
        />
      ))}
    </div>
  )
}
