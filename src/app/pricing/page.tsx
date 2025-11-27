import { Metadata } from 'next'
import { generateMetadata as generateSEOMetadata } from '@/components/SEO'
import PricingPageClient from './PricingPageClient'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Pricing — Zuve Studio | AI Jewellery Design Plans',
  description: 'Choose the perfect plan for your jewellery design needs. From Free to Max, Zuve Studio offers flexible pricing for designers and brands of all sizes.',
  image: 'https://zuve.studio/favicon.jpg',
  canonical: 'https://zuve.studio/pricing',
  keywords: ['jewellery design pricing', 'AI design plans', 'jewellery software pricing', 'design subscription', 'jewellery design tools']
})

export default function PricingPage() {
  return <PricingPageClient />
}