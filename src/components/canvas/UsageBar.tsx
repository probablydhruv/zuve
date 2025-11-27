'use client'

import { Box, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material'
import { Refresh, Info } from '@mui/icons-material'
import { UsageStatus } from '@/lib/usageTracker'
import { useState, useEffect } from 'react'

interface UsageBarProps {
  usageStatus: UsageStatus
  onUsageClick?: () => void
  onReset?: () => void
}

export default function UsageBar({ usageStatus, onUsageClick, onReset }: UsageBarProps) {
  const { color, cooldownUntil, windowUsages, bottleneckWindow, remainingInBottleneck, overdraft, tierName } = usageStatus
  const [availableTime, setAvailableTime] = useState<string>('')

  // Cooldown timer effect - show when it will be available
  useEffect(() => {
    if (!cooldownUntil) {
      setAvailableTime('')
      return
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000)
      const timeRemaining = cooldownUntil - now

      if (timeRemaining <= 0) {
        setAvailableTime('')
        return
      }

      // Calculate the actual time when it will be available
      const availableDate = new Date(cooldownUntil * 1000)
      const timeString = availableDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
      
      setAvailableTime(`Available at ${timeString}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [cooldownUntil])
  
  // Find the most constrained window (for display)
  const displayWindow = windowUsages.length > 0 
    ? windowUsages.reduce((most, current) => 
        current.percentage > most.percentage ? current : most
      )
    : null
  
  // Calculate progress percentage based on the most constrained window
  const progressPercentage = displayWindow 
    ? Math.min((displayWindow.used / (displayWindow.window.quota + overdraft)) * 100, 100)
    : 0
  
  // Color mapping - force red during cooldown
  const getProgressColor = () => {
    if (cooldownUntil) {
      return '#f44336' // Always red during cooldown
    }
    switch (color) {
      case 'green': return '#4caf50'
      case 'yellow': return '#ff9800'
      case 'red': return '#f44336'
      default: return '#4caf50'
    }
  }
  
  // Background color for the bar container - force red during cooldown
  const getBarBackgroundColor = () => {
    if (cooldownUntil) {
      return 'rgba(244, 67, 54, 0.1)' // Always red during cooldown
    }
    switch (color) {
      case 'green': return 'rgba(76, 175, 80, 0.1)'
      case 'yellow': return 'rgba(255, 152, 0, 0.1)'
      case 'red': return 'rgba(244, 67, 54, 0.1)'
      default: return 'rgba(76, 175, 80, 0.1)'
    }
  }
  
  const getStatusText = () => {
    if (cooldownUntil) {
      return availableTime || 'Limit Reached'
    }
    switch (color) {
      case 'green': return 'Good'
      case 'yellow': return 'Warning'
      case 'red': 
        if (availableTime) {
          return availableTime
        }
        return 'Limit Reached'
      default: return 'Good'
    }
  }
  
  // Tooltip with detailed usage info
  const getTooltipContent = () => {
    if (!displayWindow) return ''
    
    if (windowUsages.length === 1) {
      // Single window - show detailed info
      const { used, window } = displayWindow
      return `${used}/${window.quota} images used (${window.label})`
    }
    
    // Multiple windows - show all constraints
    return windowUsages.map(w => 
      `${w.window.label}: ${w.used}/${w.window.quota} (${Math.round(w.percentage)}%)`
    ).join('\n')
  }

  return (
    <Box
      onClick={onUsageClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.25,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: onUsageClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': onUsageClick ? {
          transform: 'translateY(-1px)',
          boxShadow: '0 6px 25px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.2)',
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          transition: 'left 0.5s',
        },
        '&:hover::before': onUsageClick ? {
          left: '100%',
        } : {},
        minWidth: 180,
        height: 40
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Tooltip title={<pre style={{ margin: 0, fontSize: '0.75rem' }}>{getTooltipContent()}</pre>} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'help' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                {tierName} Tier
              </Typography>
              <Info sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }} />
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ 
              fontWeight: 600, 
              color: availableTime ? '#ff6b6b' : getProgressColor(),
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              animation: availableTime ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 }
              }
            }}>
              {getStatusText()}
            </Typography>
            {onReset && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onReset()
                }}
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  '&:hover': {
                    color: 'rgba(255,255,255,0.9)',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  },
                  padding: '2px',
                  minWidth: 'auto',
                  width: '20px',
                  height: '20px'
                }}
              >
                <Refresh sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            )}
          </Box>
        </Box>
        
        <Box sx={{ position: 'relative' }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 5,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${getProgressColor()}, ${getProgressColor()}CC)`,
                borderRadius: 2,
                boxShadow: `0 0 8px ${getProgressColor()}40`
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
