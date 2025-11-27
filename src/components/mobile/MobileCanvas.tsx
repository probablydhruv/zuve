'use client'

import { useState, useRef } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import ImageUploader from './ImageUploader'
import ActionButtons from './ActionButtons'
import TextInputBar from './TextInputBar'
import SwipeUpPanel from './SwipeUpPanel'

// Mobile-specific state types
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

export default function MobileCanvas() {
  const theme = useTheme()
  
  // Mobile canvas state
  const [state, setState] = useState<MobileCanvasState>({
    uploadedImage: null,
    imagePreview: null,
    promptText: '',
    selectedStones: { primary: '', secondary: '' },
    selectedMetal: '',
    selectedStyle: 'Festive',
    selectedRegion: 'Global',
    contentDetails: '',
    signatureStyles: [],
    isSwipePanelOpen: false
  })

  const updateState = (updates: Partial<MobileCanvasState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const handleImageUpload = (file: File | null, preview: string | null) => {
    updateState({ uploadedImage: file, imagePreview: preview })
  }

  const handleGenerateJewellery = () => {
    console.log('Generate Jewellery clicked', {
      image: state.uploadedImage,
      prompt: state.promptText,
      stones: state.selectedStones,
      metal: state.selectedMetal
    })
    // TODO: Implement AI generation
  }

  const handleHarmonize = () => {
    console.log('Harmonize clicked', { image: state.uploadedImage })
    // TODO: Implement harmonization
  }

  const handleStoneSelector = () => {
    console.log('Stone Selector clicked')
    // TODO: Open stone selection modal
  }

  const handleMetalSelector = () => {
    console.log('Metal Selector clicked')
    // TODO: Open metal selection modal
  }

  const handleDownload = () => {
    console.log('Download clicked')
    // TODO: Implement download functionality
  }

  const handleRefresh = () => {
    console.log('Refresh clicked')
    // TODO: Implement refresh functionality
  }

  const handlePromptSubmit = (prompt: string) => {
    updateState({ promptText: prompt })
    handleGenerateJewellery()
  }

  const toggleSwipePanel = () => {
    updateState({ isSwipePanelOpen: !state.isSwipePanelOpen })
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        overflow: 'hidden',
        position: 'relative',
        // Responsive breakpoints
        [theme.breakpoints.down('sm')]: {
          // Small phones (320px - 600px)
          padding: '8px',
        },
        [theme.breakpoints.between('sm', 'md')]: {
          // Large phones (600px - 900px)
          padding: '12px',
        },
        [theme.breakpoints.up('md')]: {
          // Tablets and larger (900px+)
          padding: '16px',
        }
      }}
    >

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: {
            xs: '8px',   // Small phones
            sm: '12px',  // Large phones
            md: '16px'   // Tablets and larger
          },
          overflow: 'hidden'
        }}
      >
        {/* Image Upload Area (responsive height) */}
        <Box sx={{ 
          flex: {
            xs: '0 0 60%',  // Small phones - more space for buttons
            sm: '0 0 65%',  // Large phones
            md: '0 0 70%'   // Tablets - more space for image
          }
        }}>
          <ImageUploader
            onImageUpload={handleImageUpload}
            imagePreview={state.imagePreview}
            uploadedImage={state.uploadedImage}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ flex: '0 0 auto' }}>
          <ActionButtons
            onGenerateJewellery={handleGenerateJewellery}
            onHarmonize={handleHarmonize}
            onStoneSelector={handleStoneSelector}
            onMetalSelector={handleMetalSelector}
            onDownload={handleDownload}
            onRefresh={handleRefresh}
            hasImage={!!state.uploadedImage}
          />
        </Box>
      </Box>

      {/* Bottom Text Input Bar */}
      <TextInputBar
        onSubmit={handlePromptSubmit}
        onSwipeUp={toggleSwipePanel}
        placeholder="Describe your jewellery design..."
      />

      {/* Swipe Up Panel */}
      <SwipeUpPanel
        isOpen={state.isSwipePanelOpen}
        onClose={() => updateState({ isSwipePanelOpen: false })}
        state={state}
        updateState={updateState}
      />
    </Box>
  )
}
