'use client'

import { Box, Button, useTheme, Menu, MenuItem, Typography, IconButton } from '@mui/material'
import { 
  AutoFixHigh, 
  Palette, 
  Diamond, 
  Settings,
  Star,
  ColorLens,
  DiamondOutlined,
  Build,
  Tune,
  Download,
  Refresh
} from '@mui/icons-material'
import { useState } from 'react'

interface ActionButtonsProps {
  onGenerateJewellery: () => void
  onHarmonize: () => void
  onStoneSelector: () => void
  onMetalSelector: () => void
  onDownload: () => void
  onRefresh: () => void
  hasImage: boolean
}

const STONES = [
  { key: 'none', label: 'None', icon: '⚪' },
  { key: 'diamond', label: 'Diamond', icon: '💎' },
  { key: 'ruby', label: 'Ruby', icon: '🔴' },
  { key: 'sapphire', label: 'Sapphire', icon: '🔵' },
  { key: 'emerald', label: 'Emerald', icon: '🟢' },
  { key: 'amethyst', label: 'Amethyst', icon: '🟣' },
  { key: 'pearl', label: 'Pearl', icon: '⚪' },
]

const METALS = [
  { key: 'yellow_gold', label: 'Yellow Gold' },
  { key: 'white_gold', label: 'White Gold' },
  { key: 'rose_gold', label: 'Rose Gold' },
  { key: 'silver', label: 'Silver' },
]

export default function ActionButtons({
  onGenerateJewellery,
  onHarmonize,
  onStoneSelector,
  onMetalSelector,
  onDownload,
  onRefresh,
  hasImage
}: ActionButtonsProps) {
  const theme = useTheme()
  const [stoneAnchor, setStoneAnchor] = useState<null | HTMLElement>(null)
  const [metalAnchor, setMetalAnchor] = useState<null | HTMLElement>(null)
  const [selectedStone, setSelectedStone] = useState('none')
  const [selectedMetal, setSelectedMetal] = useState('yellow_gold')

  const handleStoneSelect = (stoneKey: string) => {
    setSelectedStone(stoneKey)
    setStoneAnchor(null)
    onStoneSelector()
  }

  const handleMetalSelect = (metalKey: string) => {
    setSelectedMetal(metalKey)
    setMetalAnchor(null)
    onMetalSelector()
  }

  const selectedStoneData = STONES.find(s => s.key === selectedStone) || STONES[0]
  const selectedMetalData = METALS.find(m => m.key === selectedMetal) || METALS[0]

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: {
          xs: '8px',   // Small phones
          sm: '10px',  // Large phones
          md: '12px'   // Tablets and larger
        },
        width: '100%'
      }}
    >
      {/* First Row: Generate and Harmonize */}
      <Box sx={{ 
        display: 'flex', 
        gap: {
          xs: '8px',   // Small phones
          sm: '10px',  // Large phones
          md: '12px'   // Tablets and larger
        }, 
        width: '100%' 
      }}>
        {/* Generate Jewellery Button (Prominent) */}
        <Button
          variant="contained"
          onClick={onGenerateJewellery}
          disabled={!hasImage}
          sx={{
            flex: 1,
            height: {
              xs: '48px',  // Small phones
              sm: '52px',  // Large phones
              md: '56px'   // Tablets and larger
            },
            borderRadius: {
              xs: '16px',  // Small phones
              sm: '18px',  // Large phones
              md: '20px'   // Tablets and larger
            },
            textTransform: 'none',
            fontWeight: 700,
            fontSize: {
              xs: '0.8rem',  // Small phones
              sm: '0.85rem', // Large phones
              md: '0.9rem'   // Tablets and larger
            },
            letterSpacing: '0.5px',
            background: hasImage 
              ? 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)'
              : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
            border: 'none',
            color: hasImage ? 'white' : theme.palette.text.disabled,
            boxShadow: hasImage 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: hasImage 
                ? 'linear-gradient(135deg, #1a252f 0%, #000000 100%)'
                : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
              boxShadow: hasImage 
                ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                : '0 4px 16px rgba(0, 0, 0, 0.1)',
              transform: hasImage ? 'translateY(-2px)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:active': {
              transform: hasImage ? 'translateY(0px)' : 'none',
              boxShadow: hasImage ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.1)',
            },
            '&:disabled': {
              opacity: 0.4,
              cursor: 'not-allowed',
              transform: 'none',
              '&:hover': {
                transform: 'none'
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transition: 'left 0.5s',
            },
            '&:hover::before': {
              left: hasImage ? '100%' : '-100%',
            }
          }}
        >
          Generate
        </Button>

        {/* Harmonize Button */}
        <Button
          variant="outlined"
          onClick={onHarmonize}
          disabled={!hasImage}
          sx={{
            flex: 1,
            height: {
              xs: '48px',  // Small phones
              sm: '52px',  // Large phones
              md: '56px'   // Tablets and larger
            },
            borderRadius: {
              xs: '16px',  // Small phones
              sm: '18px',  // Large phones
              md: '20px'   // Tablets and larger
            },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: {
              xs: '0.75rem', // Small phones
              sm: '0.8rem',  // Large phones
              md: '0.8rem'   // Tablets and larger
            },
            letterSpacing: '0.3px',
            background: hasImage 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(10px)',
            border: hasImage 
              ? '1px solid rgba(0,0,0,0.1)' 
              : '1px solid rgba(0,0,0,0.05)',
            color: hasImage ? 'text.primary' : theme.palette.text.disabled,
            boxShadow: hasImage 
              ? '0 8px 32px rgba(0,0,0,0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: hasImage 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
              border: hasImage 
                ? '1px solid rgba(0,0,0,0.15)' 
                : '1px solid rgba(0,0,0,0.08)',
              transform: hasImage ? 'translateY(-2px)' : 'none',
              boxShadow: hasImage 
                ? '0 12px 40px rgba(0,0,0,0.15)'
                : '0 4px 12px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:active': {
              transform: hasImage ? 'translateY(0px)' : 'none',
              boxShadow: hasImage ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
            },
            '&:disabled': {
              opacity: 0.4,
              cursor: 'not-allowed',
              transform: 'none',
              '&:hover': {
                transform: 'none'
              }
            },
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
            '&:hover::before': {
              left: hasImage ? '100%' : '-100%',
            }
          }}
        >
          Harmonize
        </Button>
      </Box>

      {/* Second Row: Stone, Metal Selectors and Action Icons */}
      <Box sx={{ 
        display: 'flex', 
        gap: {
          xs: '6px',   // Small phones
          sm: '7px',   // Large phones
          md: '8px'    // Tablets and larger
        }, 
        width: '100%', 
        alignItems: 'center' 
      }}>
        {/* Stone Selector Button */}
        <Button
          variant="outlined"
          onClick={(e) => setStoneAnchor(e.currentTarget)}
          startIcon={<DiamondOutlined sx={{ 
            fontSize: {
              xs: '14px',  // Small phones
              sm: '15px',  // Large phones
              md: '16px'   // Tablets and larger
            }
          }} />}
          sx={{
            flex: 1,
            height: {
              xs: '40px',  // Small phones
              sm: '44px',  // Large phones
              md: '48px'   // Tablets and larger
            },
            borderRadius: {
              xs: '12px',  // Small phones
              sm: '14px',  // Large phones
              md: '16px'   // Tablets and larger
            },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: {
              xs: '0.7rem',  // Small phones
              sm: '0.72rem', // Large phones
              md: '0.75rem'  // Tablets and larger
            },
            letterSpacing: '0.3px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.1)',
            color: 'text.primary',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
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
            '&:hover::before': {
              left: '100%',
            }
          }}
        >
          {selectedStoneData.label}
        </Button>

        {/* Metal Selector Button */}
        <Button
          variant="outlined"
          onClick={(e) => setMetalAnchor(e.currentTarget)}
          startIcon={<Build sx={{ 
            fontSize: {
              xs: '14px',  // Small phones
              sm: '15px',  // Large phones
              md: '16px'   // Tablets and larger
            }
          }} />}
          sx={{
            flex: 1,
            height: {
              xs: '40px',  // Small phones
              sm: '44px',  // Large phones
              md: '48px'   // Tablets and larger
            },
            borderRadius: {
              xs: '12px',  // Small phones
              sm: '14px',  // Large phones
              md: '16px'   // Tablets and larger
            },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: {
              xs: '0.7rem',  // Small phones
              sm: '0.72rem', // Large phones
              md: '0.75rem'  // Tablets and larger
            },
            letterSpacing: '0.3px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.1)',
            color: 'text.primary',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
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
            '&:hover::before': {
              left: '100%',
            }
          }}
        >
          {selectedMetalData.label}
        </Button>

        {/* Download Icon Button */}
        <IconButton
          onClick={onDownload}
          sx={{
            width: {
              xs: '40px',  // Small phones
              sm: '44px',  // Large phones
              md: '48px'   // Tablets and larger
            },
            height: {
              xs: '40px',  // Small phones
              sm: '44px',  // Large phones
              md: '48px'   // Tablets and larger
            },
            borderRadius: {
              xs: '12px',  // Small phones
              sm: '14px',  // Large phones
              md: '16px'   // Tablets and larger
            },
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.1)',
            color: 'text.primary',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
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
            '&:hover::before': {
              left: '100%',
            }
          }}
        >
          <Download sx={{ 
            fontSize: {
              xs: '18px',  // Small phones
              sm: '19px',  // Large phones
              md: '20px'   // Tablets and larger
            }
          }} />
        </IconButton>

        {/* Refresh Icon Button */}
        <IconButton
          onClick={onRefresh}
          sx={{
            width: {
              xs: '40px',  // Small phones
              sm: '44px',  // Large phones
              md: '48px'   // Tablets and larger
            },
            height: {
              xs: '40px',  // Small phones
              sm: '44px',  // Large phones
              md: '48px'   // Tablets and larger
            },
            borderRadius: {
              xs: '12px',  // Small phones
              sm: '14px',  // Large phones
              md: '16px'   // Tablets and larger
            },
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0,0,0,0.1)',
            color: 'text.primary',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              border: '1px solid rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
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
            '&:hover::before': {
              left: '100%',
            }
          }}
        >
          <Refresh sx={{ 
            fontSize: {
              xs: '18px',  // Small phones
              sm: '19px',  // Large phones
              md: '20px'   // Tablets and larger
            }
          }} />
        </IconButton>
      </Box>

      {/* Stone Selection Menu */}
      <Menu
        anchorEl={stoneAnchor}
        open={Boolean(stoneAnchor)}
        onClose={() => setStoneAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            maxHeight: '300px',
            overflow: 'auto'
          }
        }}
      >
        {STONES.map((stone) => (
          <MenuItem
            key={stone.key}
            onClick={() => handleStoneSelect(stone.key)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Typography sx={{ fontSize: '18px' }}>{stone.icon}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {stone.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Metal Selection Menu */}
      <Menu
        anchorEl={metalAnchor}
        open={Boolean(metalAnchor)}
        onClose={() => setMetalAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            maxHeight: '300px',
            overflow: 'auto'
          }
        }}
      >
        {METALS.map((metal) => (
          <MenuItem
            key={metal.key}
            onClick={() => handleMetalSelect(metal.key)}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {metal.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}