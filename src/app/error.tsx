'use client'

import { useEffect } from 'react'
import { Box, Button, Container, Typography } from '@mui/material'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // Optionally log to monitoring
    // console.error(error)
  }, [error])

  return (
    <Box component="main" sx={{ py: 8 }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Something went wrong</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{error.message || 'An unexpected error occurred.'}</Typography>
        <Button variant="contained" onClick={() => reset()}>Try again</Button>
      </Container>
    </Box>
  )
}


