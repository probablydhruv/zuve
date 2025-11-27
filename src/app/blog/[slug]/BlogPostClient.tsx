'use client'

import { 
  Box, 
  Container, 
  Typography, 
  Stack,
  Chip,
  Button,
  Divider
} from '@mui/material'
import { CalendarDays, Clock, ArrowLeft, Share2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  slug: string
}

export default function BlogPostClient({ slug }: Props) {
  // In a real app, you'd fetch this data based on the slug
  const post = {
    title: 'How AI is Revolutionizing Jewellery Design in 2024',
    content: `
      <p>The jewellery design industry is experiencing a seismic shift, driven by the rapid advancement of artificial intelligence technologies. What once took designers weeks or months to conceptualize and refine can now be accomplished in a fraction of the time, thanks to AI-powered tools like Zuve Studio.</p>
      
      <h2>The Traditional Design Process</h2>
      <p>Traditionally, jewellery design has been a labor-intensive process that requires:</p>
      <ul>
        <li>Hand sketching initial concepts</li>
        <li>Creating detailed technical drawings</li>
        <li>Building physical prototypes</li>
        <li>Multiple iterations and refinements</li>
        <li>Manual rendering and presentation</li>
      </ul>
      
      <h2>How AI is Changing the Game</h2>
      <p>AI-powered design tools are revolutionizing this workflow by:</p>
      <ul>
        <li><strong>Sketch to Render:</strong> Converting rough sketches into photorealistic renders in seconds</li>
        <li><strong>Intelligent Suggestions:</strong> AI can suggest design variations and improvements</li>
        <li><strong>Automated Technical Drawings:</strong> Generating precise technical specifications automatically</li>
        <li><strong>Material Simulation:</strong> Realistic rendering of different metals, gems, and finishes</li>
        <li><strong>Collection Harmonization:</strong> Ensuring design consistency across entire collections</li>
      </ul>
      
      <h2>The Impact on Designers</h2>
      <p>For jewellery designers, AI tools mean:</p>
      <ul>
        <li><strong>10x Faster Design Cycles:</strong> What used to take weeks now takes days</li>
        <li><strong>Enhanced Creativity:</strong> More time for creative exploration and experimentation</li>
        <li><strong>Reduced Costs:</strong> Less need for expensive prototyping and iteration</li>
        <li><strong>Better Client Presentations:</strong> Photorealistic renders that impress clients</li>
        <li><strong>Scalable Operations:</strong> Handle more projects simultaneously</li>
      </ul>
      
      <h2>Looking Ahead</h2>
      <p>As we move through 2024, we expect to see even more sophisticated AI capabilities, including:</p>
      <ul>
        <li>Real-time collaboration features</li>
        <li>Advanced material property simulation</li>
        <li>Integration with manufacturing systems</li>
        <li>Predictive design analytics</li>
        <li>Voice-activated design commands</li>
      </ul>
      
      <p>The future of jewellery design is here, and it's powered by AI. Designers who embrace these tools will find themselves at the forefront of the industry, creating beautiful, innovative pieces faster than ever before.</p>
    `,
    author: 'Zuve Studio Team',
    publishedAt: '2024-01-15',
    readTime: '5 min read',
    category: 'AI Technology'
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Back Button */}
      <Button 
        component={Link}
        href="/blog"
        startIcon={<ArrowLeft size={16} />}
        sx={{ mb: 4, color: 'text.secondary' }}
      >
        Back to Blog
      </Button>

      {/* Article Header */}
      <Box sx={{ mb: 6 }}>
        <Chip 
          label={post.category} 
          size="small" 
          sx={{ 
            mb: 3, 
            bgcolor: '#000000', 
            color: '#ffffff'
          }} 
        />
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, mb: 3 }}>
          {post.title}
        </Typography>
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarDays size={16} />
            <Typography variant="body2">{post.publishedAt}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Clock size={16} />
            <Typography variant="body2">{post.readTime}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            By {post.author}
          </Typography>
        </Stack>
        <Button 
          startIcon={<Share2 size={16} />}
          variant="outlined"
          size="small"
          sx={{ 
            borderColor: '#000000',
            color: '#000000',
            '&:hover': { 
              borderColor: '#333333',
              bgcolor: '#f5f5f5'
            }
          }}
        >
          Share
        </Button>
      </Box>

      {/* Article Content */}
      <Box 
        sx={{ 
          '& h2': { 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            mt: 4, 
            mb: 2,
            color: 'text.primary'
          },
          '& h3': { 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            mt: 3, 
            mb: 1.5,
            color: 'text.primary'
          },
          '& p': { 
            mb: 2, 
            lineHeight: 1.7,
            color: 'text.primary'
          },
          '& ul': { 
            mb: 2, 
            pl: 3 
          },
          '& li': { 
            mb: 0.5,
            lineHeight: 1.6
          },
          '& strong': {
            fontWeight: 600
          }
        }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <Divider sx={{ my: 6 }} />

      {/* Author Bio */}
      <Box sx={{ 
        p: 3, 
        bgcolor: 'grey.50', 
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          About {post.author}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The Zuve Studio team consists of designers, engineers, and AI researchers passionate about revolutionizing the jewellery design industry through innovative technology.
        </Typography>
      </Box>

      {/* Related Articles */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
          Related Articles
        </Typography>
        <Stack spacing={2}>
          <Button 
            component={Link}
            href="/blog/sketch-to-render-complete-workflow"
            variant="text"
            sx={{ 
              justifyContent: 'flex-start',
              textAlign: 'left',
              p: 2,
              borderRadius: 1,
              '&:hover': { bgcolor: 'grey.50' }
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                From Sketch to Render: The Complete Design Workflow
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Learn the step-by-step process of transforming your jewellery sketches into photorealistic renders.
              </Typography>
            </Box>
          </Button>
          <Button 
            component={Link}
            href="/blog/10x-faster-design-jewellery-brands-ai"
            variant="text"
            sx={{ 
              justifyContent: 'flex-start',
              textAlign: 'left',
              p: 2,
              borderRadius: 1,
              '&:hover': { bgcolor: 'grey.50' }
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                10x Faster Design: Why Jewellery Brands Are Embracing AI
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explore how leading jewellery brands are using AI to accelerate their design processes.
              </Typography>
            </Box>
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}
