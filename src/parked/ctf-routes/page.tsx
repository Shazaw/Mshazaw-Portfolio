import type { Metadata } from 'next'
import { CtfIndexView } from '@/components/ctf/CtfIndexView'
import { getCtfCompetitions, getCtfStats } from '@/lib/data'

export const metadata: Metadata = {
  title: 'CTF',
  description: 'Capture-the-flag competitions — challenges solved as a player and authored as an organiser.',
}

const CtfIndex = async () => {
  const [solved, authored, stats] = await Promise.all([
    getCtfCompetitions('solved'),
    getCtfCompetitions('authored'),
    getCtfStats(),
  ])

  return (
    <CtfIndexView
      solved={solved}
      authored={authored}
      stats={stats}
      lede="Every event is logged twice over: what I solved, and what I wrote for other people to solve. Switch modes to change what the grid shows."
    />
  )
}

export default CtfIndex
