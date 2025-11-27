'use client'

import { useState } from 'react'
import { 
  Box, 
  Typography, 
  IconButton, 
  Button, 
  TextField, 
  Menu, 
  MenuItem, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  useTheme,
  Slide,
  Backdrop
} from '@mui/material'
import { 
  Close, 
  KeyboardArrowDown, 
  Add, 
  Delete, 
  Palette,
  Diamond,
  Settings,
  ContentCopy,
  AutoFixHigh
} from '@mui/icons-material'

interface MobileCanvasState {
  uploadedImage: File | null
  imagePreview: string | null
  promptText: string
  selectedStones: { primary: string; secondary: string }
  selectedMetal: string
  selectedStyle: string
  selectedRegion: string
  contentDetails: string
  signatureStyles: File[]
  isSwipePanelOpen: boolean
}

interface SwipeUpPanelProps {
  isOpen: boolean
  onClose: () => void
  state: MobileCanvasState
  updateState: (updates: Partial<MobileCanvasState>) => void
}

const STYLES = [
  'Festive',
  'Minimal', 
  'Offer',
  'Creative'
]

const REGIONS = [
  'Global',
  'India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
]

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

export default function SwipeUpPanel({ isOpen, onClose, state, updateState }: SwipeUpPanelProps) {
  const theme = useTheme()
  const [styleAnchor, setStyleAnchor] = useState<null | HTMLElement>(null)
  const [regionAnchor, setRegionAnchor] = useState<null | HTMLElement>(null)
  const [stoneAnchor, setStoneAnchor] = useState<null | HTMLElement>(null)
  const [metalAnchor, setMetalAnchor] = useState<null | HTMLElement>(null)

  const handleStyleSelect = (style: string) => {
    updateState({ selectedStyle: style })
    setStyleAnchor(null)
  }

  const handleRegionSelect = (region: string) => {
    updateState({ selectedRegion: region })
    setRegionAnchor(null)
  }

  const handleStoneSelect = (stone: string, type: 'primary' | 'secondary') => {
    updateState({ 
      selectedStones: { 
        ...state.selectedStones, 
        [type]: stone 
      } 
    })
    setStoneAnchor(null)
  }

  const handleMetalSelect = (metal: string) => {
    updateState({ selectedMetal: metal })
    setMetalAnchor(null)
  }

  const handleSignatureStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      updateState({ 
        signatureStyles: [...state.signatureStyles, ...files].slice(0, 4) // Max 4
      })
    }
  }

  const removeSignatureStyle = (index: number) => {
    const newStyles = state.signatureStyles.filter((_, i) => i !== index)
    updateState({ signatureStyles: newStyles })
  }

  const handleContentGenerate = () => {
    console.log('Generate Content clicked', {
      style: state.selectedStyle,
      region: state.selectedRegion,
      contentDetails: state.contentDetails
    })
    // TODO: Implement content generation
  }

  return (
    <>
      <Backdrop
        open={isOpen}
        onClick={onClose}
        sx={{
          zIndex: 1200,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)'
        }}
      />
      
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '85vh',
            backgroundColor: '#1a1a1a',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              flexShrink: 0
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
              Advanced Features
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Content */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              padding: '20px'
            }}
          >
            {/* Content Builder Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Content Builder
              </Typography>
              
              {/* Style and Region Dropdowns */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={(e) => setStyleAnchor(e.currentTarget)}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    py: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Style: {state.selectedStyle}
                </Button>
                <Button
                  variant="outlined"
                  onClick={(e) => setRegionAnchor(e.currentTarget)}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    py: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Region: {state.selectedRegion}
                </Button>
              </Box>
              
              {/* Content Details */}
              <TextField
                multiline
                rows={3}
                value={state.contentDetails}
                onChange={(e) => updateState({ contentDetails: e.target.value })}
                placeholder="Enter content details and context for your jewelry design..."
                variant="outlined"
                size="small"
                sx={{
                  width: '100%',
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.9rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.6)',
                      opacity: 1
                    }
                  }
                }}
              />
              
              {/* Generate Content Button */}
              <Button
                variant="contained"
                onClick={handleContentGenerate}
                disabled={!state.contentDetails.trim()}
                startIcon={<AutoFixHigh sx={{ color: state.contentDetails.trim() ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 0.9)' }} />}
                sx={{
                  width: '100%',
                  background: state.contentDetails.trim() 
                    ? 'rgba(255, 255, 255, 0.9)'
                    : 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: state.contentDetails.trim() 
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  py: 1.5,
                  boxShadow: state.contentDetails.trim() 
                    ? '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  color: state.contentDetails.trim() ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    background: state.contentDetails.trim() 
                      ? 'rgba(255, 255, 255, 1)'
                      : 'rgba(255, 255, 255, 0.3)',
                    border: state.contentDetails.trim() 
                      ? '1px solid rgba(255, 255, 255, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: state.contentDetails.trim() 
                      ? '0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                      : '0 4px 16px rgba(0, 0, 0, 0.1)',
                    transform: state.contentDetails.trim() ? 'translateY(-2px)' : 'none',
                  },
                  '&:active': {
                    background: state.contentDetails.trim() ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.25)',
                  },
                  '&:disabled': {
                    opacity: 0.4,
                    cursor: 'not-allowed',
                    transform: 'none',
                    '&:hover': {
                      transform: 'none'
                    }
                  }
                }}
              >
                Generate Content
              </Button>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Signature Style Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Signature Style
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {state.signatureStyles.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Signature style ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeSignatureStyle(index)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: theme.palette.error.main,
                        color: 'white',
                        width: '20px',
                        height: '20px',
                        '&:hover': {
                          backgroundColor: theme.palette.error.dark
                        }
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                
                {state.signatureStyles.length < 4 && (
                  <Box
                    component="label"
                    sx={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      border: '2px dashed rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  >
                    <Add sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleSignatureStyleUpload}
                      style={{ display: 'none' }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Stone and Metal Selectors */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Material Selection
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={(e) => setStoneAnchor(e.currentTarget)}
                  startIcon={<Diamond />}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    py: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Stones
                </Button>
                <Button
                  variant="outlined"
                  onClick={(e) => setMetalAnchor(e.currentTarget)}
                  startIcon={<Settings />}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    py: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Metal
                </Button>
              </Box>

              {/* Selected Materials Display */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {state.selectedStones.primary && (
                  <Chip
                    label={`Primary: ${STONES.find(s => s.key === state.selectedStones.primary)?.label}`}
                    size="small"
                    onDelete={() => updateState({ selectedStones: { ...state.selectedStones, primary: '' } })}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          color: 'white'
                        }
                      }
                    }}
                  />
                )}
                {state.selectedStones.secondary && (
                  <Chip
                    label={`Secondary: ${STONES.find(s => s.key === state.selectedStones.secondary)?.label}`}
                    size="small"
                    onDelete={() => updateState({ selectedStones: { ...state.selectedStones, secondary: '' } })}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          color: 'white'
                        }
                      }
                    }}
                  />
                )}
                {state.selectedMetal && (
                  <Chip
                    label={`Metal: ${METALS.find(m => m.key === state.selectedMetal)?.label}`}
                    size="small"
                    onDelete={() => updateState({ selectedMetal: '' })}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          color: 'white'
                        }
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Slide>

      {/* Menus */}
      <Menu 
        anchorEl={styleAnchor} 
        open={Boolean(styleAnchor)} 
        onClose={() => setStyleAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        }}
      >
        {STYLES.map(style => (
          <MenuItem 
            key={style} 
            onClick={() => handleStyleSelect(style)}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {style}
          </MenuItem>
        ))}
      </Menu>

      <Menu 
        anchorEl={regionAnchor} 
        open={Boolean(regionAnchor)} 
        onClose={() => setRegionAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        }}
      >
        {REGIONS.map(region => (
          <MenuItem 
            key={region} 
            onClick={() => handleRegionSelect(region)}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {region}
          </MenuItem>
        ))}
      </Menu>

      <Menu 
        anchorEl={stoneAnchor} 
        open={Boolean(stoneAnchor)} 
        onClose={() => setStoneAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        }}
      >
        <MenuItem 
          onClick={() => handleStoneSelect('', 'primary')}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white' }}>Primary Stone</Typography>
        </MenuItem>
        {STONES.map(stone => (
          <MenuItem 
            key={`primary-${stone.key}`} 
            onClick={() => handleStoneSelect(stone.key, 'primary')}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {stone.icon} {stone.label}
          </MenuItem>
        ))}
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem 
          onClick={() => handleStoneSelect('', 'secondary')}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'white' }}>Secondary Stone</Typography>
        </MenuItem>
        {STONES.map(stone => (
          <MenuItem 
            key={`secondary-${stone.key}`} 
            onClick={() => handleStoneSelect(stone.key, 'secondary')}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {stone.icon} {stone.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu 
        anchorEl={metalAnchor} 
        open={Boolean(metalAnchor)} 
        onClose={() => setMetalAnchor(null)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        }}
      >
        {METALS.map(metal => (
          <MenuItem 
            key={metal.key} 
            onClick={() => handleMetalSelect(metal.key)}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {metal.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
