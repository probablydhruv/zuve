'use client'

/**
 * TierUpdater Component
 * 
 * This component allows admin/testing to update user tiers directly in Firestore.
 * For development and testing only - should be removed or restricted in production.
 */

import { useState } from 'react'
import { Box, Button, Typography, Alert } from '@mui/material'
import { useAuth } from '@/components/providers/AuthProvider'
import { updateUserTier } from '@/lib/firestore'
import { TierType } from '@/lib/usageTracker'

export default function TierUpdater() {
  const { user, tier, refreshUserProfile } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleUpdateTier = async (newTier: TierType) => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in' })
      return
    }

    setUpdating(true)
    setMessage(null)

    try {
      // Update tier in Firestore
      await updateUserTier(user.uid, newTier)
      
      // Refresh the auth context to get the new tier
      await refreshUserProfile()
      
      setMessage({ type: 'success', text: `Successfully updated to ${newTier} tier!` })
    } catch (error: any) {
      console.error('Error updating tier:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update tier' })
    } finally {
      setUpdating(false)
    }
  }

  if (!user) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Sign in to manage your tier
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Tier Management (Development Only)
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current Tier: <strong>{tier}</strong>
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant={tier === 'free' ? 'contained' : 'outlined'}
          onClick={() => handleUpdateTier('free')}
          disabled={updating || tier === 'free'}
          fullWidth
        >
          Free Tier (5 images / 48h)
        </Button>
        
        <Button
          variant={tier === 'plus' ? 'contained' : 'outlined'}
          onClick={() => handleUpdateTier('plus')}
          disabled={updating || tier === 'plus'}
          fullWidth
        >
          Plus Tier (10 / 48h, 60 / month)
        </Button>
        
        <Button
          variant={tier === 'pro' ? 'contained' : 'outlined'}
          onClick={() => handleUpdateTier('pro')}
          disabled={updating || tier === 'pro'}
          fullWidth
        >
          Pro Tier (1000 / month)
        </Button>
        
        <Button
          variant={tier === 'max' ? 'contained' : 'outlined'}
          onClick={() => handleUpdateTier('max')}
          disabled={updating || tier === 'max'}
          fullWidth
        >
          Max Tier (2000 / month)
        </Button>
      </Box>

      <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
        ⚠️ Warning: This component should only be used for testing. 
        Remove or restrict access in production.
      </Typography>
    </Box>
  )
}

