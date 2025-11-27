import { Box, Container } from '@mui/material'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import LandingPage from '@/components/home/LandingPage'
import { generateMetadata as generateSEOMetadata, organizationSchema, softwareSchema } from '@/components/SEO'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Zuve Studio — AI Jewellery Design | Sketch to Render in Seconds',
  description: 'Design jewellery 10× faster with Zuve Studio. Convert your sketches into realistic renders and build full collections in seconds — the creative studio built for jewellery designers.',
  image: 'https://zuve.studio/favicon.jpg',
  canonical: 'https://zuve.studio',
  keywords: ['AI jewellery design', 'jewellery design software', 'sketch to render', 'jewellery designers', 'design 10x faster', 'jewellery brands', 'AI design studio']
})

export default function Home() {
  return (
    <Box component="main">
      <Suspense>
        <LandingPage />
      </Suspense>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema),
        }}
      />
    </Box>
  )
}
