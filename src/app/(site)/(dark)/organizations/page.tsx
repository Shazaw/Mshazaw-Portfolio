import type { Metadata } from 'next'
import { SectionPage } from '@/components/chamber/SectionPage'

export const metadata: Metadata = {
  title: 'Organizations',
  description: 'Societies, chapters and student bodies.',
}

const Page = () => SectionPage({ sectionKey: 'organizations' })

export default Page
