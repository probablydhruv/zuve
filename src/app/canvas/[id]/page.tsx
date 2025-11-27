import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/components/SEO'
import CanvasPageClient from './CanvasPageClient'

type Params = { id: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params
  return generateSEOMetadata({
    title: 'Canvas — Zuve Studio | Design Studio',
    description: 'Create stunning jewellery designs with Zuve Studio\'s AI-powered canvas. Sketch, render, and design with professional tools.',
    image: 'https://zuve.studio/favicon.jpg',
    canonical: `https://zuve.studio/canvas/${id}`,
    keywords: ['jewellery design canvas', 'AI design tools', 'jewellery sketching', 'design studio', 'creative workspace']
  })
}

export default async function CanvasPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  return <CanvasPageClient id={id} />
}