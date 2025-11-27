import { Box, Button, Container, Typography } from '@mui/material'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box component="main" sx={{ py: 8 }}>
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>404 — Not Found</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>The page you’re looking for doesn’t exist.</Typography>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button variant="contained">Go Home</Button>
        </Link>
      </Container>
    </Box>
  )
}


