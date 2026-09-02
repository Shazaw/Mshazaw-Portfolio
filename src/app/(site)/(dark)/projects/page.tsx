import type { Metadata } from 'next'
import { SectionPage } from '@/components/chamber/SectionPage'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Builds, research and tooling. Orbit the cluster or read the cards.',
}

const Page = () => SectionPage({ sectionKey: 'projects' })

export default Page
