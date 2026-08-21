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
  onClose,
  containerRef,
}: {
  target: PopupTarget | null
  collection: string
  singular: string
  anchored: boolean
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
      meta={[item?.periodLabel ?? String(item?.year ?? ''), `Weight ${item?.weight ?? 0}/5`, item?.kicker ?? '']
        .filter(Boolean)
        .join(' · ')}
      fallbackBody={item?.summary ?? ''}
      tags={item?.tags ?? []}
      links={item?.links ?? []}
      collection={collection}
      slug={item?.slug ?? null}
      anchored={anchored}
      onClose={onClose}
      containerRef={containerRef}
    />
  )
}
