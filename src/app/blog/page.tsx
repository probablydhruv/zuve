import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/components/SEO'
import BlogPageClient from './BlogPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Blog — Zuve Studio | AI, Design, and the Future of Jewellery',
  description: 'Insights, tutorials, and stories from the intersection of AI and jewellery design. Learn how the next generation of designers is creating faster with Zuve Studio.',
  image: 'https://zuve.studio/favicon.jpg',
  canonical: 'https://zuve.studio/blog',
  keywords: ['AI jewellery design blog', 'jewellery design tutorials', 'design technology', 'jewellery industry insights', 'AI design trends']
})

export default function BlogPage() {
  return <BlogPageClient />
}
