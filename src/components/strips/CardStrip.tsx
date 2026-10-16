import { distinctMotifs } from './artwork'
import { StripCell } from './StripCell'
import type { SurveyItem } from '@/lib/types'
import styles from './CardStrip.module.css'

/** A shared editorial grid keeps every homepage collection easy to scan. */
export const CardStrip = ({ items, route, motifSeed }: {
  items: SurveyItem[]
  route: string
  motifSeed?: string
}) => {
  const shown = items.slice(0, 3)
  if (!shown.length) return null
  const motifs = distinctMotifs(shown.map(item => item.artwork), motifSeed)
  return (
    <div className={styles.gardens} data-layout="editorial" data-count={shown.length}>
      {shown.map((item, index) => (
        <StripCell key={item.id} item={item} index={index}
          href={`${route}?focus=${encodeURIComponent(item.slug)}`} motif={motifs[index]} />
      ))}
    </div>
  )
}
