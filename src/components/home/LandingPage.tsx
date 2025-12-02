'use client'

import { 
  Box, 
  Button, 
  Container, 
  Stack, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  Divider,
  useTheme,
  IconButton
} from '@mui/material'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { PlayArrow, CheckCircle, ArrowForward, Speed, AutoAwesome, Sync, VolumeOff, VolumeUp, CalendarToday } from '@mui/icons-material'
import { Sparkles, Wand2, Grid as GridIcon } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import MagicBentoSimple from './MagicBentoSimple'
import './MagicBento.css'

export default function LandingPage() {
  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  const theme = useTheme()
  const [isMuted, setIsMuted] = useState(true)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const sketchVideoRef = useRef<HTMLVideoElement>(null)
  const auraVideoRef = useRef<HTMLVideoElement>(null)
  const harmonizeVideoRef = useRef<HTMLVideoElement>(null)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  const handleGetStarted = () => {
    if (user) {
      router.push('/projects')
    } else {
      signInWithGoogle()
    }
  }

  const toggleMute = () => {
    if (heroVideoRef.current) {
      heroVideoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]))
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: '-50px 0px -50px 0px'
      }
    )

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.id = `section-${index}`
        observer.observe(ref)
      }
    })

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      title: "Content Builder",
      description: "Describes your jewellery designs in one click,\nwhile maintaining the tone of your brand"
    },
    {
      title: "Instant 360 Video",
      description: "Create high quality videos to share with your clients.\nAll under 60 seconds"
    },
    {
      title: "Signature Style",
      description: "Zuve AI Studio learns your brand's design language\nand remembers it"
    },
    {
      title: "Motif Library",
      description: "Find all your motifs and elements\nin one place"
    },
    {
      title: "Auto Job Cards",
      description: "Creates a job card in one click\nfor your production team"
    },
    {
      title: "Stone Layout Assistant",
      description: "Smart placement\nguidance"
    },
    {
      title: "Inspiration Gallery",
      description: "Browse through 1000s of jewellery designs\naugmented by AI"
    },
    {
      title: "Instantly Export as Intelligent Presentation",
      description: "Export your designs as professional\npresentations instantly"
    },
    {
      title: "Collection Analysis",
      description: "Analyze your collection performance\nand trends"
    }
  ]

  return (
    <Box>
              {/* Hero Section */}
              <Box sx={{ 
                py: { xs: 6, sm: 8, md: 10, lg: 12 }, 
                bgcolor: 'background.default',
                paddingLeft: { xs: 'env(safe-area-inset-left)', md: 0 },
                paddingRight: { xs: 'env(safe-area-inset-right)', md: 0 }
              }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', sm: 'column', md: 'row' }} spacing={{ xs: 4, sm: 5, md: 6 }} alignItems="center">
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.75rem' },
                  lineHeight: { xs: 1.2, md: 1.3 }
                }}
              >
                Design Jewellery
                <br />
                <Box component="span" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>10x Faster</Box>
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  mb: 4, 
                  maxWidth: '500px', 
                  mx: { xs: 'auto', md: 0 },
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
                }}
              >
                The creative studio for jewellery designers.
              </Typography>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                justifyContent={{ xs: 'center', md: 'flex-start' }} 
                sx={{ flexWrap: 'nowrap', width: { xs: '100%', sm: 'auto' } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGetStarted}
                  disabled={loading}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: '#000000',
                    color: '#ffffff',
                    '&:hover': { bgcolor: '#333333' },
                    '&:disabled': { bgcolor: '#cccccc', color: '#666666' },
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content',
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.25, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  {user ? 'Go to Projects' : 'Get Started'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CalendarToday />}
                  component={Link}
                  href="https://cal.com/zuvestudio/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': {
                      borderColor: '#000000',
                      bgcolor: '#000000',
                      color: '#ffffff'
                    },
                    whiteSpace: 'nowrap',
                    minWidth: 'fit-content',
                    px: { xs: 2, sm: 3 },
                    py: { xs: 1.25, sm: 1.5 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Schedule a Demo
                </Button>
              </Stack>
            </Box>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <Box sx={{ 
                width: '100%', 
                aspectRatio: { xs: '4/3', sm: '16/9' }, 
                maxHeight: { xs: '400px', sm: '500px', md: '600px' },
                minHeight: { xs: '250px', sm: '300px', md: '400px' },
                borderRadius: 3, 
                overflow: 'hidden', 
                position: 'relative' 
              }}>
                <video 
                  ref={heroVideoRef}
                  width="100%" 
                  height="100%" 
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ 
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%'
                  }}
                  poster="/logo.png"
                >
                  <source src="/zuvideo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <IconButton
                  onClick={toggleMute}
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                  }}
                >
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Platform Introduction */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                lineHeight: { xs: 1.3, md: 1.4 },
                px: { xs: 2, md: 0 }
              }}
            >
              Zuve handles every creative step on one platform.
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              No switching tools, no wasted hours, complete design workflow at lightning speed.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Section 1: Sketch to Render */}
      <Box sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#1f1f1f',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack
                ref={(el) => { sectionRefs.current[0] = el as HTMLDivElement | null }}
                className={visibleSections.has('section-0') ? 'section-animate' : 'section-hidden'}
                spacing={3}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                {/* Sub-heading with sparkle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Typography sx={{
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <Sparkles size={16} /> Hyperreal Jewellery
                  </Typography>
                </Box>
                
                {/* Main headline */}
                <Typography variant="h3" component="h2" sx={{ 
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}>
                  Sketch to Render
                </Typography>
                
                {/* Description */}
                <Typography variant="h6" sx={{ 
                  lineHeight: 1.6,
                  maxWidth: '500px',
                  mx: { xs: 'auto', md: 0 },
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: { xs: '1rem', md: '1.1rem' }
                }}>
                  Converts even your rough scribbles to high quality jewellery designs. 
                  No more hours of manual work - just sketch and watch the magic happen.
                </Typography>
                
                {/* With/Without Zuve Comparison - Minimal Pill Style */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  mt: 3,
                  gap: 2
                }}>
                  {/* Without Zuve - Black Side */}
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      Without Zuve:
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      2 Hours
                    </Typography>
                  </Box>

                  {/* Arrow */}
                  <ArrowForward sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '16px'
                  }} />

                  {/* With Zuve - White Side */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: '1px solid rgba(0, 0, 0, 0.2)'
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      With Zuve:
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      20 Seconds
                    </Typography>
                  </Box>
                </Box>
                
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                className={visibleSections.has('section-0') ? 'section-animate' : 'section-hidden'}
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { xs: '100%', md: 640 },
                  mx: { xs: 'auto', md: 0 },
                  aspectRatio: { xs: '16/9', md: '16/9' },
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                <video
                  ref={sketchVideoRef}
                  width="100%"
                  height="100%"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%'
                  }}
                  poster="/logo.png"
                >
                  <source src="/sketch-render-demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Overlay gradient for better text contrast */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.3))'
                }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Section 2: Aura Assist */}
      <Box sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#1f1f1f',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }} order={{ xs: 2, md: 2 }}>
              <Stack
                ref={(el) => { sectionRefs.current[1] = el as HTMLDivElement | null }}
                className={visibleSections.has('section-1') ? 'section-animate' : 'section-hidden'}
                spacing={3}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                {/* Sub-heading with sparkle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Typography sx={{
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <Wand2 size={16} /> Design Assistant
                  </Typography>
                </Box>
                
                {/* Main headline */}
                <Typography variant="h3" component="h2" sx={{ 
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}>
                  Aura Assist
                </Typography>
                
                {/* Description */}
                <Typography variant="h6" sx={{ 
                  lineHeight: 1.6,
                  maxWidth: '500px',
                  mx: { xs: 'auto', md: 0 },
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: { xs: '1rem', md: '1.1rem' }
                }}>
                  Your design pal who gives you suggestions on the designs you&apos;re currently working on.
                </Typography>
                
                {/* With/Without Zuve Comparison - Minimal Pill Style */}
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  mt: 3,
                  gap: 2
                }}>
                  {/* Without Zuve - Black Side */}
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      Without Zuve:
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      1 Hour
                    </Typography>
                  </Box>

                  {/* Arrow */}
                  <ArrowForward sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '16px'
                  }} />

                  {/* With Zuve - White Side */}
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: '1px solid rgba(0, 0, 0, 0.2)'
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      With Zuve:
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      10 Seconds
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} order={{ xs: 1, md: 1 }}>
              <Box
                className={visibleSections.has('section-1') ? 'section-animate' : 'section-hidden'}
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { xs: '100%', md: 640 },
                  mx: { xs: 'auto', md: 0 },
                  aspectRatio: { xs: '16/9', md: '16/9' },
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                <video
                  ref={auraVideoRef}
                  width="100%"
                  height="100%"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%'
                  }}
                  poster="/logo.png"
                >
                  <source src="/aura-assist-demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Overlay gradient for better text contrast */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.3))'
                }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Section 3: Harmonize */}
      <Box sx={{
        py: { xs: 8, md: 12 },
        bgcolor: '#1f1f1f',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack
                ref={(el) => { sectionRefs.current[2] = el as HTMLDivElement | null }}
                className={visibleSections.has('section-2') ? 'section-animate' : 'section-hidden'}
                spacing={3}
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                {/* Sub-heading with sparkle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Typography sx={{
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}>
                    <GridIcon size={16} /> Collection Builder
                  </Typography>
                </Box>

                {/* Main headline */}
                <Typography variant="h3" component="h2" sx={{
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}>
                  Harmonize
                </Typography>

                {/* Description */}
                <Typography variant="h6" sx={{
                  lineHeight: 1.6,
                  maxWidth: '500px',
                  mx: { xs: 'auto', md: 0 },
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: { xs: '1rem', md: '1.1rem' }
                }}>
                  Instantly creates a collection based on the primary design
                </Typography>

                {/* With/Without Zuve Comparison - Minimal Pill Style */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  mt: 3,
                  gap: 2
                }}>
                  {/* Without Zuve - Black Side */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      Without Zuve:
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      4 Hours
                    </Typography>
                  </Box>

                  {/* Arrow */}
                  <ArrowForward sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '16px'
                  }} />

                  {/* With Zuve - White Side */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: '1px solid rgba(0, 0, 0, 0.2)'
                  }}>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                      With Zuve:
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>
                      40 Seconds
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                className={visibleSections.has('section-2') ? 'section-animate' : 'section-hidden'}
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: { xs: '100%', md: 640 },
                  mx: { xs: 'auto', md: 0 },
                  aspectRatio: { xs: '16/9', md: '16/9' },
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                <video
                  ref={harmonizeVideoRef}
                  width="100%"
                  height="100%"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%'
                  }}
                  poster="/logo.png"
                >
                  <source src="/harmonize-demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Overlay gradient for better text contrast */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.3))'
                }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* From the Studio Gallery Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'background.default' }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                lineHeight: { xs: 1.3, md: 1.4 },
                px: { xs: 2, md: 0 }
              }}
            >
              From the Studio
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                mx: 'auto',
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              See how Zuve Studio transforms simple sketches into stunning jewellery pieces
            </Typography>
          </Box>
          <Box sx={{
            display: 'flex',
            gap: { xs: 4, sm: 5, md: 5, lg: 5 },
            justifyContent: 'center',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            px: 2
          }}>
            {/* Image Gallery Items */}
            {[
              { pre: '/zuve_studio_jewellery_sketch1.png', post: '/zuve_studio_jewellery_render1.png' },
              { pre: '/zuve_studio_jewellery_sketch2.png', post: '/zuve_studio_jewellery_render2.png' },
              { pre: '/zuve_studio_jewellery_sketch3.png', post: '/zuve_studio_jewellery_render3.png' },
              { pre: '/zuve_studio_jewellery_sketch4.png', post: '/zuve_studio_jewellery_render4.png' },
              { pre: '/zuve_studio_jewellery_sketch5.png', post: '/zuve_studio_jewellery_render5.png' }
            ].map((item, index) => (
              <Box
                key={index}
                sx={{
                  position: 'relative',
                  width: { xs: 168, sm: 202, md: 302, lg: 336 },
                  height: { xs: 168, sm: 202, md: 302, lg: 336 },
                  borderRadius: '24px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
                    '& .post-image': {
                      opacity: 1,
                      transform: 'scale(1)'
                    },
                    '& .pre-image': {
                      opacity: 0,
                      transform: 'scale(1.05)'
                    }
                  }
                }}
              >
                {/* Pre-hover image */}
                <Box
                  className="pre-image"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${item.pre})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: 1,
                    transform: 'scale(1)'
                  }}
                />

                {/* Post-hover image */}
                <Box
                  className="post-image"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${item.post})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: 0,
                    transform: 'scale(0.95)'
                  }}
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Hover over any sketch.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Complete Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem', lg: '3rem' },
                lineHeight: { xs: 1.3, md: 1.4 },
                px: { xs: 2, md: 0 }
              }}
            >
              Complete Features
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: '600px', 
                mx: 'auto',
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              Everything you need in one platform
            </Typography>
          </Box>
          
          {/* Magic Bento Grid */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
            <MagicBentoSimple />
          </Box>

          {/* Bottom CTA */}
          <Box sx={{ 
            textAlign: 'center', 
            mt: 8,
            bgcolor: '#000000',
            p: { xs: 4, md: 6 },
            borderRadius: 2
          }}>
            <Typography 
              variant="h5" 
              component="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 600, 
                mb: 2, 
                color: '#ffffff',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                lineHeight: { xs: 1.3, md: 1.4 },
                px: { xs: 2, md: 0 }
              }}
            >
              Design 10x Faster.
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4, 
                maxWidth: '500px', 
                mx: 'auto', 
                color: '#ffffff',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                px: { xs: 2, md: 0 }
              }}
            >
              Join hundereds of designers who are already creating faster
              <br />
              and efficiently with Zuve Studio.
            </Typography>
            <Button
              variant="contained"
              size="medium"
              onClick={handleGetStarted}
              disabled={loading}
              sx={{
                bgcolor: '#ffffff',
                color: '#000000',
                px: { xs: 2, sm: 3 },
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                '&:hover': { bgcolor: '#f0f0f0' },
                '&:disabled': { bgcolor: '#cccccc', color: '#666666' },
                width: { xs: '100%', sm: 'auto' }
              }}
              endIcon={<ArrowForward />}
            >
              Open Zuve Studio
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{
        bgcolor: 'background.default',
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap'
          }}>
            <Link href="/pricing" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                Pricing
              </Typography>
            </Link>
            <Link href="/privacy" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                Privacy Policy
              </Typography>
            </Link>
            <Link href="/terms" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                Terms of Use
              </Typography>
            </Link>
            <Link href="/blog" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                Blog
              </Typography>
            </Link>
            <Link href="https://x.com/zuvestudio" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                X
              </Typography>
            </Link>
            <Link href="https://instagram.com/zuvestudio" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                Instagram
              </Typography>
            </Link>
            <Link href="https://medium.com/@prakruti.dangwal99/from-cad-to-ai-how-technology-is-redefining-jewellery-design-d07d1b05a897" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                Medium
              </Typography>
            </Link>
            <Link href="https://www.linkedin.com/company/zuve/?originalSubdomain=uk" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" sx={{
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
                fontSize: '0.875rem'
              }}>
                LinkedIn
              </Typography>
            </Link>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}