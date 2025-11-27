import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/components/SEO'
import BlogPostClient from './BlogPostClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  // In a real app, you'd fetch this data from a CMS or database
  const post = {
    title: 'How AI is Revolutionizing Jewellery Design in 2024',
    excerpt: 'Discover how artificial intelligence is transforming the jewellery design industry, making it faster, more creative, and accessible to designers worldwide.',
    image: 'https://zuve.studio/favicon.jpg'
  }

  return generateSEOMetadata({
    title: `${post.title} — Zuve Studio Blog`,
    description: post.excerpt,
    image: post.image,
    canonical: `https://zuve.studio/blog/${slug}`,
    type: 'article',
    keywords: ['AI jewellery design', 'jewellery technology', 'design innovation', 'AI trends 2024']
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  return <BlogPostClient slug={slug} />
}
