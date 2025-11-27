import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/components/SEO'
import ProjectsPageClient from './ProjectsPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Projects — Zuve Studio | Your Design Workspace',
  description: 'Manage your jewellery design projects with Zuve Studio. Create, organize, and access all your design work in one place.',
  image: 'https://zuve.studio/favicon.jpg',
  canonical: 'https://zuve.studio/projects',
  keywords: ['jewellery design projects', 'design workspace', 'project management', 'jewellery portfolio', 'design organization']
})

export default function ProjectsPage() {
  return <ProjectsPageClient />
}