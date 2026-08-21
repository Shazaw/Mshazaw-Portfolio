import { getSectionItems, getSectionUpdatedAt, toChamberNodes } from '@/lib/data'
import { SECTIONS, surveyLabel } from '@/lib/sections'
import type { SectionKey } from '@/lib/types'
import { SectionView } from './SectionView'

/**
 * Server half of a section page: fetches, normalises and hands the client the
 * mosaic markup plus the minimal chamber payload. Nothing here reads
 * searchParams, so every section page stays statically generated.
 */
export const SectionPage = async ({ sectionKey }: { sectionKey: SectionKey }) => {
  const section = SECTIONS[sectionKey]
  const [items, updatedAt] = await Promise.all([
    getSectionItems(sectionKey),
    getSectionUpdatedAt(sectionKey),
  ])

  return (
    <SectionView
      section={section}
      items={items}
      nodes={toChamberNodes(items)}
      surveyLabel={surveyLabel(section, items.length, updatedAt)}
    />
  )
}
