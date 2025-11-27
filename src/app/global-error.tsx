'use client'

import { Box, Button, Container, Typography } from '@mui/material'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body>
        <Box component="main" sx={{ py: 8 }}>
          <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>Unexpected error</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{error?.message || 'An error occurred.'}</Typography>
            <Button variant="contained" onClick={() => reset()}>Reload</Button>
          </Container>
        </Box>
      </body>
    </html>
  )
}


