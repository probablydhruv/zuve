'use client'

import dynamic from 'next/dynamic'
import { Box } from '@mui/material'

const KonvaCanvas = dynamic(() => import('@/components/canvas/KonvaCanvas'), { ssr: false })

interface Props {
  id: string
}

export default function CanvasPageClient({ id }: Props) {
  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      width: '100vw', 
      overflow: 'hidden',
      position: 'fixed',
      top: '64px',
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <KonvaCanvas projectId={id} />
    </Box>
  )
}
