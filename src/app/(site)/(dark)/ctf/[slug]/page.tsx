import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CtfCompetitionView } from '@/components/ctf/CtfCompetitionView'
import { getAllCtfCompetitionSlugs, getCtfChallenges, getCtfCompetitionBySlug } from '@/lib/data'

type Params = { params: Promise<{ slug: string }> }

export const generateStaticParams = async () => {
  const slugs = await getAllCtfCompetitionSlugs()
  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({ params }: Params): Promise<Metadata> => {
  const { slug } = await params
  const competition = await getCtfCompetitionBySlug(slug)
  if (!competition) return { title: 'Competition not found' }
  return {
    title: competition.title,
    description: competition.summary,
  }
}

const CtfCompetitionPage = async ({ params }: Params) => {
  const { slug } = await params
  const competition = await getCtfCompetitionBySlug(slug)
  if (!competition) notFound()

  const id = String(competition.id)
  const [solved, authored] = await Promise.all([
    getCtfChallenges(id, 'solved'),
    getCtfChallenges(id, 'authored'),
  ])

  return (
    <CtfCompetitionView
      header={{
        title: competition.title,
        organizer: competition.organizer,
        team: competition.team ?? null,
        placement: competition.placement ?? null,
        date: competition.date,
        format: competition.format ?? 'jeopardy',
        summary: competition.summary,
      }}
      solved={solved}
      authored={authored}
    />
  )
}

export default CtfCompetitionPage
