'use client'

import { useState, useRef, useEffect } from 'react'
import { Box, TextField, IconButton, useTheme } from '@mui/material'
import { Send, KeyboardArrowUp } from '@mui/icons-material'

interface TextInputBarProps {
  onSubmit: (prompt: string) => void
  onSwipeUp: () => void
  placeholder?: string
}

export default function TextInputBar({ onSubmit, onSwipeUp, placeholder = "Describe your jewellery design..." }: TextInputBarProps) {
  const theme = useTheme()
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const textFieldRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim())
      setText('')
      setIsExpanded(false)
      textFieldRef.current?.blur()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    setIsExpanded(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (!text.trim()) {
      setIsExpanded(false)
    }
  }

  const handleSwipeUpClick = () => {
    onSwipeUp()
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: {
          xs: '32px',  // Small phones
          sm: '36px',  // Large phones
          md: '40px'   // Tablets and larger
        },
        borderTopRightRadius: {
          xs: '32px',  // Small phones
          sm: '36px',  // Large phones
          md: '40px'   // Tablets and larger
        },
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        padding: {
          xs: '12px',  // Small phones
          sm: '14px',  // Large phones
          md: '16px'   // Tablets and larger
        },
        paddingBottom: {
          xs: 'max(12px, env(safe-area-inset-bottom))',  // Small phones
          sm: 'max(14px, env(safe-area-inset-bottom))',  // Large phones
          md: 'max(16px, env(safe-area-inset-bottom))'   // Tablets and larger
        },
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isExpanded ? 'translateY(0)' : 'translateY(0)',
      }}
    >
      {/* Swipe Handle */}
      <Box
        onClick={handleSwipeUpClick}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '24px',
          cursor: 'pointer',
          marginBottom: {
            xs: '8px',   // Small phones
            sm: '10px',  // Large phones
            md: '12px'   // Tablets and larger
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px'
          }
        }}
      >
        <KeyboardArrowUp 
          sx={{ 
            fontSize: {
              xs: '18px',  // Small phones
              sm: '19px',  // Large phones
              md: '20px'   // Tablets and larger
            },
            color: 'rgba(255, 255, 255, 0.7)'
          }} 
        />
      </Box>

      {/* Text Input Area */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: {
            xs: '8px',   // Small phones
            sm: '10px',  // Large phones
            md: '12px'   // Tablets and larger
          },
          transition: 'all 0.3s ease'
        }}
      >
        <TextField
          ref={textFieldRef}
          multiline
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          variant="outlined"
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              minHeight: isExpanded ? {
                xs: '70px',  // Small phones
                sm: '75px',  // Large phones
                md: '80px'   // Tablets and larger
              } : {
                xs: '40px',  // Small phones
                sm: '44px',  // Large phones
                md: '48px'   // Tablets and larger
              },
              maxHeight: isExpanded ? {
                xs: '100px', // Small phones
                sm: '110px', // Large phones
                md: '120px'  // Tablets and larger
              } : {
                xs: '40px',  // Small phones
                sm: '44px',  // Large phones
                md: '48px'   // Tablets and larger
              },
              '& fieldset': {
                borderColor: isFocused 
                  ? 'rgba(255, 255, 255, 0.5)' 
                  : 'rgba(255, 255, 255, 0.2)',
                borderWidth: isFocused ? '2px' : '1px',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.6)',
                borderWidth: '2px',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: {
                xs: '0.85rem', // Small phones
                sm: '0.87rem', // Large phones
                md: '0.9rem'   // Tablets and larger
              },
              lineHeight: 1.4,
              padding: isExpanded ? {
                xs: '10px 12px', // Small phones
                sm: '11px 14px', // Large phones
                md: '12px 16px'  // Tablets and larger
              } : {
                xs: '10px 12px', // Small phones
                sm: '11px 14px', // Large phones
                md: '12px 16px'  // Tablets and larger
              },
              color: 'white',
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.6)',
                opacity: 1,
                fontSize: {
                  xs: '0.85rem', // Small phones
                  sm: '0.87rem', // Large phones
                  md: '0.9rem'   // Tablets and larger
                }
              }
            }
          }}
        />

        <IconButton
          onClick={handleSubmit}
          disabled={!text.trim()}
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
            backgroundColor: text.trim() 
              ? 'rgba(255, 255, 255, 0.9)' 
              : 'rgba(255, 255, 255, 0.1)',
            color: text.trim() ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.4)',
            border: text.trim() 
              ? '1px solid rgba(255, 255, 255, 0.3)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: text.trim() 
                ? 'rgba(255, 255, 255, 1)' 
                : 'rgba(255, 255, 255, 0.2)',
              transform: text.trim() ? 'scale(1.05)' : 'none',
            },
            '&:active': {
              transform: text.trim() ? 'scale(0.95)' : 'none',
            },
            '&:disabled': {
              opacity: 0.6,
              cursor: 'not-allowed',
              transform: 'none',
              '&:hover': {
                transform: 'none'
              }
            }
          }}
        >
          <Send fontSize="small" />
        </IconButton>
      </Box>

      {/* Character Count (when expanded) */}
      {isExpanded && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', gap: '16px' }}>
            <Box
              sx={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.9)'
                }
              }}
            >
              💡 Tips
            </Box>
            <Box
              sx={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.9)'
                }
              }}
            >
              📝 Examples
            </Box>
          </Box>
          <Box
            sx={{
              fontSize: '0.75rem',
              color: text.length > 200 ? 'rgba(255, 193, 7, 0.8)' : 'rgba(255, 255, 255, 0.7)'
            }}
          >
            {text.length}/500
          </Box>
        </Box>
      )}
    </Box>
  )
}
