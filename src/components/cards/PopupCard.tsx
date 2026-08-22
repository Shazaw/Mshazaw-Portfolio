'use client'

import type { SurveyItem } from '@/lib/types'
import { DetailPopup } from './DetailPopup'

export interface PopupTarget {
  item: SurveyItem
  index: number
}

/** Maps a survey item onto the generic detail popup. */
export const PopupCard = ({
  target,
  collection,
  singular,
  anchored,
  compact = false,
  onClose,
  containerRef,
}: {
  target: PopupTarget | null
  collection: string
  singular: string
  anchored: boolean
  compact?: boolean
  onClose: () => void
  containerRef?: React.RefObject<HTMLDivElement | null>
}) => {
  const item = target?.item

  return (
    <DetailPopup
      open={target !== null}
      index={(target?.index ?? 0) + 1}
      singular={singular}
      title={item?.title ?? ''}
      meta={[item?.periodLabel ?? String(item?.year ?? ''), item?.role ?? item?.kicker ?? '', `Weight ${item?.weight ?? 0}/5`]
        .filter(Boolean)
        .join(' · ')}
      fallbackBody={item?.summary ?? ''}
      tags={item?.tags ?? []}
      links={item?.links ?? []}
      collection={collection}
      slug={item?.slug ?? null}
      anchored={anchored}
      compact={compact}
      onClose={onClose}
      containerRef={containerRef}
    />
  )
}
