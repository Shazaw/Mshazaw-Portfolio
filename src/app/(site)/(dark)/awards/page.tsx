import type { Metadata } from 'next'
import { SectionPage } from '@/components/chamber/SectionPage'

export const metadata: Metadata = {
  title: 'Awards',
  description: 'Competitions, placements and recognitions.',
}

const Page = () => SectionPage({ sectionKey: 'awards' })

export default Page
