'use client'

import { Box, Button, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export default function HeroCta() {
  const router = useRouter()
  const { user, loading, signInWithGoogle } = useAuth()
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
      <Box sx={{ flex: 1 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Design Jewellery 10x Faster
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Procreate-inspired canvas, layers, brushes, and intelligent AI assistance.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="large"
            onClick={() => (user ? router.push('/projects') : signInWithGoogle())}
            disabled={loading}
          >
            {user ? 'Go to Projects' : 'Get Started'}
          </Button>
          <Button variant="outlined" size="large">Watch Demo</Button>
        </Stack>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ height: 320, bgcolor: 'grey.100', borderRadius: 2 }} />
      </Box>
    </Stack>
  )
}


