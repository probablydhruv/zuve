'use client'

import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Chip,
  Stack,
  Button
} from '@mui/material'
import { CalendarDays, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  readTime: string
  category: string
  image: string
  slug: string
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How AI is Revolutionizing Jewellery Design in 2024',
    excerpt: 'Discover how artificial intelligence is transforming the jewellery design industry, making it faster, more creative, and accessible to designers worldwide.',
    content: 'Full article content here...',
    author: 'Zuve Studio Team',
    publishedAt: '2024-01-15',
    readTime: '5 min read',
    category: 'AI Technology',
    image: '/favicon.jpg',
    slug: 'ai-revolutionizing-jewellery-design-2024'
  },
  {
    id: '2',
    title: 'From Sketch to Render: The Complete Design Workflow',
    excerpt: 'Learn the step-by-step process of transforming your jewellery sketches into photorealistic renders using AI-powered tools.',
    content: 'Full article content here...',
    author: 'Zuve Studio Team',
    publishedAt: '2024-01-10',
    readTime: '7 min read',
    category: 'Design Process',
    image: '/favicon.jpg',
    slug: 'sketch-to-render-complete-workflow'
  },
  {
    id: '3',
    title: '10x Faster Design: Why Jewellery Brands Are Embracing AI',
    excerpt: 'Explore how leading jewellery brands are using AI to accelerate their design processes and stay competitive in the market.',
    content: 'Full article content here...',
    author: 'Zuve Studio Team',
    publishedAt: '2024-01-05',
    readTime: '6 min read',
    category: 'Industry Insights',
    image: '/favicon.jpg',
    slug: '10x-faster-design-jewellery-brands-ai'
  },
  {
    id: '4',
    title: 'The Future of Jewellery Design: Trends to Watch',
    excerpt: 'Stay ahead of the curve with our predictions for the future of jewellery design and the technologies that will shape it.',
    content: 'Full article content here...',
    author: 'Zuve Studio Team',
    publishedAt: '2024-01-01',
    readTime: '8 min read',
    category: 'Future Trends',
    image: '/favicon.jpg',
    slug: 'future-jewellery-design-trends'
  }
]

export default function BlogPageClient() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 2 }}>
          Zuve Studio Blog
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Insights, tutorials, and stories from the intersection of AI and jewellery design
        </Typography>
      </Box>

      {/* Featured Post */}
      <Card sx={{ mb: 6, overflow: 'hidden' }}>
        <Grid container>
          <Grid size={{ xs: 12, md: 6 }}>
            <CardMedia
              component="img"
              height="300"
              image={blogPosts[0].image}
              alt={blogPosts[0].title}
              sx={{ objectFit: 'cover' }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Chip 
                label="Featured" 
                size="small" 
                sx={{ 
                  mb: 2, 
                  bgcolor: '#000000', 
                  color: '#ffffff',
                  width: 'fit-content'
                }} 
              />
              <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 2 }}>
                {blogPosts[0].title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {blogPosts[0].excerpt}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarDays size={16} />
                  <Typography variant="caption">{blogPosts[0].publishedAt}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Clock size={16} />
                  <Typography variant="caption">{blogPosts[0].readTime}</Typography>
                </Stack>
                <Chip label={blogPosts[0].category} size="small" variant="outlined" />
              </Stack>
              <Button 
                component={Link}
                href={`/blog/${blogPosts[0].slug}`}
                variant="contained"
                endIcon={<ArrowRight size={16} />}
                sx={{ 
                  bgcolor: '#000000', 
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#333333' },
                  width: 'fit-content'
                }}
              >
                Read More
              </Button>
            </CardContent>
          </Grid>
        </Grid>
      </Card>

      {/* Blog Grid */}
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 4 }}>
        Latest Articles
      </Typography>
      
      <Grid container spacing={3}>
        {blogPosts.slice(1).map((post) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={post.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={post.image}
                alt={post.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Chip 
                  label={post.category} 
                  size="small" 
                  variant="outlined"
                  sx={{ mb: 2, width: 'fit-content' }}
                />
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2, flexGrow: 1 }}>
                  {post.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {post.excerpt}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarDays size={14} />
                    <Typography variant="caption">{post.publishedAt}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Clock size={14} />
                    <Typography variant="caption">{post.readTime}</Typography>
                  </Stack>
                </Stack>
                <Button 
                  component={Link}
                  href={`/blog/${post.slug}`}
                  variant="outlined"
                  endIcon={<ArrowRight size={16} />}
                  sx={{ 
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': { 
                      borderColor: '#333333',
                      bgcolor: '#f5f5f5'
                    },
                    width: 'fit-content'
                  }}
                >
                  Read More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Newsletter Signup */}
      <Box sx={{ 
        mt: 8, 
        p: 4, 
        bgcolor: 'grey.50', 
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h5" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
          Stay Updated
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Get the latest insights on AI-powered jewellery design delivered to your inbox.
        </Typography>
        <Button 
          variant="contained"
          size="large"
          sx={{ 
            bgcolor: '#000000', 
            color: '#ffffff',
            '&:hover': { bgcolor: '#333333' }
          }}
        >
          Subscribe to Newsletter
        </Button>
      </Box>
    </Container>
  )
}
