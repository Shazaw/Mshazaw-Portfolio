import type { Metadata } from 'next'
import { SectionPage } from '@/components/chamber/SectionPage'

export const metadata: Metadata = {
  title: 'Experience',
  description: 'Internships, consulting engagements and research posts.',
}

const Page = () => SectionPage({ sectionKey: 'experience' })

export default Page
