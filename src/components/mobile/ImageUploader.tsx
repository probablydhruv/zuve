'use client'

import { useState, useRef } from 'react'
import { Box, Typography, IconButton, useTheme } from '@mui/material'
import { CloudUpload, CameraAlt, Delete, Crop, RotateLeft, ZoomIn } from '@mui/icons-material'

interface ImageUploaderProps {
  onImageUpload: (file: File | null, preview: string | null) => void
  imagePreview: string | null
  uploadedImage: File | null
}

export default function ImageUploader({ onImageUpload, imagePreview, uploadedImage }: ImageUploaderProps) {
  const theme = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const preview = e.target?.result as string
        onImageUpload(file, preview)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const handleGallerySelect = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    onImageUpload(null, null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: isDragging ? theme.palette.action.hover : theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.action.hover,
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!imagePreview ? handleGallerySelect : undefined}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {imagePreview ? (
        <>
          {/* Image Preview */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={imagePreview}
              alt="Uploaded jewelry sketch"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />

            {/* Image Manipulation Controls */}
            <Box
              sx={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '8px',
                padding: '4px'
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement crop functionality
                  console.log('Crop clicked')
                }}
                sx={{ color: 'white' }}
              >
                <Crop fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement rotate functionality
                  console.log('Rotate clicked')
                }}
                sx={{ color: 'white' }}
              >
                <RotateLeft fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement zoom functionality
                  console.log('Zoom clicked')
                }}
                sx={{ color: 'white' }}
              >
                <ZoomIn fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
                sx={{ color: 'white' }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </>
      ) : (
        <>
          {/* Upload Placeholder */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: {
                xs: '12px',  // Small phones
                sm: '14px',  // Large phones
                md: '16px'   // Tablets and larger
              },
              padding: {
                xs: '24px',  // Small phones
                sm: '28px',  // Large phones
                md: '32px'   // Tablets and larger
              }
            }}
          >
            <CloudUpload
              sx={{
                fontSize: {
                  xs: '40px',  // Small phones
                  sm: '44px',  // Large phones
                  md: '48px'   // Tablets and larger
                },
                color: theme.palette.text.secondary
              }}
            />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ 
                mb: 1, 
                fontWeight: 600,
                fontSize: {
                  xs: '1.1rem',  // Small phones
                  sm: '1.2rem',  // Large phones
                  md: '1.25rem'  // Tablets and larger
                }
              }}>
                Update Your Jewellery Sketch
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary', 
                mb: 2,
                fontSize: {
                  xs: '0.8rem',  // Small phones
                  sm: '0.85rem', // Large phones
                  md: '0.875rem' // Tablets and larger
                }
              }}>
                Tap to select from gallery or use camera
              </Typography>
            </Box>

            {/* Upload Options */}
            <Box
              sx={{
                display: 'flex',
                gap: {
                  xs: '12px',  // Small phones
                  sm: '14px',  // Large phones
                  md: '16px'   // Tablets and larger
                },
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <Box
                onClick={(e) => {
                  e.stopPropagation()
                  handleCameraCapture()
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: {
                    xs: '6px',   // Small phones
                    sm: '7px',   // Large phones
                    md: '8px'    // Tablets and larger
                  },
                  padding: {
                    xs: '12px',  // Small phones
                    sm: '14px',  // Large phones
                    md: '16px'   // Tablets and larger
                  },
                  borderRadius: {
                    xs: '10px',  // Small phones
                    sm: '11px',  // Large phones
                    md: '12px'   // Tablets and larger
                  },
                  backgroundColor: theme.palette.action.hover,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.action.selected,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CameraAlt sx={{ 
                  fontSize: {
                    xs: '20px',  // Small phones
                    sm: '22px',  // Large phones
                    md: '24px'   // Tablets and larger
                  }, 
                  color: theme.palette.primary.main 
                }} />
                <Typography variant="caption" sx={{ 
                  fontWeight: 500,
                  fontSize: {
                    xs: '0.7rem',  // Small phones
                    sm: '0.72rem', // Large phones
                    md: '0.75rem'  // Tablets and larger
                  }
                }}>
                  Camera
                </Typography>
              </Box>

              <Box
                onClick={(e) => {
                  e.stopPropagation()
                  handleGallerySelect()
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: {
                    xs: '6px',   // Small phones
                    sm: '7px',   // Large phones
                    md: '8px'    // Tablets and larger
                  },
                  padding: {
                    xs: '12px',  // Small phones
                    sm: '14px',  // Large phones
                    md: '16px'   // Tablets and larger
                  },
                  borderRadius: {
                    xs: '10px',  // Small phones
                    sm: '11px',  // Large phones
                    md: '12px'   // Tablets and larger
                  },
                  backgroundColor: theme.palette.action.hover,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.action.selected,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CloudUpload sx={{ 
                  fontSize: {
                    xs: '20px',  // Small phones
                    sm: '22px',  // Large phones
                    md: '24px'   // Tablets and larger
                  }, 
                  color: theme.palette.primary.main 
                }} />
                <Typography variant="caption" sx={{ 
                  fontWeight: 500,
                  fontSize: {
                    xs: '0.7rem',  // Small phones
                    sm: '0.72rem', // Large phones
                    md: '0.75rem'  // Tablets and larger
                  }
                }}>
                  Gallery
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}
