import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
  canonical?: string
  keywords?: string[]
}

export function generateMetadata({
  title = 'Zuve Studio — AI Jewellery Design Software',
  description = 'Design jewellery 10× faster with Zuve Studio. Convert sketches to realistic renders and build collections in seconds.',
  image = 'https://zuve.studio/favicon.jpg',
  type = 'website',
  canonical,
  keywords = ['AI jewellery design', 'jewellery design software', 'sketch to render', 'jewellery designers', 'design 10x faster']
}: SEOProps): Metadata {
  const url = canonical || 'https://zuve.studio'
  
  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Zuve Studio' }],
    creator: 'Zuve Studio',
    publisher: 'Zuve Studio',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale: 'en_US',
      url,
      title,
      description,
      siteName: 'Zuve Studio',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@zuvestudio',
      site: '@zuvestudio',
    },
    alternates: {
      canonical: url,
    },
    verification: {
      google: 'your-google-verification-code', // Add when you get it
    },
    category: 'technology',
  }
}

// Structured Data for Organization
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Zuve Studio',
  url: 'https://zuve.studio',
  logo: 'https://zuve.studio/logo.png',
  description: 'AI-powered jewellery design software that helps designers create 10x faster',
  sameAs: [
    'https://x.com/zuvestudio',
    'https://www.instagram.com/zuvestudio/',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'hello@zuve.studio',
  },
}

// Structured Data for Software Application
export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Zuve Studio',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web Browser',
  description: 'AI-powered jewellery design software for professional designers',
  url: 'https://zuve.studio',
  author: {
    '@type': 'Organization',
    name: 'Zuve Studio',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
}
