'use client'

import { Box, FormControl, Select, MenuItem, Typography, SelectChangeEvent } from '@mui/material'
import { TierType } from '@/lib/usageTracker'

interface TierSelectorProps {
  currentTier: TierType
  onTierChange: (tier: TierType) => void
}

const TIER_INFO = {
  free: {
    name: 'Free',
    description: '5 images per 48 hours',
    color: '#9e9e9e'
  },
  plus: {
    name: 'Plus',
    description: '10 per 48h, 60 per month',
    color: '#2196f3'
  },
  pro: {
    name: 'Pro',
    description: '1000 images per month',
    color: '#9c27b0'
  },
  max: {
    name: 'Max',
    description: '2000 images per month',
    color: '#ff9800'
  }
}

export default function TierSelector({ currentTier, onTierChange }: TierSelectorProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onTierChange(event.target.value as TierType)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, display: 'block' }}>
        Subscription Tier
      </Typography>
      <FormControl fullWidth size="small">
        <Select
          value={currentTier}
          onChange={handleChange}
          sx={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.2)'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.3)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: TIER_INFO[currentTier].color
            },
            '& .MuiSvgIcon-root': {
              color: 'white'
            }
          }}
        >
          {(Object.keys(TIER_INFO) as TierType[]).map((tier) => (
            <MenuItem key={tier} value={tier}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: TIER_INFO[tier].color }}>
                  {TIER_INFO[tier].name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {TIER_INFO[tier].description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

