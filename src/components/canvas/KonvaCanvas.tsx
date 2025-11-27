'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Stage, Layer, Line, Image as KonvaImage, Transformer, Rect, Group, Text, Circle } from 'react-konva'
import { Box, Slider, ToggleButton, ToggleButtonGroup, Button, Divider, Typography, IconButton, Menu, MenuItem, Tooltip, List, ListItem, ListItemText, ListItemSecondaryAction, ButtonGroup, Card, CardActionArea, CardContent as MUICardContent, Drawer, Fab, TextField, Checkbox, CircularProgress, Snackbar, Alert } from '@mui/material'
import { Add, Delete, Visibility, VisibilityOff, Undo, Redo, ZoomIn, ZoomOut, PanToolAlt, Gesture, Colorize, Layers as LayersIcon, Settings, AutoFixHigh, Close, Campaign, ContentCopy, Crop, ContentCut, Info, DesignServices, SettingsSuggest, SwapHoriz, Download } from '@mui/icons-material'
import { LightMode, DarkMode } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { httpsCallable } from 'firebase/functions'
import { FirebaseError } from 'firebase/app'
import { useThemeMode } from '@/components/providers/ThemeProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import UsageBar from './UsageBar'
import { UsageData, handleRequest, getCurrentUsageStatus, TierType } from '@/lib/usageTracker'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { functions as firebaseFunctions } from '@/lib/firebaseClient'
import { getCanvasData, saveCanvasData } from '@/lib/firestore'

const STONES = [
  { key: 'none', label: 'None', icon: '⚪' },
  { key: 'diamond', label: 'Diamond', icon: '💎' },
  { key: 'ruby', label: 'Ruby', icon: '🔴' },
  { key: 'sapphire', label: 'Sapphire', icon: '🔵', hasSubmenu: true },
  { key: 'emerald', label: 'Emerald', icon: '🟢' },
  { key: 'amethyst', label: 'Amethyst', icon: '🟣' },
  { key: 'pearl', label: 'Pearl', icon: '⚪' },
]

const SAPPHIRE_VARIANTS = [
  { key: 'sapphire_blue', label: 'Blue Sapphire', icon: '🔵' },
  { key: 'sapphire_yellow', label: 'Yellow Sapphire', icon: '🟡' },
  { key: 'sapphire_pink', label: 'Pink Sapphire', icon: '🩷' },
]

const METALS = [
  { key: 'yellow_gold', label: 'Yellow Gold' },
  { key: 'white_gold', label: 'White Gold' },
  { key: 'rose_gold', label: 'Rose Gold' },
  { key: 'silver', label: 'Silver' },
]

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

type LayerItem = { id: string; name: string; visible: boolean; opacity: number }

interface KonvaCanvasProps {
  projectId: string
}

type GenerateDesignImagePayload = {
  actionType: 'generate' | 'harmonize'
  projectId: string
  promptText: string
  style?: string
  styleOptions: string[]
  harmonizeOptions: string[]
  sketchDataUrl?: string
  canvasInfluence?: number
  metalColor?: string
  primaryStone?: string
  secondaryStone?: string
  userContext?: string
}

type GenerateDesignImageResponse = {
  downloadURL?: string
  storagePath?: string
  resultId?: string
}

// Helper function to find stone details from either STONES or SAPPHIRE_VARIANTS
const findStoneDetails = (key: string) => {
  const stone = STONES.find(s => s.key === key)
  if (stone) return stone
  
  const sapphireVariant = SAPPHIRE_VARIANTS.find(s => s.key === key)
  if (sapphireVariant) return sapphireVariant
  
  return { key, label: 'None', icon: '⚪' }
}

export default function KonvaCanvas({ projectId }: KonvaCanvasProps) {
  const { user, tier } = useAuth()
  const stageRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)
  const [tool, setTool] = useState<'brush' | 'eraser' | 'hand'>('brush')
  const [size, setSize] = useState(6)
  const [color, setColor] = useState('#000000')
  const [brushOpacity, setBrushOpacity] = useState(1)
  const [lines, setLines] = useState<any[]>([])
  const isDrawing = useRef(false)
  const [zoom, setZoom] = useState(1)
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(true)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const minZoom = 0.5
  const maxZoom = 3

  // Theme management
  const { mode, toggleThemeMode } = useThemeMode()
  const theme = useTheme()
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 })
  const [isGesturing, setIsGesturing] = useState(false)
  const [rotationOverlay, setRotationOverlay] = useState<{ imageId: string; angle: number; x: number; y: number } | null>(null)
  const [canvasInfluence, setCanvasInfluence] = useState(100)
  const [currentPressure, setCurrentPressure] = useState(1)
  const [isApplePencilActive, setIsApplePencilActive] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 350, y: 12 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [uploadedImages, setUploadedImages] = useState<any[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [imageElements, setImageElements] = useState<{ [key: string]: HTMLImageElement }>({})
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [cropMode, setCropMode] = useState(false)
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDrawingCrop, setIsDrawingCrop] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectionPath, setSelectionPath] = useState<number[]>([])
  const [isDrawingSelection, setIsDrawingSelection] = useState(false)
  const [selectedArea, setSelectedArea] = useState<any[]>([])
  const [rightSidebarTab, setRightSidebarTab] = useState<'jewellery' | 'more'>('jewellery')
  // Overlay menu states
  const [jewelleryStyleAnchor, setJewelleryStyleAnchor] = useState<null | HTMLElement>(null)
  const [selectedJewelleryStyle, setSelectedJewelleryStyle] = useState<string | null>(null)
  const [harmonizeOptionsAnchor, setHarmonizeOptionsAnchor] = useState<null | HTMLElement>(null)
  const [selectedHarmonizeOptions, setSelectedHarmonizeOptions] = useState<string[]>([])
  const [activeAIAction, setActiveAIAction] = useState<'generate' | 'harmonize' | null>(null)
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null)
  const [harmonizedImageUrl, setHarmonizedImageUrl] = useState<string | null>(null)
  const [currentViewImageUrl, setCurrentViewImageUrl] = useState<string | null>(null)
  const [sketchSnapshot, setSketchSnapshot] = useState<string | null>(null)
  const [showCompareOverlay, setShowCompareOverlay] = useState(false)
  const [compareSliderValue, setCompareSliderValue] = useState(50)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  // On-canvas compare (AI render over sketch with draggable vertical bar)
  const [generatedImageElement, setGeneratedImageElement] = useState<HTMLImageElement | null>(null)
  const [showCanvasCompare, setShowCanvasCompare] = useState(false)
  const [compareX, setCompareX] = useState(0)
  const compareXRafRef = useRef<number | null>(null)
  const compareXPendingRef = useRef<number>(0)
  const isComparePointerActiveRef = useRef<boolean>(false)
  const hasAutoSwitchedRef = useRef<boolean>(false)
  const scheduleCompareXUpdate = useCallback((x: number) => {
    compareXPendingRef.current = x
    if (compareXRafRef.current == null) {
      compareXRafRef.current = requestAnimationFrame(() => {
        setCompareX(compareXPendingRef.current)
        compareXRafRef.current = null
      })
    }
  }, [])

  const isGenerateLoading = activeAIAction === 'generate'
  const isHarmonizeLoading = activeAIAction === 'harmonize'
  const isAIProcessing = activeAIAction !== null
  
  // Content Builder state
  const [selectedStyle, setSelectedStyle] = useState('Festive')
  const [selectedRegion, setSelectedRegion] = useState('Global')
  const [styleAnchor, setStyleAnchor] = useState<null | HTMLElement>(null)
  const [regionAnchor, setRegionAnchor] = useState<null | HTMLElement>(null)
  const [contentDetails, setContentDetails] = useState('')


  // Aura Assist state
  const [auraAssistActive, setAuraAssistActive] = useState(false)
  const [auraAssistPopup, setAuraAssistPopup] = useState<{ visible: boolean; text: string; position: { x: number; y: number } }>({
    visible: false,
    text: '',
    position: { x: 0, y: 0 }
  })

  // History management for undo/redo
  const [history, setHistory] = useState<any[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const maxHistorySize = 50

  // Layers state with content association
  const [layers, setLayers] = useState<LayerItem[]>([
    { id: '1', name: 'Layer 1', visible: true, opacity: 1 },
  ])
  const [activeLayerId, setActiveLayerId] = useState('1')

  // Debug active layer changes
  useEffect(() => {
    console.log('Active layer changed to:', activeLayerId)
  }, [activeLayerId])

  // Center toolbar when canvas size changes
  useEffect(() => {
    const centerX = (canvasSize.width - 300) / 2 // Approximate toolbar width is ~300px
    setToolbarPosition(prev => ({ ...prev, x: Math.max(0, centerX) }))
  }, [canvasSize.width])
  
  // Associate content with layers
  const [lineLayerMap, setLineLayerMap] = useState<{ [lineIndex: number]: string }>({})
  const [imageLayerMap, setImageLayerMap] = useState<{ [imageId: string]: string }>({})
  const [motifLayerMap, setMotifLayerMap] = useState<{ [motifId: string]: string }>({})

  // Debug layer mapping changes
  useEffect(() => {
    console.log('Image layer map updated:', imageLayerMap)
  }, [imageLayerMap])

  // Ensure all images have layer associations
  useEffect(() => {
    if (uploadedImages.length > 0) {
      const updatedImageLayerMap = { ...imageLayerMap }
      let needsUpdate = false
      
      uploadedImages.forEach(image => {
        if (!updatedImageLayerMap[image.id]) {
          updatedImageLayerMap[image.id] = activeLayerId
          needsUpdate = true
          console.log('Assigning unassigned image to active layer:', image.id, activeLayerId)
        }
      })
      
      if (needsUpdate) {
        setImageLayerMap(updatedImageLayerMap)
      }
    }
  }, [uploadedImages.length, activeLayerId]) // Removed imageLayerMap from dependencies

  // Ensure all lines have layer associations
  useEffect(() => {
    if (lines.length > 0) {
      const updatedLineLayerMap = { ...lineLayerMap }
      let needsUpdate = false
      
      lines.forEach((_, index) => {
        if (!updatedLineLayerMap[index]) {
          updatedLineLayerMap[index] = activeLayerId
          needsUpdate = true
          console.log('Assigning unassigned line to active layer:', index, activeLayerId)
        }
      })
      
      if (needsUpdate) {
        setLineLayerMap(updatedLineLayerMap)
      }
    }
  }, [lines.length, activeLayerId]) // Removed lineLayerMap from dependencies

  // AI settings (UI only)
  const [primaryStone, setPrimaryStone] = useState('none')
  const [secondaryStone, setSecondaryStone] = useState<string | null>(null)
  const [metal, setMetal] = useState(METALS[0].key)
  const [contextText, setContextText] = useState('')
  const [stoneAnchor, setStoneAnchor] = useState<null | HTMLElement>(null)
  const [stoneType, setStoneType] = useState<'primary' | 'secondary'>('primary')
  const [metalAnchor, setMetalAnchor] = useState<null | HTMLElement>(null)
  const [sapphireSubmenuAnchor, setSapphireSubmenuAnchor] = useState<null | HTMLElement>(null)


  // Mobile drawer states
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)

  // Motif Browser states
  const [motifs, setMotifs] = useState<Array<{id: string, name: string, data: string}>>([])
  const [isCreatingMotif, setIsCreatingMotif] = useState(false)
  const [motifDrawingLines, setMotifDrawingLines] = useState<number[]>([])
  const [insertedMotifs, setInsertedMotifs] = useState<any[]>([])
  const [selectedMotifId, setSelectedMotifId] = useState<string | null>(null)

  // Signature Style states
  const [signatureStyles, setSignatureStyles] = useState<Array<{id: string, name: string, url: string}>>([])

  // Usage tracking with tier support
  const [usageData, setUsageData] = useState<UsageData>(() => {
    // Initialize from localStorage or create new
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zuve-usage-data')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Ensure tier is set (default to 'free' if missing)
          if (!parsed.tier) {
            parsed.tier = 'free'
          }
          return parsed
        } catch (e) {
          console.warn('Failed to parse usage data from localStorage')
        }
      }
    }
    return { events: [], cooldownUntil: undefined, tier: 'free' }
  })
  const [usageStatus, setUsageStatus] = useState(() => getCurrentUsageStatus(usageData))
  
  // Function to change user tier (can be called when user upgrades/downgrades)
  const setUserTier = useCallback((newTier: TierType) => {
    const newUsageData = { ...usageData, tier: newTier }
    setUsageData(newUsageData)
    setUsageStatus(getCurrentUsageStatus(newUsageData))
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('zuve-usage-data', JSON.stringify(newUsageData))
    }
    
    console.log('User tier updated to:', newTier)
  }, [usageData])
  
  // Sync tier from Firebase auth when it changes
  useEffect(() => {
    if (tier && tier !== usageData.tier) {
      console.log('Syncing tier from Firebase:', tier, '(was:', usageData.tier, ')')
      setUserTier(tier)
    }
  }, [tier, usageData.tier, setUserTier])

  // Usage tracking functions
  const updateUsageStatus = useCallback(() => {
    const newStatus = getCurrentUsageStatus(usageData)
    setUsageStatus(newStatus)
    console.log('updateUsageStatus - cooldownUntil:', usageData.cooldownUntil, 'color:', newStatus.color)
  }, [usageData])

  const trackUsage = useCallback((action: 'generate' | 'harmonize') => {
    const now = Math.floor(Date.now() / 1000)
    const newUsageData = { ...usageData }
    console.log('trackUsage - before handleRequest - cooldownUntil:', newUsageData.cooldownUntil)
    const result = handleRequest(newUsageData, now, 1)
    console.log('trackUsage - after handleRequest - cooldownUntil:', newUsageData.cooldownUntil, 'color:', result.color)
    
    setUsageData(newUsageData)
    setUsageStatus(result)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('zuve-usage-data', JSON.stringify(newUsageData))
    }
    
    return result
  }, [usageData])

  const resetUsage = useCallback(() => {
    // Preserve the tier when resetting
    const newUsageData = { events: [], cooldownUntil: undefined, tier: usageData.tier || 'free' }
    setUsageData(newUsageData)
    setUsageStatus(getCurrentUsageStatus(newUsageData))
    
    // Update localStorage (don't remove, just reset events)
    if (typeof window !== 'undefined') {
      localStorage.setItem('zuve-usage-data', JSON.stringify(newUsageData))
    }
  }, [usageData.tier])

  const captureSketchSnapshot = useCallback(() => {
    try {
      if (!stageRef.current) return null
      return stageRef.current.toDataURL({ mimeType: 'image/png', pixelRatio: 2 })
    } catch (error) {
      console.warn('Failed to capture canvas snapshot', error)
      return null
    }
  }, [])

  const buildPrompt = useCallback((action: 'generate' | 'harmonize') => {
    const primaryStoneInfo = findStoneDetails(primaryStone)
    const secondaryStoneInfo = secondaryStone ? findStoneDetails(secondaryStone) : null
    const metalLabel = METALS.find(m => m.key === metal)?.label ?? metal

    if (action === 'generate') {
      const generateParts = [
        'Create a photorealistic jewellery render derived from the following sketch with the following details in mind:',
        '',
        `Ensure that the design accuracy of the render is at least of ${canvasInfluence}%.`,
        `The jewellery render should have a Primary stone: ${primaryStoneInfo.label}.`,
        secondaryStoneInfo ? `Secondary stone: ${secondaryStoneInfo.label}.` : null,
        `The jewellery render should have the metal color as: ${metalLabel}.`,
        selectedJewelleryStyle
          ? `Very importantly the following is the Design style which we need to understand and inculcate in the jewellery render based on the sketch drawn by the user: ${selectedJewelleryStyle}.`
          : null,
        `Campaign style: ${selectedStyle}.`,
        `Target region: ${selectedRegion}.`,
        contextText.trim()
          ? `This is the design Context which the user has uploaded and the user would like us to pick and be inspired by this when you make the render of their jewellery sketch: ${contextText.trim()}.`
          : null,
        contentDetails.trim()
          ? `Additional custom notes given by the user to keep in mind before you make the render: ${contentDetails.trim()}.`
          : null,
        'Deliver a high-resolution jewellery render accordingly and ensure that the background is white with subtle shadows.'
      ]

      return generateParts.filter(Boolean).join('\n')
    }

    // Harmonize prompt with dynamic options
    const harmonizeOptionsText = selectedHarmonizeOptions.length 
      ? selectedHarmonizeOptions.join(', ')
      : ''
    const intro = harmonizeOptionsText
      ? `Based on this sketch or render of a jewellery piece please maintain the same style and create the following also ${selectedHarmonizeOptions.join(', ')} as a collection on a white background with subtle shadows like a studio photography of the pieces.`
      : 'Based on this sketch or render of a jewellery piece please maintain the same style and create a harmonized collection on a white background with subtle shadows like a studio photography of the pieces.'

    const parts = [
      intro,
      `Follow the sketch with an influence of ${canvasInfluence}%.`,
      `Primary stone: ${primaryStoneInfo.label}.`,
      secondaryStoneInfo ? `Secondary stone: ${secondaryStoneInfo.label}.` : null,
      `Metal preference: ${metalLabel}.`,
      selectedJewelleryStyle ? `Design inspiration: ${selectedJewelleryStyle}.` : null,
      `Campaign style: ${selectedStyle}.`,
      `Target region: ${selectedRegion}.`,
      contextText.trim() ? `Context: ${contextText.trim()}.` : null,
      contentDetails.trim() ? `Additional notes: ${contentDetails.trim()}.` : null,
      'Deliver a high-resolution image suitable for presentation and client review.'
    ]

    return parts.filter(Boolean).join('\n')
  }, [primaryStone, secondaryStone, metal, canvasInfluence, selectedJewelleryStyle, selectedHarmonizeOptions, selectedStyle, selectedRegion, contextText, contentDetails])

  const callDesignFunction = useCallback(async (action: 'generate' | 'harmonize') => {
    if (!projectId) {
      const message = 'Missing project context. Refresh and try again.'
      setGenerationError(message)
      setSnackbar({ message, severity: 'error' })
      return
    }

    const usageResult = trackUsage(action)
    if (usageResult.allowed <= 0) {
      const message = 'Usage limit reached. Please wait before trying again.'
      setGenerationError(message)
      setSnackbar({ message, severity: 'error' })
      return
    }

    const snapshot = captureSketchSnapshot()
    if (snapshot) {
      setSketchSnapshot(snapshot)
    } else {
      setSketchSnapshot(null)
    }

    setActiveAIAction(action)
    setGenerationError(null)
    setShowCompareOverlay(false)
    setGeneratedImageElement(null)
    setShowCanvasCompare(false)
    // Reset auto-switch flag when starting a new generation
    if (action === 'generate') {
      hasAutoSwitchedRef.current = false
    }

    try {
      const callable = httpsCallable<GenerateDesignImagePayload, GenerateDesignImageResponse>(firebaseFunctions, 'generateDesignImage')
      const promptText = buildPrompt(action)
      console.log('Triggering AI action', { action, promptText })
      const response = await callable({
        actionType: action,
        projectId,
        promptText,
        style: selectedJewelleryStyle || 'Generic',
        styleOptions: selectedJewelleryStyle ? [selectedJewelleryStyle] : [],
        harmonizeOptions: selectedHarmonizeOptions,
        sketchDataUrl: snapshot ?? undefined,
        canvasInfluence,
        metalColor: metal || undefined,
        primaryStone: primaryStone || undefined,
        secondaryStone: secondaryStone || undefined,
        userContext: (contentDetails || '').trim() || undefined
      })

      const data = response.data
      if (!data?.downloadURL) {
        throw new Error('AI service returned an empty response.')
      }

      // Store image based on action type
      if (action === 'generate') {
        setRenderedImageUrl(data.downloadURL)
      } else {
        setHarmonizedImageUrl(data.downloadURL)
      }

      // Set current view: prefer harmonized if both exist, otherwise use the new one
      const newRenderedUrl = action === 'generate' ? data.downloadURL : renderedImageUrl
      const newHarmonizedUrl = action === 'harmonize' ? data.downloadURL : harmonizedImageUrl
      const nextViewUrl = newHarmonizedUrl || newRenderedUrl || data.downloadURL
      setCurrentViewImageUrl(nextViewUrl)

      setShowCompareOverlay(true)
      setCompareSliderValue(50)
      setSnackbar({
        message: action === 'generate' ? 'AI render ready.' : 'Harmonized render ready.',
        severity: 'success'
      })
      console.log('AI generation complete', { action, storagePath: data.storagePath, resultId: data.resultId })
    } catch (error) {
      console.error(`Failed to ${action} design`, error)
      let message = 'Failed to reach the AI service.'

      if (error instanceof FirebaseError) {
        const serverResponse = error.customData?.serverResponse
        if (typeof serverResponse === 'string' && serverResponse.trim()) {
          try {
            const parsed = JSON.parse(serverResponse)
            const nestedMessage = parsed?.error?.message
            if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
              message = nestedMessage.trim()
            }
          } catch {
            message = serverResponse.trim()
          }
        }
        const firebaseMessage = error.message?.replace(/^FirebaseError:\s*/i, '').trim()
        if (firebaseMessage && firebaseMessage.toLowerCase() !== 'internal') {
          message = firebaseMessage
        }
      } else if (error && typeof error === 'object') {
        const errObj = error as { message?: string; details?: unknown }
        const details = typeof errObj.details === 'string' ? errObj.details : undefined
        const rawMessage = typeof errObj.message === 'string' ? errObj.message : undefined
        if (details && details.trim()) {
          message = details.trim()
        } else if (rawMessage && rawMessage.trim() && rawMessage.trim().toLowerCase() !== 'internal') {
          message = rawMessage.trim()
        }
      }

      message = message.replace(/FirebaseError:\s*/gi, '').trim()
      if (!message) {
        message = 'Failed to reach the AI service.'
      }
      setGenerationError(message)
      setShowCompareOverlay(false)
      setSnackbar({ message, severity: 'error' })
      setShowCanvasCompare(false)
    } finally {
      setActiveAIAction(null)
    }
  }, [projectId, trackUsage, captureSketchSnapshot, buildPrompt, selectedJewelleryStyle, selectedHarmonizeOptions])

  const handleGenerateClick = useCallback(() => {
    void callDesignFunction('generate')
  }, [callDesignFunction])

  const handleHarmonizeClick = useCallback(() => {
    void callDesignFunction('harmonize')
  }, [callDesignFunction])

  const handleDownloadImage = useCallback(() => {
    if (!currentViewImageUrl) return
    
    // Create a temporary link element
    const link = document.createElement('a')
    link.href = currentViewImageUrl
    link.download = `zuve-render-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setSnackbar({
      message: 'Image downloaded successfully!',
      severity: 'success'
    })
  }, [currentViewImageUrl])

  // Motif Browser functions
  const startCreatingMotif = useCallback(() => {
    setIsCreatingMotif(true)
    setMotifDrawingLines([])
    console.log('Started creating motif')
  }, [])

  const saveMotif = useCallback(() => {
    if (motifDrawingLines.length === 0) {
      console.log('No drawing to save')
      return
    }

    const newMotif = {
      id: String(Date.now()),
      name: `Motif ${motifs.length + 1}`,
      data: JSON.stringify(motifDrawingLines)
    }
    
    setMotifs(prev => [...prev, newMotif])
    setIsCreatingMotif(false)
    setMotifDrawingLines([])
    console.log('Saved motif:', newMotif.name)
  }, [motifDrawingLines, motifs.length])

  const cancelMotifCreation = useCallback(() => {
    setIsCreatingMotif(false)
    setMotifDrawingLines([])
    console.log('Cancelled motif creation')
  }, [])

  // Signature Style functions
  const handleSignatureStyleUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('Signature style file selected:', file?.name, file?.type, file?.size)
    
    if (!file) return

    // Check maximum limit
    if (signatureStyles.length >= 4) {
      alert('Maximum of 4 signature styles allowed')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const newSignatureStyle = {
        id: `sig_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        url: imageUrl
      }
      
      setSignatureStyles(prev => [...prev, newSignatureStyle])
      console.log('Added signature style:', newSignatureStyle.name)
    }
    
    reader.readAsDataURL(file)
  }, [signatureStyles.length])

  const removeSignatureStyle = useCallback((id: string) => {
    setSignatureStyles(prev => prev.filter(style => style.id !== id))
    console.log('Removed signature style:', id)
  }, [])


  // Helper function to render motif preview
  const renderMotifPreview = useCallback((motif: {id: string, name: string, data: string}) => {
    try {
      const motifPoints = JSON.parse(motif.data) as number[]
      
      if (motifPoints.length < 4) {
        return <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          {motif.name}
        </Typography>
      }

      // Calculate bounding box for scaling
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < motifPoints.length; i += 2) {
        const x = motifPoints[i]
        const y = motifPoints[i + 1]
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }

      const boundsWidth = Math.max(1, maxX - minX)
      const boundsHeight = Math.max(1, maxY - minY)
      const BOX = 60
      const PADDING = 6
      const avail = BOX - PADDING * 2
      const scale = Math.min(avail / Math.max(boundsWidth, boundsHeight), 1)
      const offsetX = (BOX - boundsWidth * scale) / 2 - minX * scale
      const offsetY = (BOX - boundsHeight * scale) / 2 - minY * scale

      // Build SVG path with proper x,y pairs
      let pathData = ''
      for (let i = 0; i < motifPoints.length; i += 2) {
        const x = motifPoints[i] * scale + offsetX
        const y = motifPoints[i + 1] * scale + offsetY
        if (i === 0) {
          pathData = `M ${x} ${y}`
        } else {
          pathData += ` L ${x} ${y}`
        }
      }

      return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <svg
            width={BOX}
            height={BOX}
            viewBox={`0 0 ${BOX} ${BOX}`}
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              color: 'inherit'
            }}
          >
            <rect x={0} y={0} width={BOX} height={BOX} fill="transparent" />
            <path
              d={pathData}
              strokeWidth={1.5}
              fill="none"
              stroke="currentColor"
              style={{ color: 'inherit' }}
            />
          </svg>
          <Typography 
            variant="caption" 
            sx={(theme) => ({ 
              position: 'absolute', 
              bottom: 2, 
              left: 0, 
              right: 0, 
              textAlign: 'center', 
              fontSize: '0.6rem',
              fontWeight: 'bold',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
              color: theme.palette.mode === 'dark' ? '#fff' : 'inherit',
              borderRadius: 1,
              px: 0.5
            })}
          >
            {motif.name}
          </Typography>
        </Box>
      )
    } catch (error) {
      return <Typography variant="caption" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {motif.name}
      </Typography>
    }
  }, [])

  // Image upload handler
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('File selected:', file?.name, file?.type, file?.size)
    
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      const img = new Image()
      
      img.onload = () => {
        const imageId = `img_${Date.now()}`
        const newImage = {
          id: imageId,
          x: 100,
          y: 100,
          width: Math.min(img.width, 300), // Max width 300px
          height: Math.min(img.height, 300), // Max height 300px
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          originalWidth: img.width,
          originalHeight: img.height
        }
        
        console.log('Image loaded successfully:', {
          imageId,
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          src: img.src.substring(0, 50) + '...'
        })
        
        setUploadedImages(prev => [...prev, newImage])
        setImageElements(prev => ({ ...prev, [imageId]: img }))
        setImageLayerMap(prev => {
          const newMap = { ...prev, [imageId]: activeLayerId }
          console.log('Image uploaded to layer:', activeLayerId, 'Image ID:', imageId)
          return newMap
        })
        setSelectedImageId(imageId)
        
        // Automatically switch to hand tool after image upload
        setTool('hand')
      }
      
      img.onerror = (error) => {
        console.error('Failed to load image:', error)
        alert('Failed to load the selected image. Please try a different file.')
      }
      
      img.src = imageUrl
    }
    
    reader.readAsDataURL(file)
  }, [activeLayerId])

  const addGeneratedImageToCanvas = useCallback((url: string) => {
    if (!url || typeof window === 'undefined') return

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const imageId = `ai_${Date.now()}`
      const maxDimension = 420
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const width = Math.max(80, Math.round(img.width * scale))
      const height = Math.max(80, Math.round(img.height * scale))
      const positionX = Math.max(40, (canvasSize.width - width) / 2)
      const positionY = Math.max(40, (canvasSize.height - height) / 2)

      const newImage = {
        id: imageId,
        x: positionX,
        y: positionY,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        originalWidth: img.width,
        originalHeight: img.height
      }

      setUploadedImages(prev => [...prev, newImage])
      setImageElements(prev => ({ ...prev, [imageId]: img }))
      setImageLayerMap(prev => ({ ...prev, [imageId]: activeLayerId }))
      setSelectedImageId(imageId)
      setTool('hand')
      console.log('Inserted AI render on canvas', { imageId, width, height })
    }

    img.onerror = (error) => {
      console.error('Failed to load generated image for canvas', error)
      setSnackbar({ message: 'Generated image could not be added to the canvas. Please download it manually.', severity: 'error' })
    }

    img.src = url
  }, [activeLayerId, canvasSize.width, canvasSize.height, setSnackbar])

  // Remove uploaded image
  const removeImage = useCallback((imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
    setImageElements(prev => {
      const newElements = { ...prev }
      delete newElements[imageId]
      return newElements
    })
    if (selectedImageId === imageId) {
      setSelectedImageId(null)
      if (transformerRef.current) {
        transformerRef.current.nodes([])
        transformerRef.current.getLayer().batchDraw()
      }
    }
  }, [selectedImageId])

  // Remove selected image
  const removeSelectedImage = useCallback(() => {
    if (selectedImageId) {
      removeImage(selectedImageId)
    }
  }, [selectedImageId, removeImage])

  // Replicate selected image
  const replicateSelectedImage = useCallback(() => {
    if (selectedImageId) {
      const selectedImage = uploadedImages.find(img => img.id === selectedImageId)
      if (selectedImage) {
        const newImage = {
          ...selectedImage,
          id: `img_${Date.now()}`,
          x: selectedImage.x + 20, // Offset by 20px
          y: selectedImage.y + 20,
        }
        setUploadedImages(prev => [...prev, newImage])
        setImageElements(prev => ({ ...prev, [newImage.id]: imageElements[selectedImageId] }))
        setSelectedImageId(newImage.id)
      }
    }
  }, [selectedImageId, uploadedImages, imageElements])

  // Crop selected image - enable crop mode
  const cropSelectedImage = useCallback(() => {
    if (selectedImageId) {
      const selectedImage = uploadedImages.find(img => img.id === selectedImageId)
      if (selectedImage) {
        setCropMode(true)
        // Initialize crop area to cover the entire selected image
        setCropArea({
          x: selectedImage.x,
          y: selectedImage.y,
          width: selectedImage.width,
          height: selectedImage.height
        })
        console.log('Crop mode enabled - Drag the corners to adjust crop area')
      }
    }
  }, [selectedImageId, uploadedImages])

  // Apply crop to selected image
  const applyCrop = useCallback(() => {
    if (selectedImageId && cropArea) {
      const selectedImage = uploadedImages.find(img => img.id === selectedImageId)
      if (selectedImage) {
        // Calculate crop coordinates relative to the image
        const imageX = selectedImage.x
        const imageY = selectedImage.y
        const imageWidth = selectedImage.width
        const imageHeight = selectedImage.height
        
        // Convert canvas coordinates to image coordinates
        const cropX = Math.max(0, (cropArea.x - imageX) / imageWidth)
        const cropY = Math.max(0, (cropArea.y - imageY) / imageHeight)
        const cropWidth = Math.min(1, cropArea.width / imageWidth)
        const cropHeight = Math.min(1, cropArea.height / imageHeight)
        
        // Update image with crop data
        setUploadedImages(prev => 
          prev.map(img => 
            img.id === selectedImageId 
              ? { 
                  ...img, 
                  cropX, 
                  cropY, 
                  cropWidth, 
                  cropHeight,
                  x: cropArea.x,
                  y: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height
                }
              : img
          )
        )
        
        console.log('Crop applied:', { cropX, cropY, cropWidth, cropHeight })
      }
    }
    setCropMode(false)
    setCropArea(null)
  }, [selectedImageId, cropArea, uploadedImages])

  // Cancel crop mode
  const cancelCrop = useCallback(() => {
    setCropMode(false)
    setCropArea(null)
    setIsDrawingCrop(false)
  }, [])

  // Start selection mode
  const startSelectionMode = useCallback(() => {
    setSelectionMode(true)
    setSelectionPath([])
    setSelectedArea([])
    console.log('Selection mode enabled - Draw around the area you want to replicate')
  }, [])

  // Cancel selection mode
  const cancelSelection = useCallback(() => {
    setSelectionMode(false)
    setSelectionPath([])
    setSelectedArea([])
    setIsDrawingSelection(false)
  }, [])

  // Helper function to check if a point is inside a polygon (selection path)
  const isPointInPolygon = (point: { x: number; y: number }, polygon: number[]) => {
    let inside = false
    for (let i = 0, j = polygon.length - 2; i < polygon.length; j = i, i += 2) {
      const xi = polygon[i]
      const yi = polygon[i + 1]
      const xj = polygon[j]
      const yj = polygon[j + 1]
      
      if (((yi > point.y) !== (yj > point.y)) && 
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    return inside
  }

  // Check if a line intersects with the selection polygon and get selected points
  const getSelectedLinePoints = (points: number[], selectionPath: number[]) => {
    if (selectionPath.length < 6) return null // Need at least 3 points for a polygon
    
    const selectedPoints: number[] = []
    let hasSelectedPoints = false
    let lastPointInSelection = false
    
    for (let i = 0; i < points.length; i += 2) {
      const point = { x: points[i], y: points[i + 1] }
      const currentPointInSelection = isPointInPolygon(point, selectionPath)
      
      // Add point if it's in selection
      if (currentPointInSelection) {
        selectedPoints.push(points[i], points[i + 1])
        hasSelectedPoints = true
      } else if (lastPointInSelection && i > 0) {
        // If previous point was in selection but current isn't,
        // we need to find the intersection point
        const prevPoint = { x: points[i - 2], y: points[i - 1] }
        const intersection = findLinePolygonIntersection(prevPoint, point, selectionPath)
        if (intersection) {
          selectedPoints.push(intersection.x, intersection.y)
        }
      } else if (!lastPointInSelection && currentPointInSelection && i > 0) {
        // If current point is in selection but previous wasn't,
        // we need to find the intersection point
        const prevPoint = { x: points[i - 2], y: points[i - 1] }
        const intersection = findLinePolygonIntersection(prevPoint, point, selectionPath)
        if (intersection) {
          selectedPoints.push(intersection.x, intersection.y)
        }
      }
      
      lastPointInSelection = currentPointInSelection
    }
    
    return hasSelectedPoints ? selectedPoints : null
  }

  // Find intersection point between a line segment and polygon
  const findLinePolygonIntersection = (p1: { x: number; y: number }, p2: { x: number; y: number }, polygon: number[]) => {
    for (let i = 0; i < polygon.length; i += 2) {
      const p3 = { x: polygon[i], y: polygon[i + 1] }
      const p4 = { x: polygon[(i + 2) % polygon.length], y: polygon[(i + 3) % polygon.length] }
      
      const intersection = getLineIntersection(p1, p2, p3, p4)
      if (intersection) {
        return intersection
      }
    }
    return null
  }

  // Get intersection point of two line segments
  const getLineIntersection = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }, p4: { x: number; y: number }) => {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x)
    if (Math.abs(denom) < 1e-10) return null // Lines are parallel
    
    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      }
    }
    return null
  }

  // Check if an image intersects with the selection and get crop area using exact polygon
  const getImageSelectionData = (image: any, selectionPath: number[]) => {
    if (selectionPath.length < 6) return null
    
    // Check if any corner of the image is within the selection polygon
    const corners = [
      { x: image.x, y: image.y },
      { x: image.x + image.width, y: image.y },
      { x: image.x, y: image.y + image.height },
      { x: image.x + image.width, y: image.y + image.height }
    ]
    
    const cornersInSelection = corners.filter(corner => isPointInPolygon(corner, selectionPath))
    
    if (cornersInSelection.length === 0) {
      return null // No intersection
    }
    
    // If all corners are in selection, select the entire image
    if (cornersInSelection.length === 4) {
      return {
        cropX: 0,
        cropY: 0,
        cropWidth: 1,
        cropHeight: 1,
        intersectX: image.x,
        intersectY: image.y,
        intersectWidth: image.width,
        intersectHeight: image.height,
        isFullSelection: true
      }
    }
    
    // For partial selection, we'll create a mask-based approach
    // Instead of rectangular cropping, we'll store the selection polygon
    // and use it as a mask when rendering
    
    // Find the bounding box of the selection polygon
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (let i = 0; i < selectionPath.length; i += 2) {
      minX = Math.min(minX, selectionPath[i])
      minY = Math.min(minY, selectionPath[i + 1])
      maxX = Math.max(maxX, selectionPath[i])
      maxY = Math.max(maxY, selectionPath[i + 1])
    }
    
    // Check if image intersects with selection bounding box
    const imageRight = image.x + image.width
    const imageBottom = image.y + image.height
    
    if (maxX < image.x || minX > imageRight || maxY < image.y || minY > imageBottom) {
      return null // No intersection
    }
    
    // Calculate intersection area
    const intersectX = Math.max(minX, image.x)
    const intersectY = Math.max(minY, image.y)
    const intersectRight = Math.min(maxX, imageRight)
    const intersectBottom = Math.min(maxY, imageBottom)
    
    const intersectWidth = intersectRight - intersectX
    const intersectHeight = intersectBottom - intersectY
    
    // Calculate crop coordinates relative to the image
    const cropX = Math.max(0, (intersectX - image.x) / image.width)
    const cropY = Math.max(0, (intersectY - image.y) / image.height)
    const cropWidth = Math.min(1, intersectWidth / image.width)
    const cropHeight = Math.min(1, intersectHeight / image.height)
    
    return {
      cropX: Math.max(0, Math.min(1, cropX)),
      cropY: Math.max(0, Math.min(1, cropY)),
      cropWidth: Math.max(0, Math.min(1, cropWidth)),
      cropHeight: Math.max(0, Math.min(1, cropHeight)),
      intersectX,
      intersectY,
      intersectWidth,
      intersectHeight,
      isFullSelection: false,
      selectionPolygon: selectionPath, // Store the exact selection polygon
      usePolygonMask: true // Flag to use polygon masking instead of rectangular crop
    }
  }

  // Calculate convex hull of points (Graham scan algorithm)
  const getConvexHull = (points: { x: number; y: number }[]) => {
    if (points.length < 3) return points
    
    // Find the bottom-most point (and leftmost in case of tie)
    let bottom = 0
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[bottom].y || 
          (points[i].y === points[bottom].y && points[i].x < points[bottom].x)) {
        bottom = i
      }
    }
    
    // Swap with first point
    [points[0], points[bottom]] = [points[bottom], points[0]]
    
    // Sort points by polar angle with respect to bottom point
    const pivot = points[0]
    points.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x)
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x)
      return angleA - angleB
    })
    
    // Build convex hull
    const hull = [points[0], points[1]]
    
    for (let i = 2; i < points.length; i++) {
      while (hull.length > 1 && 
             crossProduct(hull[hull.length - 2], hull[hull.length - 1], points[i]) <= 0) {
        hull.pop()
      }
      hull.push(points[i])
    }
    
    return hull
  }

  // Calculate cross product of three points
  const crossProduct = (O: { x: number; y: number }, A: { x: number; y: number }, B: { x: number; y: number }) => {
    return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x)
  }

  // Apply selection and replicate content
  const applySelection = useCallback(() => {
    if (selectedArea.length > 0) {
      // Create copies of all selected content
      const newContent = selectedArea.map((item, index) => {
        if (item.type === 'line') {
          // Replicate drawn lines with offset
          return {
            ...item,
            id: `line_${Date.now()}_${index}`,
            points: item.points.map((point: number, i: number) => 
              i % 2 === 0 ? point + 30 : point + 30 // Offset by 30px
            )
          }
        } else if (item.type === 'image') {
          // Replicate uploaded images with crop data
          const newImage = {
            ...item,
            id: `img_${Date.now()}_${index}`,
            x: item.x + 30,
            y: item.y + 30,
            // Keep crop data for rendering
            cropX: item.cropX,
            cropY: item.cropY,
            cropWidth: item.cropWidth,
            cropHeight: item.cropHeight
          }
          
          // If it's a partial selection, adjust the image size
          if (item.isPartial) {
            newImage.width = item.width
            newImage.height = item.height
          }
          
          return newImage
        }
        return item
      })

      // Add replicated content to canvas
      const newLines = newContent.filter(item => item.type === 'line')
      const newImages = newContent.filter(item => item.type === 'image')
      
      if (newLines.length > 0) {
        setLines(prev => {
          const updatedLines = [...prev, ...newLines]
          // Associate new lines with active layer
          const newLineLayerMap = { ...lineLayerMap }
          newLines.forEach((_, index) => {
            newLineLayerMap[prev.length + index] = activeLayerId
          })
          setLineLayerMap(newLineLayerMap)
          return updatedLines
        })
      }
      
      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages])
        // Copy image elements and associate with active layer
        const newImageLayerMap = { ...imageLayerMap }
        newImages.forEach(img => {
          if (imageElements[img.originalId]) {
            setImageElements(prev => ({ ...prev, [img.id]: imageElements[img.originalId] }))
            newImageLayerMap[img.id] = activeLayerId
          }
        })
        setImageLayerMap(newImageLayerMap)
      }

      console.log('Selection applied - Content replicated:', newContent.length, 'items')
      console.log('Partial selections:', newContent.filter(item => item.isPartial).length)
    }
    
    // Reset selection mode
    setSelectionMode(false)
    setSelectionPath([])
    setSelectedArea([])
    setIsDrawingSelection(false)
  }, [selectedArea, imageElements])

  // Update usage status on mount and when usageData changes
  useEffect(() => {
    updateUsageStatus()
  }, [updateUsageStatus])

  // Load current view image into an HTMLImageElement for Konva and enable canvas compare
  useEffect(() => {
    if (!currentViewImageUrl || typeof window === 'undefined') {
      setGeneratedImageElement(null)
      return
    }
    
    // Clear previous image first to ensure clean switch
    setGeneratedImageElement(null)
    
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      console.log('Image loaded for currentViewImageUrl:', currentViewImageUrl)
      setGeneratedImageElement(img)
      setShowCanvasCompare(true)
      setCompareX(Math.round(canvasSize.width / 2))
    }
    img.onerror = (error) => {
      console.error('Failed to load image:', currentViewImageUrl, error)
      setSnackbar({ message: 'Failed to load image for comparison.', severity: 'error' })
    }
    img.src = currentViewImageUrl
  }, [currentViewImageUrl, canvasSize.width])

  // Auto-switch to harmonized when it becomes available (after rendered exists) - only once
  useEffect(() => {
    if (harmonizedImageUrl && renderedImageUrl && !hasAutoSwitchedRef.current && currentViewImageUrl === renderedImageUrl) {
      setCurrentViewImageUrl(harmonizedImageUrl)
      hasAutoSwitchedRef.current = true
    }
    // Reset the flag if harmonized is cleared (user starts a new generation)
    if (!harmonizedImageUrl) {
      hasAutoSwitchedRef.current = false
    }
  }, [harmonizedImageUrl, renderedImageUrl, currentViewImageUrl])

  // Ensure compare starts centered when enabled and not yet positioned
  useEffect(() => {
    if (showCanvasCompare && compareX === 0 && canvasSize.width > 0) {
      setCompareX(Math.round(canvasSize.width / 2))
    }
  }, [showCanvasCompare, compareX, canvasSize.width])

  // Load canvas data from Firestore on mount
  useEffect(() => {
    if (!user?.uid || !projectId) {
      setIsLoadingCanvas(false)
      return
    }

    const loadCanvas = async () => {
      try {
        setIsLoadingCanvas(true)
        const savedData = await getCanvasData(user.uid, projectId)
        
        if (savedData) {
          // Restore canvas state
          if (savedData.lines) setLines(savedData.lines)
          if (savedData.zoom) setZoom(savedData.zoom)
          if (savedData.canvasSize) setCanvasSize(savedData.canvasSize)
          if (savedData.layers) setLayers(savedData.layers)
          // Note: images need special handling as they need to be loaded as HTMLImageElements
          // We'll handle image restoration separately if needed
        }
      } catch (error) {
        console.error('Error loading canvas data:', error)
      } finally {
        setIsLoadingCanvas(false)
      }
    }

    loadCanvas()
  }, [user?.uid, projectId])

  // Auto-save canvas data to Firestore
  const autoSaveCanvas = useCallback(() => {
    if (!user?.uid) {
      console.warn('Cannot save canvas: User not authenticated')
      return
    }
    if (!projectId) {
      console.warn('Cannot save canvas: Project ID missing')
      return
    }
    if (isLoadingCanvas) {
      console.log('Skipping save: Canvas is still loading')
      return
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Debounce saves - wait 2 seconds after last change
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Auto-saving canvas data...', {
          linesCount: lines.length,
          imagesCount: uploadedImages.length,
          layersCount: layers.length,
          zoom,
          canvasSize
        })
        await saveCanvasData(user.uid, projectId, {
          lines,
          images: uploadedImages,
          layers,
          zoom,
          canvasSize,
        })
        console.log('Canvas auto-saved successfully')
      } catch (error: any) {
        console.error('Error auto-saving canvas:', error)
        console.error('Error details:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack
        })
      }
    }, 2000)
  }, [user?.uid, projectId, lines, uploadedImages, layers, zoom, canvasSize, isLoadingCanvas])

  // Auto-save when canvas data changes
  useEffect(() => {
    if (isLoadingCanvas) {
      return // Don't save while loading
    }
    if (!user?.uid || !projectId) {
      return
    }
    
    // Only trigger auto-save if there's actual content to save
    if (lines.length === 0 && uploadedImages.length === 0) {
      return
    }
    
    autoSaveCanvas()
  }, [lines, uploadedImages, layers, zoom, canvasSize, autoSaveCanvas, isLoadingCanvas, user?.uid, projectId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Undo/Redo functions
  const saveToHistory = useCallback((newLines: any[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push([...newLines])
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
        return newHistory
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1))
  }, [historyIndex, maxHistorySize])

  const undo = useCallback(() => {
    console.log('Undo function called, historyIndex:', historyIndex, 'history.length:', history.length)
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      console.log('Undoing to index:', newIndex)
      setHistoryIndex(newIndex)
      setLines([...history[newIndex]])
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setLines([...history[newIndex]])
    }
  }, [historyIndex, history])

  const insertMotif = useCallback((motif: {id: string, name: string, data: string}) => {
    console.log('insertMotif called with:', motif.name, 'Data:', motif.data.substring(0, 100) + '...')
    try {
      const motifPoints = JSON.parse(motif.data) as number[]
      console.log('Parsed motif points:', motifPoints.length, 'points')
      
      if (motifPoints.length === 0) {
        console.log('Motif has no drawing data')
        return
      }

      // Calculate the bounding box of the motif
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < motifPoints.length; i += 2) {
        const x = motifPoints[i]
        const y = motifPoints[i + 1]
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }

      const motifWidth = maxX - minX
      const motifHeight = maxY - minY
      const motifCenterX = (minX + maxX) / 2
      const motifCenterY = (minY + maxY) / 2

      // Calculate canvas center
      const canvasWidth = canvasSize.width
      const canvasHeight = canvasSize.height
      const canvasCenterX = canvasWidth / 2
      const canvasCenterY = canvasHeight / 2

      // Create a new motif object similar to uploaded images
      const newMotif = {
        id: `motif_${Date.now()}`,
        originalId: motif.id,
        name: motif.name,
        data: motif.data,
        x: canvasCenterX - motifWidth / 2,
        y: canvasCenterY - motifHeight / 2,
        width: Math.max(motifWidth, 50), // Minimum width
        height: Math.max(motifHeight, 50), // Minimum height
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        visible: true,
        type: 'motif'
      }

      // Save current state to history before inserting motif
      saveToHistory(lines)

      // Add the motif to the inserted motifs array
      setInsertedMotifs(prev => {
        const newMotifs = [...prev, newMotif]
        console.log('Added motif to insertedMotifs. Total motifs:', newMotifs.length)
        return newMotifs
      })
      
      // Associate motif with active layer
      setMotifLayerMap(prevMap => {
        const newMap = {
          ...prevMap,
          [newMotif.id]: activeLayerId
        }
        console.log('Associated motif with layer:', activeLayerId, 'Total motif-layer mappings:', Object.keys(newMap).length)
        return newMap
      })

      console.log('Inserted motif as image-like object:', motif.name, 'at', newMotif.x, newMotif.y, 'Total motifs:', insertedMotifs.length + 1)
    } catch (error) {
      console.error('Error inserting motif:', error)
    }
  }, [canvasSize, activeLayerId, saveToHistory])

  // Motif manipulation functions
  const removeSelectedMotif = useCallback(() => {
    if (selectedMotifId) {
      setInsertedMotifs(prev => prev.filter(motif => motif.id !== selectedMotifId))
      setMotifLayerMap(prevMap => {
        const newMap = { ...prevMap }
        delete newMap[selectedMotifId]
        return newMap
      })
      setSelectedMotifId(null)
      console.log('Removed motif:', selectedMotifId)
    }
  }, [selectedMotifId])

  const duplicateSelectedMotif = useCallback(() => {
    if (selectedMotifId) {
      const motifToDuplicate = insertedMotifs.find(motif => motif.id === selectedMotifId)
      if (motifToDuplicate) {
        const duplicatedMotif = {
          ...motifToDuplicate,
          id: `motif_${Date.now()}`,
          x: motifToDuplicate.x + 20,
          y: motifToDuplicate.y + 20
        }
        setInsertedMotifs(prev => [...prev, duplicatedMotif])
        setMotifLayerMap(prevMap => ({
          ...prevMap,
          [duplicatedMotif.id]: activeLayerId
        }))
        console.log('Duplicated motif:', motifToDuplicate.name)
      }
    }
  }, [selectedMotifId, insertedMotifs, activeLayerId])

  // Touch and Apple Pencil support
  const getPointerPosition = (e: any) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    
    // For Apple Pencil, try to get pressure and tilt information
    if (e.evt && e.evt.pointerType === 'pen') {
      const pressure = e.evt.pressure || 1
      const tiltX = e.evt.tiltX || 0
      const tiltY = e.evt.tiltY || 0
      
      return {
        x: pos.x,
        y: pos.y,
        pressure: Math.max(0.1, Math.min(1, pressure)),
        tiltX,
        tiltY,
        isApplePencil: true
      }
    }
    
    return {
      x: pos.x,
      y: pos.y,
      pressure: 1,
      tiltX: 0,
      tiltY: 0,
      isApplePencil: false
    }
  }

  const handlePointerDown = (e: any) => {
    // Prevent default to avoid scrolling on touch devices
    e.evt.preventDefault()
    
    // Ignore compare slider interactions
    const inCompareHandle = !!(
      e.target?.hasName?.('compare-handle') ||
      e.target?.getParent?.()?.hasName?.('compare-handle') ||
      e.target?.findAncestor?.((n: any) => n?.hasName && n.hasName('compare-handle'))
    )
    if (isComparePointerActiveRef.current || inCompareHandle) {
      return
    }

    // Check if we're interacting with an image - if so, don't start drawing
    if (e.target && e.target.getClassName && e.target.getClassName() === 'Image') {
      return // Don't start drawing when interacting with images
    }
    
    // Palm rejection: Only allow drawing with Apple Pencil or single touch
    const pointerType = e.evt?.pointerType
    const isPalm = e.evt?.width > 20 || e.evt?.height > 20 // Large touch area indicates palm
    
    if (isPalm) {
      return // Ignore palm touches
    }
    
    const pointerData = getPointerPosition(e)
    
    // Handle selection mode
    if (selectionMode) {
      setIsDrawingSelection(true)
      setSelectionPath([pointerData.x, pointerData.y])
      return
    }
    
    // Handle crop mode
    if (cropMode && selectedImageId) {
      const selectedImage = uploadedImages.find(img => img.id === selectedImageId)
      if (selectedImage) {
        // Constrain click to within the selected image bounds
        const imageX = selectedImage.x
        const imageY = selectedImage.y
        const imageWidth = selectedImage.width
        const imageHeight = selectedImage.height
        
        // Check if click is within image bounds
        if (pointerData.x >= imageX && pointerData.x <= imageX + imageWidth &&
            pointerData.y >= imageY && pointerData.y <= imageY + imageHeight) {
          setIsDrawingCrop(true)
          setCropArea({
            x: pointerData.x,
            y: pointerData.y,
            width: 0,
            height: 0
          })
        }
      }
      return
    }
    
    // Only allow drawing with brush and eraser tools
    if (tool !== 'brush' && tool !== 'eraser') {
      return
    }
    
    isDrawing.current = true
    
    // Update Apple Pencil status and pressure
    setIsApplePencilActive(pointerData.isApplePencil)
    setCurrentPressure(pointerData.pressure)
    
    // Calculate dynamic brush size based on pressure (for Apple Pencil)
    const pressureMultiplier = pointerData.isApplePencil ? pointerData.pressure : 1
    const dynamicSize = Math.max(1, size * pressureMultiplier)
    
    // Calculate dynamic opacity based on pressure
    const dynamicOpacity = Math.max(0.1, brushOpacity * pressureMultiplier)
    
    const newLine = { 
      tool, 
      points: [pointerData.x, pointerData.y], 
      stroke: color, 
      strokeWidth: dynamicSize, 
      opacity: dynamicOpacity,
      pressure: pointerData.pressure,
      isApplePencil: pointerData.isApplePencil
    }
    
    // Save current state to history before starting new drawing
    saveToHistory(lines)
    
    // Add the new line and associate it with the active layer
    setLines(prev => {
      const newLines = [...prev, newLine]
      setLineLayerMap(prevMap => ({
        ...prevMap,
        [newLines.length - 1]: activeLayerId
      }))
      return newLines
    })

    // If creating motif, also add to motif drawing lines
    if (isCreatingMotif) {
      setMotifDrawingLines(prev => [...prev, pointerData.x, pointerData.y])
    }
  }

  const handlePointerMove = (e: any) => {
    // If compare handle is active, do not draw
    if (isComparePointerActiveRef.current) {
      return
    }
    // Handle selection drawing
    if (selectionMode && isDrawingSelection) {
      const pointerData = getPointerPosition(e)
      setSelectionPath(prev => [...prev, pointerData.x, pointerData.y])
      return
    }
    
    // Handle crop area drawing
    if (cropMode && isDrawingCrop && selectedImageId) {
      const selectedImage = uploadedImages.find(img => img.id === selectedImageId)
      if (selectedImage) {
        const pointerData = getPointerPosition(e)
        const imageX = selectedImage.x
        const imageY = selectedImage.y
        const imageWidth = selectedImage.width
        const imageHeight = selectedImage.height
        
        setCropArea(prev => {
          if (!prev) return null
          
          // Constrain the crop area to within the image bounds
          const newWidth = Math.max(0, Math.min(pointerData.x - prev.x, imageX + imageWidth - prev.x))
          const newHeight = Math.max(0, Math.min(pointerData.y - prev.y, imageY + imageHeight - prev.y))
          
          return {
            ...prev,
            width: newWidth,
            height: newHeight
          }
        })
      }
      return
    }
    
    if (!isDrawing.current) return
    
    // Check if we're interacting with an image - if so, stop drawing
    if (e.target && e.target.getClassName && e.target.getClassName() === 'Image') {
      isDrawing.current = false
      return
    }

    // Ignore compare slider interactions
    const inCompareHandle = !!(
      e.target?.hasName?.('compare-handle') ||
      e.target?.getParent?.()?.hasName?.('compare-handle') ||
      e.target?.findAncestor?.((n: any) => n?.hasName && n.hasName('compare-handle'))
    )
    if (inCompareHandle) {
      isDrawing.current = false
      return
    }
    
    // Prevent default to avoid scrolling on touch devices
    e.evt.preventDefault()
    
    const stage = e.target.getStage()
    const pointerData = getPointerPosition(e)
    
    // Update pressure tracking
    setCurrentPressure(pointerData.pressure)
    
    // Calculate dynamic brush size based on pressure
    const pressureMultiplier = pointerData.isApplePencil ? pointerData.pressure : 1
    const dynamicSize = Math.max(1, size * pressureMultiplier)
    
    // Calculate dynamic opacity based on pressure
    const dynamicOpacity = Math.max(0.1, brushOpacity * pressureMultiplier)
    
    setLines(prev => {
      const next = prev.slice()
      const last = next[next.length - 1]
      
      // Add point with pressure data
      last.points = last.points.concat([pointerData.x, pointerData.y])
      
      // Update stroke width and opacity based on pressure
      last.strokeWidth = dynamicSize
      last.opacity = dynamicOpacity
      last.pressure = pointerData.pressure

      // If creating motif, also add to motif drawing lines
      if (isCreatingMotif) {
        setMotifDrawingLines(prev => [...prev, pointerData.x, pointerData.y])
      }
      
      return next
    })
  }

  const handlePointerUp = (e: any) => {
    // Prevent default to avoid scrolling on touch devices
    e.evt.preventDefault()
    // Clear compare pointer active on any pointer up
    isComparePointerActiveRef.current = false
    
    // Handle selection completion
    if (selectionMode && isDrawingSelection) {
      setIsDrawingSelection(false)
      
      // Find content within the selection path
      const selectedContent: any[] = []
      
      // Check lines within selection - only get selected points
      lines.forEach((line, lineIndex) => {
        const selectedPoints = getSelectedLinePoints(line.points, selectionPath)
        if (selectedPoints && selectedPoints.length >= 4) { // Need at least 2 points
          selectedContent.push({ 
            ...line, 
            type: 'line', 
            id: `line_${Date.now()}_${lineIndex}`,
            points: selectedPoints,
            isPartial: selectedPoints.length < line.points.length
          })
        }
      })
      
      // Check images within selection - get crop data
      uploadedImages.forEach((image, imageIndex) => {
        const imageSelectionData = getImageSelectionData(image, selectionPath)
        if (imageSelectionData) {
          selectedContent.push({ 
            ...image, 
            type: 'image', 
            originalId: image.id,
            id: `img_${Date.now()}_${imageIndex}`,
            cropX: imageSelectionData.cropX,
            cropY: imageSelectionData.cropY,
            cropWidth: imageSelectionData.cropWidth,
            cropHeight: imageSelectionData.cropHeight,
            x: imageSelectionData.intersectX,
            y: imageSelectionData.intersectY,
            width: imageSelectionData.intersectWidth,
            height: imageSelectionData.intersectHeight,
            isPartial: imageSelectionData.cropWidth < 1 || imageSelectionData.cropHeight < 1
          })
        }
      })
      
      setSelectedArea(selectedContent)
      console.log('Selection completed - Found', selectedContent.length, 'items')
      return
    }
    
    // Handle crop completion
    if (cropMode && isDrawingCrop) {
      setIsDrawingCrop(false)
      // Crop area is now complete, user can apply or cancel
      return
    }
    
    isDrawing.current = false
  }

  // Legacy mouse handlers for desktop compatibility
  const handleMouseDown = (e: any) => {
    handlePointerDown(e)
  }

  const handleMouseMove = (e: any) => {
    handlePointerMove(e)
  }

  const handleMouseUp = (e: any) => {
    handlePointerUp(e)
  }

  // Touch gesture helpers
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 }
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY }
    }
    const touch1 = touches[0]
    const touch2 = touches[1]
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }

  // Touch event handlers
  const handleTouchStart = (e: any) => {
    // Prevent default to avoid scrolling
    e.evt.preventDefault()
    
    const touches = e.evt.touches
    const touchCount = touches.length
    
    if (touchCount === 1) {
      // Check if we're interacting with an image - if so, don't start drawing
      if (e.target && e.target.getClassName && e.target.getClassName() === 'Image') {
        return // Don't start drawing when interacting with images
      }
      // Single touch - start drawing
      handlePointerDown(e)
    } else if (touchCount === 2) {
      // Two finger touch - start gesture mode
      setIsGesturing(true)
      setLastTouchDistance(getTouchDistance(touches))
      setLastTouchCenter(getTouchCenter(touches))
    }
  }

  const handleTouchMove = (e: any) => {
    // Prevent default to avoid scrolling
    e.evt.preventDefault()
    
    const touches = e.evt.touches
    const touchCount = touches.length
    
    if (touchCount === 1 && !isGesturing) {
      // Check if we're interacting with an image - if so, stop drawing
      if (e.target && e.target.getClassName && e.target.getClassName() === 'Image') {
        isDrawing.current = false
        return
      }
      // Single touch - continue drawing
      handlePointerMove(e)
    } else if (touchCount === 2 && isGesturing) {
      // Two finger touch - handle zoom and pan
      const currentDistance = getTouchDistance(touches)
      const currentCenter = getTouchCenter(touches)
      
      if (lastTouchDistance > 0) {
        // Pinch to zoom
        const scale = currentDistance / lastTouchDistance
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * scale))
        setZoom(newZoom)
        
        // Pan based on center movement
        const stage = e.target.getStage()
        if (stage) {
          const dx = currentCenter.x - lastTouchCenter.x
          const dy = currentCenter.y - lastTouchCenter.y
          
          // Apply pan offset
          stage.x(stage.x() + dx)
          stage.y(stage.y() + dy)
        }
      }
      
      setLastTouchDistance(currentDistance)
      setLastTouchCenter(currentCenter)
    }
  }

  const handleTouchEnd = (e: any) => {
    // Prevent default to avoid scrolling
    e.evt.preventDefault()
    
    const touches = e.evt.touches
    const touchCount = touches.length
    
    if (touchCount === 0) {
      // All touches ended
      if (isGesturing) {
        setIsGesturing(false)
        setLastTouchDistance(0)
      } else {
        handlePointerUp(e)
      }
    } else if (touchCount === 1 && isGesturing) {
      // Switched from two fingers to one - stop gesturing
      setIsGesturing(false)
      setLastTouchDistance(0)
    }
  }

  // Floating toolbar drag handlers
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleToolbarTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0]
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    })
  }

  const handleToolbarDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement
    if (!canvasContainer) return
    
    const containerRect = canvasContainer.getBoundingClientRect()
    const newX = clientX - containerRect.left - dragOffset.x
    const newY = clientY - containerRect.top - dragOffset.y
    
    // Constrain to canvas bounds
    const constrainedX = Math.max(0, Math.min(newX, containerRect.width - 300)) // 300px is approximate toolbar width
    const constrainedY = Math.max(0, Math.min(newY, containerRect.height - 50)) // 50px is approximate toolbar height
    
    setToolbarPosition({ x: constrainedX, y: constrainedY })
  }

  const handleToolbarDragEnd = () => {
    setIsDragging(false)
  }

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleToolbarDrag(e)
      const handleTouchMove = (e: TouchEvent) => handleToolbarDrag(e)
      const handleMouseUp = () => handleToolbarDragEnd()
      const handleTouchEnd = () => handleToolbarDragEnd()

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, dragOffset])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // Check for Cmd+Z (Mac) or Ctrl+Z (Windows/Linux) for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        console.log('Undo keyboard shortcut triggered')
        undo()
      }
      // Check for Cmd+Shift+Z (Mac) or Ctrl+Y (Windows/Linux) for redo
      else if ((e.metaKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault()
        redo()
      }
      // Check for Delete or Backspace to remove selected image or motif
      else if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedImageId) {
          e.preventDefault()
          removeSelectedImage()
        } else if (selectedMotifId) {
          e.preventDefault()
          removeSelectedMotif()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedImageId, removeSelectedImage, selectedMotifId, removeSelectedMotif])

  // Standard cursor values for drawing tools
  const getBrushCursor = useCallback((size: number) => {
    // Use crosshair cursor for precise drawing
    return 'crosshair'
  }, [])

  const getEraserCursor = useCallback((size: number) => {
    // Use cell cursor for erasing (similar to selection)
    return 'cell'
  }, [])

  // Calculate canvas size based on container
  const calculateCanvasSize = useCallback(() => {
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement
    if (canvasContainer) {
      const containerRect = canvasContainer.getBoundingClientRect()
      const padding = 32 // Account for padding (16px on each side)
      const newWidth = Math.max(400, containerRect.width - padding)
      const newHeight = Math.max(300, containerRect.height - padding)
      setCanvasSize({ width: newWidth, height: newHeight })
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      calculateCanvasSize()
      if (stageRef.current) {
        stageRef.current.width(canvasSize.width)
        stageRef.current.height(canvasSize.height)
        stageRef.current.batchDraw()
      }
    }

    // Initial calculation
    calculateCanvasSize()
    
    // Set up resize listener
    window.addEventListener('resize', handleResize)
    
    // Recalculate on mount
    const timeoutId = setTimeout(calculateCanvasSize, 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [calculateCanvasSize, canvasSize.width, canvasSize.height])

  return (
    <Box sx={{ 
      height: '100%', 
      width: '100%',
      overflow: 'hidden',
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', md: '260px 1fr 300px' }, 
      gridTemplateRows: '1fr'
    }}>
      {/* Left Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Layers</Typography>
        </Box>
        <List dense sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
          {layers.map(l => (
                    <ListItem key={l.id} onClick={() => {
                      console.log('Switching to layer:', l.id)
                      setActiveLayerId(l.id)
                    }} sx={{ cursor: 'pointer', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 1, mb: 0.5, backgroundColor: l.id === activeLayerId ? 'action.selected' : 'transparent' }}>
              <ListItemText primary={l.name} />
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small" onClick={() => {
                  console.log('Toggling visibility for layer:', l.id, 'Current visible:', l.visible)
                  setLayers(prev => prev.map(x => x.id === l.id ? { ...x, visible: !x.visible } : x))
                }}>
                  {l.visible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
                {layers.length > 1 && (
                  <IconButton edge="end" size="small" onClick={() => {
                    // Delete layer and clean up mappings
                    setLayers(prev => prev.filter(x => x.id !== l.id))
                    // Move content from deleted layer to the first remaining layer
                    const remainingLayers = layers.filter(x => x.id !== l.id)
                    if (remainingLayers.length > 0) {
                      const targetLayerId = remainingLayers[0].id
                      setLineLayerMap(prev => {
                        const newMap = { ...prev }
                        Object.keys(newMap).forEach(key => {
                          const numKey = parseInt(key)
                          if (newMap[numKey] === l.id) {
                            newMap[numKey] = targetLayerId
                          }
                        })
                        return newMap
                      })
                      setImageLayerMap(prev => {
                        const newMap = { ...prev }
                        Object.keys(newMap).forEach(key => {
                          if (newMap[key] === l.id) {
                            newMap[key] = targetLayerId
                          }
                        })
                        return newMap
                      })
                      setMotifLayerMap(prev => {
                        const newMap = { ...prev }
                        Object.keys(newMap).forEach(key => {
                          if (newMap[key] === l.id) {
                            newMap[key] = targetLayerId
                          }
                        })
                        return newMap
                      })
                      // Set active layer to the target layer
                      setActiveLayerId(targetLayerId)
                    }
                  }}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button fullWidth startIcon={<Add />} onClick={() => {
              const newLayerId = String(Date.now())
              setLayers(prev => [...prev, { id: newLayerId, name: `Layer ${prev.length + 1}`, visible: true, opacity: 1 }])
              setActiveLayerId(newLayerId)
            }}>Add Layer</Button>
          </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">Brush Size</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              {size}px
            </Typography>
          </Box>
          <Slider
            min={1}
            max={20}
            value={size}
            onChange={(_, v) => setSize(v as number)}
            sx={{
              height: 6,
              padding: '12px 0',
              '& .MuiSlider-rail': {
                opacity: 0.35,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                backdropFilter: 'blur(6px)',
                borderRadius: 999
              },
              '& .MuiSlider-track': {
                border: 'none',
                background: 'linear-gradient(90deg, #00E5FF 0%, #7C4DFF 100%)',
                boxShadow: '0 4px 14px rgba(124,77,255,0.35)',
                borderRadius: 999
              },
              '& .MuiSlider-thumb': {
                width: 14,
                height: 14,
                backgroundColor: '#fff',
                border: '1px solid rgba(0,0,0,0.25)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(4px)',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(124,77,255,0.16)'
                },
                '&::before': { boxShadow: 'none' }
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
            <Typography variant="subtitle2">Brush Opacity</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              {Math.round(brushOpacity * 100)}%
            </Typography>
          </Box>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={brushOpacity}
            onChange={(_, v) => setBrushOpacity(v as number)}
            sx={{
              height: 6,
              padding: '12px 0',
              '& .MuiSlider-rail': {
                opacity: 0.35,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                backdropFilter: 'blur(6px)',
                borderRadius: 999
              },
              '& .MuiSlider-track': {
                border: 'none',
                background: 'linear-gradient(90deg, #00C9A7 0%, #6E8EF5 100%)',
                boxShadow: '0 4px 14px rgba(0,201,167,0.35)',
                borderRadius: 999
              },
              '& .MuiSlider-thumb': {
                width: 14,
                height: 14,
                backgroundColor: '#fff',
                border: '1px solid rgba(0,0,0,0.25)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(4px)',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(0,201,167,0.16)'
                },
                '&::before': { boxShadow: 'none' }
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="subtitle2">Canvas Influence</Typography>
              <Tooltip title="Sets how much the AI should stick to your sketch. 100% follows it exactly, lower percentages allow more AI interpretation.">
                <IconButton size="small" sx={{ p: 0.25, color: 'text.secondary' }}>
                  <Info sx={{ fontSize: '0.875rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              {canvasInfluence}%
            </Typography>
          </Box>
          <Slider
            min={10}
            max={100}
            step={1}
            value={canvasInfluence}
            onChange={(_, v) => setCanvasInfluence(v as number)}
            sx={{
              height: 6,
              padding: '12px 0',
              '& .MuiSlider-rail': {
                opacity: 0.35,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                backdropFilter: 'blur(6px)',
                borderRadius: 999
              },
              '& .MuiSlider-track': {
                border: 'none',
                background: 'linear-gradient(90deg, #FF6B6B 0%, #FFD93D 100%)',
                boxShadow: '0 4px 14px rgba(255,107,107,0.35)',
                borderRadius: 999
              },
              '& .MuiSlider-thumb': {
                width: 14,
                height: 14,
                backgroundColor: '#fff',
                border: '1px solid rgba(0,0,0,0.25)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                backdropFilter: 'blur(4px)',
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: '0 0 0 8px rgba(255,107,107,0.16)'
                },
                '&::before': { boxShadow: 'none' }
              }
            }}
          />
          {isApplePencilActive && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Pressure</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  bgcolor: 'grey.200', 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Box sx={{ 
                    width: `${currentPressure * 100}%`, 
                    height: '100%', 
                    bgcolor: 'primary.main',
                    transition: 'width 0.1s ease-out'
                  }} />
                </Box>
                <Typography variant="caption" sx={{ minWidth: '35px', textAlign: 'right' }}>
                  {Math.round(currentPressure * 100)}%
                </Typography>
              </Box>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {isApplePencilActive ? 'Apple Pencil detected - pressure sensitive drawing enabled' : 'Tip: Hold mouse to draw, release to stop.'}
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <UsageBar usageStatus={usageStatus} onReset={resetUsage} />
        </Box>
      </Box>

      {/* Canvas Center */}
      <Box 
        data-canvas-container
        sx={{ 
          position: 'relative', 
          overflow: 'hidden', 
          p: { xs: 1, sm: 2 }, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.default',
          height: '100%',
          minHeight: '500px',
          cursor: tool === 'brush' ? getBrushCursor(size) : 
                  tool === 'eraser' ? getEraserCursor(size) : 
                  'default'
        }}
      >
        {/* Canvas frame */}
        <Box sx={{ 
          position: 'relative', 
          borderRadius: 2, 
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', 
          border: '1px solid', 
          borderColor: 'divider', 
          overflow: 'hidden', 
          // Force whiteboard to stay white in both light and dark modes
          bgcolor: '#ffffff',
          width: '100%',
          height: '100%',
          minHeight: '400px',
          touchAction: 'none', // Prevent default touch behaviors
          userSelect: 'none', // Prevent text selection
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}>
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onClick={(e) => {
            // Deselect image and motif if clicking on empty space
            if (e.target === e.target.getStage()) {
              setSelectedImageId(null)
              setSelectedMotifId(null)
              if (transformerRef.current) {
                transformerRef.current.nodes([])
                transformerRef.current.getLayer().batchDraw()
              }
            }
          }}
          onTap={(e) => {
            // Deselect image and motif if tapping on empty space
            if (e.target === e.target.getStage()) {
              setSelectedImageId(null)
              setSelectedMotifId(null)
              if (transformerRef.current) {
                transformerRef.current.nodes([])
                transformerRef.current.getLayer().batchDraw()
              }
            }
          }}
          scaleX={zoom}
          scaleY={zoom}
        >
          {/* Background layer for export - ensures white background in snapshots */}
          <Layer>
            <Rect
              x={0}
              y={0}
              width={canvasSize.width / zoom}
              height={canvasSize.height / zoom}
              fill="#ffffff"
              listening={false}
            />
          </Layer>
          {/* Render each layer separately */}
          {layers.map((layer) => (
            <Layer 
              key={layer.id} 
              visible={layer.visible} 
              opacity={layer.opacity}
            >
              {/* Render lines for this layer */}
              {lines.map((line, i) => {
                const lineLayerId = lineLayerMap[i]
                if (lineLayerId !== layer.id) return null
                
                return (
                  <Line
                    key={i}
                    points={line.points}
                    stroke={line.tool === 'eraser' ? '#ffffff' : line.stroke}
                    strokeWidth={line.strokeWidth}
                    opacity={line.opacity ?? 1}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                  />
                )
              })}
              
              {/* Render images for this layer */}
              {uploadedImages.map((image) => {
                const imageLayerId = imageLayerMap[image.id]
                if (imageLayerId !== layer.id) return null
                
                console.log('Rendering image:', image.id, 'on layer:', layer.id, 'imageElement exists:', !!imageElements[image.id])
                
                // Don't render if image element doesn't exist yet
                if (!imageElements[image.id]) {
                  console.log('Image element not ready yet for:', image.id)
                  return null
                }
                
                return (
                      <Group key={image.id}>
                        {/* Image with polygon mask if it's a partial selection */}
                        {image.usePolygonMask && image.selectionPolygon ? (
                          <Group>
                            {/* Create a mask using the selection polygon */}
                            <Line
                              points={image.selectionPolygon}
                              fill="black"
                              closed={true}
                              globalCompositeOperation="source-in"
                            />
                            <KonvaImage
                              image={imageElements[image.id]}
                              x={image.x}
                              y={image.y}
                              width={image.width}
                              height={image.height}
                              rotation={image.rotation}
                              scaleX={image.scaleX}
                              scaleY={image.scaleY}
                              draggable={tool === 'hand'}
                              listening={tool === 'hand' || (!isDrawing && tool !== 'brush' && tool !== 'eraser')}
                              onDragEnd={(e) => {
                                setUploadedImages(prev => 
                                  prev.map(img => 
                                    img.id === image.id 
                                      ? { ...img, x: e.target.x(), y: e.target.y() }
                                      : img
                                  )
                                )
                              }}
                              onTransform={(e) => {
                                const node = e.target
                                const angle = node.rotation()
                                // position overlay slightly above the image center
                                const cx = node.x() + (node.width() * node.scaleX()) / 2
                                const cy = node.y() - 12
                                setRotationOverlay({ imageId: image.id, angle, x: cx, y: cy })
                              }}
                              onTransformEnd={(e) => {
                                const node = e.target
                                const scaleX = node.scaleX()
                                const scaleY = node.scaleY()
                                
                                // Calculate new dimensions maintaining aspect ratio
                                const newWidth = Math.max(10, node.width() * scaleX)
                                const newHeight = Math.max(10, node.height() * scaleY)
                                
                                setUploadedImages(prev => 
                                  prev.map(img => 
                                    img.id === image.id 
                                      ? { 
                                          ...img, 
                                          x: node.x(),
                                          y: node.y(),
                                          width: newWidth,
                                          height: newHeight,
                                          scaleX: 1,
                                          scaleY: 1,
                                          rotation: node.rotation()
                                        }
                                      : img
                                  )
                                )
                                
                                // Reset scale
                                node.scaleX(1)
                                node.scaleY(1)
                                setRotationOverlay(null)
                              }}
                              onClick={(e) => {
                                // Only allow selection with hand tool or when not drawing
                                if (tool !== 'hand' && (isDrawing || tool === 'brush' || tool === 'eraser')) {
                                  e.cancelBubble = true
                                  return
                                }
                                setSelectedImageId(image.id)
                                // Attach transformer to selected image
                                if (transformerRef.current) {
                                  transformerRef.current.nodes([e.target])
                                  transformerRef.current.getLayer().batchDraw()
                                }
                              }}
                              onTap={(e) => {
                                // Only allow selection with hand tool or when not drawing
                                if (tool !== 'hand' && (isDrawing || tool === 'brush' || tool === 'eraser')) {
                                  e.cancelBubble = true
                                  return
                                }
                                setSelectedImageId(image.id)
                                // Attach transformer to selected image
                                if (transformerRef.current) {
                                  transformerRef.current.nodes([e.target])
                                  transformerRef.current.getLayer().batchDraw()
                                }
                              }}
                              stroke={selectedImageId === image.id ? '#2196f3' : 'transparent'}
                              strokeWidth={selectedImageId === image.id ? 2 : 0}
                            />
                          </Group>
                        ) : (
                          /* Regular image without mask */
                          <KonvaImage
                            image={imageElements[image.id]}
                            x={image.x}
                            y={image.y}
                            width={image.width}
                            height={image.height}
                            rotation={image.rotation}
                            scaleX={image.scaleX}
                            scaleY={image.scaleY}
                            // Handle partial selection cropping
                            cropX={image.cropX ? image.cropX * (imageElements[image.id]?.width || 0) : 0}
                            cropY={image.cropY ? image.cropY * (imageElements[image.id]?.height || 0) : 0}
                            cropWidth={image.cropWidth ? image.cropWidth * (imageElements[image.id]?.width || 0) : imageElements[image.id]?.width || 0}
                            cropHeight={image.cropHeight ? image.cropHeight * (imageElements[image.id]?.height || 0) : imageElements[image.id]?.height || 0}
                            draggable={tool === 'hand'}
                            listening={tool === 'hand' || (!isDrawing && tool !== 'brush' && tool !== 'eraser')}
                            onDragEnd={(e) => {
                              setUploadedImages(prev => 
                                prev.map(img => 
                                  img.id === image.id 
                                    ? { ...img, x: e.target.x(), y: e.target.y() }
                                    : img
                                )
                              )
                            }}
                            onTransform={(e) => {
                              const node = e.target
                              const angle = node.rotation()
                              const cx = node.x() + (node.width() * node.scaleX()) / 2
                              const cy = node.y() - 12
                              setRotationOverlay({ imageId: image.id, angle, x: cx, y: cy })
                            }}
                            onTransformEnd={(e) => {
                              const node = e.target
                              const scaleX = node.scaleX()
                              const scaleY = node.scaleY()
                              
                              // Calculate new dimensions maintaining aspect ratio
                              const newWidth = Math.max(10, node.width() * scaleX)
                              const newHeight = Math.max(10, node.height() * scaleY)
                              
                              setUploadedImages(prev => 
                                prev.map(img => 
                                  img.id === image.id 
                                    ? { 
                                        ...img, 
                                        x: node.x(),
                                        y: node.y(),
                                        width: newWidth,
                                        height: newHeight,
                                        scaleX: 1,
                                        scaleY: 1,
                                        rotation: node.rotation()
                                      }
                                    : img
                                )
                              )
                              
                              // Reset scale
                              node.scaleX(1)
                              node.scaleY(1)
                              setRotationOverlay(null)
                            }}
                            onClick={(e) => {
                              // Only allow selection with hand tool or when not drawing
                              if (tool !== 'hand' && (isDrawing || tool === 'brush' || tool === 'eraser')) {
                                e.cancelBubble = true
                                return
                              }
                              setSelectedImageId(image.id)
                              // Attach transformer to selected image
                              if (transformerRef.current) {
                                transformerRef.current.nodes([e.target])
                                transformerRef.current.getLayer().batchDraw()
                              }
                            }}
                            onTap={(e) => {
                              // Only allow selection with hand tool or when not drawing
                              if (tool !== 'hand' && (isDrawing || tool === 'brush' || tool === 'eraser')) {
                                e.cancelBubble = true
                                return
                              }
                              setSelectedImageId(image.id)
                              // Attach transformer to selected image
                              if (transformerRef.current) {
                                transformerRef.current.nodes([e.target])
                                transformerRef.current.getLayer().batchDraw()
                              }
                            }}
                            stroke={selectedImageId === image.id ? '#2196f3' : 'transparent'}
                            strokeWidth={selectedImageId === image.id ? 2 : 0}
                          />
                        )}

                        {/* Rotation overlay for this image, only show when this image is being transformed */}
                        {rotationOverlay && rotationOverlay.imageId === image.id && (
                          <Group>
                            <Text
                              x={rotationOverlay.x}
                              y={rotationOverlay.y}
                              text={`${Math.round((rotationOverlay.angle % 360 + 360) % 360)}°`}
                              fontSize={12}
                              fill="#fff"
                              align="center"
                              offsetX={8}
                              padding={4}
                              shadowColor="rgba(0,0,0,0.5)"
                              shadowBlur={4}
                              shadowOffset={{ x: 0, y: 1 }}
                              shadowOpacity={0.6}
                            />
                          </Group>
                        )}
                      </Group>
                    )
                  })}

              {/* Render motifs for this layer */}
              {insertedMotifs.map((motif) => {
                const motifLayerId = motifLayerMap[motif.id]
                if (motifLayerId !== layer.id) return null
                
                console.log('Rendering motif:', motif.name, 'on layer:', layer.id, 'selected:', selectedMotifId === motif.id)
                
                try {
                  const motifPoints = JSON.parse(motif.data) as number[]
                  // Normalize points to the motif group's local coordinates (top-left at 0,0)
                  let minPX = Infinity, minPY = Infinity
                  for (let i = 0; i < motifPoints.length; i += 2) {
                    const px = motifPoints[i]
                    const py = motifPoints[i + 1]
                    if (px < minPX) minPX = px
                    if (py < minPY) minPY = py
                  }
                  const relativePoints: number[] = []
                  for (let i = 0; i < motifPoints.length; i += 2) {
                    relativePoints.push(motifPoints[i] - minPX, motifPoints[i + 1] - minPY)
                  }
                  
                  return (
                    <Group key={motif.id}>
                      {/* Motif outline/border when selected */}
                      <Rect
                        x={motif.x - 2}
                        y={motif.y - 2}
                        width={motif.width + 4}
                        height={motif.height + 4}
                        stroke={selectedMotifId === motif.id ? '#2196f3' : 'transparent'}
                        strokeWidth={selectedMotifId === motif.id ? 2 : 0}
                        fill="transparent"
                        listening={false}
                      />
                      
                      {/* Motif drawing */}
                      <Group
                        x={motif.x}
                        y={motif.y}
                        width={motif.width}
                        height={motif.height}
                        scaleX={motif.scaleX}
                        scaleY={motif.scaleY}
                        rotation={motif.rotation}
                        opacity={motif.opacity}
                        draggable={tool === 'hand'}
                        listening={tool === 'hand' || (!isDrawing && tool !== 'brush' && tool !== 'eraser')}
                        onClick={(e) => {
                          // Only allow selection with hand tool or when not drawing
                          if (tool !== 'hand' && (isDrawing || tool === 'brush' || tool === 'eraser')) {
                            e.cancelBubble = true
                            return
                          }
                          setSelectedMotifId(motif.id)
                          setSelectedImageId(null) // Clear image selection
                          // Attach transformer to motif GROUP (parent of clicked node)
                          if (transformerRef.current) {
                            transformerRef.current.nodes([e.target.getParent()])
                            transformerRef.current.getLayer().batchDraw()
                          }
                        }}
                        onDragEnd={(e) => {
                          setInsertedMotifs(prev => 
                            prev.map(m => 
                              m.id === motif.id 
                                ? { ...m, x: e.target.x(), y: e.target.y() }
                                : m
                            )
                          )
                        }}
                        onTransform={(e) => {
                          const node = e.target
                          const angle = node.rotation()
                          const scaleX = node.scaleX()
                          const scaleY = node.scaleY()
                          
                          setInsertedMotifs(prev => 
                            prev.map(m => 
                              m.id === motif.id 
                                ? { 
                                    ...m, 
                                    x: node.x(), 
                                    y: node.y(), 
                                    rotation: angle,
                                    scaleX: scaleX,
                                    scaleY: scaleY
                                  }
                                : m
                            )
                          )
                        }}
                        onTap={(e) => {
                          console.log('Motif tapped:', motif.name, 'Tool:', tool, 'IsDrawing:', isDrawing)
                          // Only allow selection with hand tool or when not drawing
                          if (tool !== 'hand' && (isDrawing || tool === 'brush' || tool === 'eraser')) {
                            console.log('Selection blocked - wrong tool or drawing')
                            e.cancelBubble = true
                            return
                          }
                          console.log('Selecting motif:', motif.id)
                          setSelectedMotifId(motif.id)
                          setSelectedImageId(null) // Clear image selection
                          // Attach transformer to selected motif
                          if (transformerRef.current) {
                            console.log('Attaching transformer to motif GROUP')
                            transformerRef.current.nodes([e.target.getParent()])
                            transformerRef.current.getLayer().batchDraw()
                          } else {
                            console.log('Transformer ref not available')
                          }
                        }}
                      >
                        {/* Transparent hit area to make selection easier */}
                        <Rect
                          x={0}
                          y={0}
                          width={motif.width}
                          height={motif.height}
                          fill="rgba(0,0,0,0.001)"
                          listening={true}
                        />
                        {/* Render motif points as lines (relative to group) */}
                        {relativePoints.length >= 4 && (
                          <Line
                            points={relativePoints}
                            stroke="#000000"
                            strokeWidth={2}
                            hitStrokeWidth={24}
                            opacity={1}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            listening={true}
                          />
                        )}
                      </Group>
                    </Group>
                  )
                } catch (error) {
                  console.error('Error rendering motif:', error)
                  return null
                }
              })}

              {/* Selection path visualization - only on the first layer to avoid duplication */}
              {layer.id === layers[0]?.id && selectionPath.length > 0 && selectionMode && (
                <Group>
                  {/* Dark overlay covering entire canvas */}
                  <Rect
                    x={0}
                    y={0}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    fill="rgba(0, 0, 0, 0.3)"
                  />
                  {/* Clear area for selection */}
                  <Line
                    points={selectionPath}
                    fill="transparent"
                    closed={true}
                    globalCompositeOperation="destination-out"
                  />
                  {/* Selection border */}
                  <Line
                    points={selectionPath}
                    stroke="#2196f3"
                    strokeWidth={2}
                    fill="rgba(33, 150, 243, 0.1)"
                    closed={true}
                    dash={[5, 5]}
                  />
                </Group>
              )}
              
              {/* Crop area visualization - only on the layer containing the selected image */}
              {cropArea && cropMode && selectedImageId && (() => {
                const selectedImage = uploadedImages.find(img => img.id === selectedImageId)
                if (!selectedImage) return null
                
                const imageLayerId = imageLayerMap[selectedImage.id]
                if (imageLayerId !== layer.id) return null
                
                return (
                  <Group>
                    {/* Dark overlay outside crop area */}
                    <Rect
                      x={selectedImage.x}
                      y={selectedImage.y}
                      width={selectedImage.width}
                      height={selectedImage.height}
                      fill="rgba(0, 0, 0, 0.3)"
                      globalCompositeOperation="source-over"
                    />
                    {/* Clear area for crop selection */}
                    <Rect
                      x={cropArea.x}
                      y={cropArea.y}
                      width={cropArea.width}
                      height={cropArea.height}
                      fill="transparent"
                      globalCompositeOperation="destination-out"
                    />
                    {/* Crop area rectangle */}
                    <Rect
                      x={cropArea.x}
                      y={cropArea.y}
                      width={cropArea.width}
                      height={cropArea.height}
                      stroke="#ff9800"
                      strokeWidth={2}
                      fill="rgba(255, 152, 0, 0.1)"
                      dash={[5, 5]}
                    />
                    {/* Crop handles */}
                    <Rect
                      x={cropArea.x - 4}
                      y={cropArea.y - 4}
                      width={8}
                      height={8}
                      fill="#ff9800"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                    <Rect
                      x={cropArea.x + cropArea.width - 4}
                      y={cropArea.y - 4}
                      width={8}
                      height={8}
                      fill="#ff9800"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                    <Rect
                      x={cropArea.x - 4}
                      y={cropArea.y + cropArea.height - 4}
                      width={8}
                      height={8}
                      fill="#ff9800"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                    <Rect
                      x={cropArea.x + cropArea.width - 4}
                      y={cropArea.y + cropArea.height - 4}
                      width={8}
                      height={8}
                      fill="#ff9800"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  </Group>
                )
              })()}
              
              {/* Transformer for selected image or motif - only show if selected item is on this layer */}
              {(selectedImageId || selectedMotifId) && (() => {
                let shouldShowTransformer = false
                
                if (selectedImageId) {
                  const selectedImage = uploadedImages.find(img => img.id === selectedImageId)
                  const imageLayerId = selectedImage ? imageLayerMap[selectedImage.id] : null
                  shouldShowTransformer = imageLayerId === layer.id
                }
                
                if (selectedMotifId) {
                  const motifLayerId = motifLayerMap[selectedMotifId]
                  shouldShowTransformer = motifLayerId === layer.id
                }
                
                if (!shouldShowTransformer) return null
                
                return (
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Maintain aspect ratio
                      if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                        return oldBox
                      }
                      return newBox
                    }}
                    keepRatio={true}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    rotateEnabled={true}
                    borderEnabled={true}
                    borderStroke="#2196f3"
                    borderStrokeWidth={2}
                    anchorStroke="#2196f3"
                    anchorFill="#ffffff"
                    anchorSize={8}
                  />
                )
              })()}
                </Layer>
              ))}
          
          {showCanvasCompare && (
            <Layer listening={true}>
              {generatedImageElement && (
                <Group
                  clipFunc={(ctx) => {
                    ctx.rect(0, 0, Math.max(0, Math.min(compareX, canvasSize.width)), canvasSize.height)
                  }}
                >
                  <KonvaImage
                    image={generatedImageElement}
                    x={0}
                    y={0}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    listening={false}
                  />
                </Group>
              )}

              {/* Vertical line */}
              <Rect
                x={Math.max(0, Math.min(compareX, canvasSize.width)) - 1}
                y={0}
                width={2}
                height={canvasSize.height}
                fill="#000000"
                listening={false}
              />
              
              {/* Toggle handle in center of line */}
              <Group
                x={Math.max(0, Math.min(compareX, canvasSize.width))}
                y={canvasSize.height / 2}
                draggable
                dragBoundFunc={(pos) => ({
                  x: Math.max(0, Math.min(pos.x, canvasSize.width)),
                  y: canvasSize.height / 2
                })}
                name="compare-handle"
                onMouseEnter={() => { try { stageRef.current?.container().style.setProperty('cursor', 'grab') } catch {} }}
                onMouseLeave={() => { try { stageRef.current?.container().style.setProperty('cursor', 'default') } catch {} }}
                onMouseDown={(e) => { e.cancelBubble = true; (e as any).evt?.preventDefault?.(); isComparePointerActiveRef.current = true; try { stageRef.current?.container().style.setProperty('cursor', 'grabbing') } catch {} }}
                onTouchStart={(e) => { e.cancelBubble = true; (e as any).evt?.preventDefault?.(); isComparePointerActiveRef.current = true }}
                onMouseUp={(e) => { e.cancelBubble = true; isComparePointerActiveRef.current = false }}
                onTouchEnd={(e) => { e.cancelBubble = true; isComparePointerActiveRef.current = false }}
                onDragStart={(e) => { (e as any).evt?.preventDefault?.(); isComparePointerActiveRef.current = true; try { stageRef.current?.container().style.setProperty('cursor', 'grabbing') } catch {} }}
                onDragEnd={() => { isComparePointerActiveRef.current = false; try { stageRef.current?.container().style.setProperty('cursor', 'grab') } catch {} }}
                onDragMove={(e) => { (e as any).evt?.preventDefault?.(); scheduleCompareXUpdate(e.target.x()) }}
              >
                {/* Larger invisible hit area to make grabbing easier */}
                <Rect
                  x={-20}
                  y={-40}
                  width={40}
                  height={80}
                  fill="rgba(0,0,0,0)"
                />
                {/* Handle circle */}
                <Circle
                  x={0}
                  y={0}
                  radius={12}
                  fill="#000000"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                {/* Grip lines inside handle */}
                <Line
                  points={[-4, 0, 4, 0]}
                  stroke="#ffffff"
                  strokeWidth={2}
                  lineCap="round"
                />
                <Line
                  points={[0, -4, 0, 4]}
                  stroke="#ffffff"
                  strokeWidth={2}
                  lineCap="round"
                />
              </Group>

              {/* Removed full-canvas click-to-move to allow drawing; drag the handle instead */}
            </Layer>
          )}
        </Stage>

        {/* Toggle button to switch between rendered and harmonized images */}
        {showCanvasCompare && renderedImageUrl && harmonizedImageUrl && (
          <Box
            sx={{
              position: 'absolute',
              top: 80,
              right: 20,
              zIndex: 1000,
            }}
          >
            <Tooltip title={currentViewImageUrl === harmonizedImageUrl ? 'Switch to Rendered' : 'Switch to Harmonized'}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const nextView = currentViewImageUrl === harmonizedImageUrl ? renderedImageUrl : harmonizedImageUrl
                  console.log('Toggle clicked:', { currentView: currentViewImageUrl, nextView, hasRendered: !!renderedImageUrl, hasHarmonized: !!harmonizedImageUrl })
                  setCurrentViewImageUrl(nextView)
                }}
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  },
                  width: 36,
                  height: 36,
                }}
              >
                <SwapHoriz fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        </Box>


        {/* Floating top toolbar */}
        <Box 
          onMouseDown={handleToolbarMouseDown}
          onTouchStart={handleToolbarTouchStart}
          sx={{ 
            position: 'absolute', 
            top: toolbarPosition.y, 
            left: toolbarPosition.x, 
            bgcolor: 'background.paper', 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: 999, 
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)', 
            px: 1, 
            py: 0.5, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transition: isDragging ? 'none' : 'all 0.2s ease-out',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              transform: isDragging ? 'none' : 'translateY(-1px)',
            }
          }}
        >
          <Tooltip title="Undo (Cmd+Z / Ctrl+Z)"><span><IconButton size="small" onClick={(e) => { e.stopPropagation(); e.preventDefault(); console.log('Undo button clicked'); undo(); }} disabled={historyIndex <= 0}><Undo fontSize="small" /></IconButton></span></Tooltip>
          <Tooltip title="Redo (Cmd+Shift+Z / Ctrl+Y)"><span><IconButton size="small" onClick={(e) => { e.stopPropagation(); redo(); }} disabled={historyIndex >= history.length - 1}><Redo fontSize="small" /></IconButton></span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Zoom Out"><span><IconButton size="small" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(minZoom, +(z - 0.1).toFixed(2))); }}><ZoomOut fontSize="small" /></IconButton></span></Tooltip>
          <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</Typography>
          <Tooltip title="Zoom In"><span><IconButton size="small" onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(maxZoom, +(z + 0.1).toFixed(2))); }}><ZoomIn fontSize="small" /></IconButton></span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ToggleButtonGroup exclusive size="small" value={tool} onChange={(_, v) => v && setTool(v)} onClick={(e) => e.stopPropagation()}>
            <ToggleButton value="brush"><Gesture fontSize="small" /></ToggleButton>
            <ToggleButton value="eraser"><Colorize fontSize="small" /></ToggleButton>
            <ToggleButton value="hand" disabled={uploadedImages.length === 0 && insertedMotifs.length === 0}><PanToolAlt fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Brush Color"><span>
            <IconButton 
              size="small" 
              onClick={(e) => e.stopPropagation()}
              sx={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                border: '2px solid', 
                borderColor: 'divider',
                bgcolor: color,
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'scale(1.05)',
                  transition: 'all 0.2s ease-out'
                }
              }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '50%'
                }}
              />
            </IconButton>
          </span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Select Area"><span><IconButton size="small" color="info" onClick={(e) => { e.stopPropagation(); startSelectionMode(); }} sx={{ bgcolor: selectionMode ? 'info.dark' : 'info.main', color: 'white', '&:hover': { bgcolor: 'info.dark' } }}><ContentCut fontSize="small" /></IconButton></span></Tooltip>
          {selectedImageId && !cropMode && !selectionMode && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Tooltip title="Replicate Image"><span><IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); replicateSelectedImage(); }}><ContentCopy fontSize="small" /></IconButton></span></Tooltip>
              <Tooltip title="Crop Image"><span><IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); cropSelectedImage(); }}><Crop fontSize="small" /></IconButton></span></Tooltip>
            </>
          )}
          {cropMode && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Tooltip title="Apply Crop"><span><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); applyCrop(); }} sx={{ bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}>✓</IconButton></span></Tooltip>
              <Tooltip title="Cancel Crop"><span><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); cancelCrop(); }} sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}>✕</IconButton></span></Tooltip>
            </>
          )}
          {selectionMode && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Tooltip title="Apply Selection"><span><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); applySelection(); }} sx={{ bgcolor: 'success.main', color: 'white', '&:hover': { bgcolor: 'success.dark' } }}>✓</IconButton></span></Tooltip>
              <Tooltip title="Cancel Selection"><span><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); cancelSelection(); }} sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}>✕</IconButton></span></Tooltip>
            </>
          )}
          {/* Theme Toggle - Desktop/Tablet Only */}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, display: { xs: 'none', md: 'block' } }} />
          <Tooltip title={`Switch to ${mode === 'light' ? 'Dark' : 'Light'} Mode`}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); toggleThemeMode(); }}
              sx={{
                display: { xs: 'none', md: 'flex' },
                color: theme.palette.text.primary,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light'
                    ? 'rgba(0,0,0,0.04)'
                    : 'rgba(255,255,255,0.08)'
                }
              }}
            >
              {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Separate Aura Assist Button - Right Corner */}
        <Tooltip title="Aura Assist">
          <Box
            onClick={async (e) => {
              e.stopPropagation()
              setAuraAssistActive(true)

              const buttonRect = e.currentTarget.getBoundingClientRect()
              setAuraAssistPopup({
                visible: true,
                text: 'Analyzing your sketch…',
                position: { x: buttonRect.left - 250, y: buttonRect.top + 50 }
              })

              // Capture current canvas sketch as data URL
              const snapshot = captureSketchSnapshot()
              if (!snapshot) {
                setAuraAssistPopup(prev => ({ ...prev, text: 'No sketch found to analyze.' }))
                setAuraAssistActive(false)
                return
              }

              try {
                const callable = httpsCallable<{ sketchDataUrl: string }, { suggestion: string }>(firebaseFunctions, 'auraAssist')
                const res = await callable({ sketchDataUrl: snapshot })
                const suggestion = (res.data?.suggestion || '').trim()
                setAuraAssistPopup(prev => ({ ...prev, text: suggestion || 'No suggestion available.' }))
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Unable to fetch suggestion.'
                setAuraAssistPopup(prev => ({ ...prev, text: msg }))
              } finally {
                setAuraAssistActive(false)
              }
            }}
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              }
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: '18px',
                  height: '18px',
                  border: '2px solid white',
                  borderRadius: '50%',
                  background: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '4px',
                  height: '4px',
                  background: 'white',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `
                    0 -8px 0 1px white,
                    0 8px 0 1px white,
                    -8px 0 0 1px white,
                    8px 0 0 1px white,
                    -6px -6px 0 1px white,
                    6px -6px 0 1px white,
                    -6px 6px 0 1px white,
                    6px 6px 0 1px white
                  `,
                }
              }}
            />
          </Box>
        </Tooltip>

        {/* Download Button - appears when image is generated */}
        {(renderedImageUrl || harmonizedImageUrl) && (
          <Tooltip title="Download Image">
            <IconButton
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadImage()
              }}
              sx={{
                position: 'absolute',
                top: 20,
                right: 70,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)',
                  background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                }
              }}
            >
              <Download sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Pulsing Edge Effect */}
        {auraAssistActive && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 9999,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  linear-gradient(90deg, rgba(102, 126, 234, 0.4) 0%, transparent 15%, transparent 85%, rgba(102, 126, 234, 0.4) 100%),
                  linear-gradient(0deg, rgba(102, 126, 234, 0.4) 0%, transparent 15%, transparent 85%, rgba(102, 126, 234, 0.4) 100%)
                `,
                animation: 'auraPulse 1.5s ease-in-out',
                '@keyframes auraPulse': {
                  '0%': {
                    opacity: 0,
                  },
                  '50%': {
                    opacity: 1,
                  },
                  '100%': {
                    opacity: 0,
                  },
                },
              }
            }}
          />
        )}

        {/* Aura Assist Popup */}
        {auraAssistPopup.visible && (
          <Box
            sx={{
              position: 'fixed',
              left: auraAssistPopup.position.x,
              top: auraAssistPopup.position.y,
              zIndex: 10000,
              maxWidth: '300px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              animation: 'popupSlideIn 0.3s ease-out',
              '@keyframes popupSlideIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(-10px) scale(0.9)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0) scale(1)',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                Aura Assist
              </Typography>
              <IconButton
                size="small"
                onClick={() => setAuraAssistPopup(prev => ({ ...prev, visible: false }))}
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'white', 
                lineHeight: 1.5, 
                fontSize: '0.85rem',
                maxHeight: '200px',
                overflowY: 'auto',
                pr: 0.5,
                wordBreak: 'break-word'
              }}
            >
              {auraAssistPopup.text}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Right Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', borderLeft: '1px solid', borderColor: 'divider' }}>
        {/* Tab Navigation */}
        <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', p: 0.5, gap: 0.5 }}>
          <InteractiveHoverButton
            text="Jewellery Controls"
            onClick={() => setRightSidebarTab('jewellery')}
            className={`flex-1 text-xs ${rightSidebarTab === 'jewellery' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border-border'}`}
          />
          <InteractiveHoverButton
            text="More"
            onClick={() => setRightSidebarTab('more')}
            className={`flex-1 text-xs ${rightSidebarTab === 'more' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border-border'}`}
          />
        </Box>

        {/* Tab Content */}
        {rightSidebarTab === 'jewellery' && (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Box sx={{ p: 1.5, display: 'grid', gap: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Jewellery Controls</Typography>
              <Box sx={{ position: 'relative', mb: 1 }}>
              <ButtonGroup orientation="vertical" variant="outlined" sx={{ gap: 1, width: '100%' }}>
                <Button
                  variant="contained"
                  onClick={handleGenerateClick}
                  disabled={isAIProcessing}
                  startIcon={isGenerateLoading ? <CircularProgress size={18} color="inherit" /> : <AutoFixHigh sx={{ fontSize: '1rem' }} />}
                  sx={{
                    background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
                    border: 'none',
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 2,
                    px: 2,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1a252f 0%, #000000 100%)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
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
                      left: '100%',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.6,
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  {isGenerateLoading ? 'Generating...' : 'Generate Jewellery'}
                </Button>
                <Button
                  onClick={handleHarmonizeClick}
                  disabled={isAIProcessing}
                  startIcon={isHarmonizeLoading ? <CircularProgress size={18} color="inherit" /> : <Settings sx={{ fontSize: '1rem' }} />}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 2,
                    px: 2,
                    color: 'text.primary',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                      border: '1px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
                    },
                    '&.Mui-disabled': {
                      opacity: 0.6,
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  {isHarmonizeLoading ? 'Harmonizing...' : 'Harmonize'}
                </Button>
              </ButtonGroup>
              {generationError && (
                <Typography variant="caption" color="error" sx={{ mt: 1, fontWeight: 600 }}>
                  {generationError}
                </Typography>
              )}
            {generationError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, fontWeight: 600 }}>
                {generationError}
              </Typography>
            )}
              <IconButton
                onClick={(e) => setJewelleryStyleAnchor(e.currentTarget)}
                sx={{
                  width: 32,
                  height: 32,
                  border: '1.5px solid',
                  borderColor: 'rgba(0,0,0,0.12)',
                  borderRadius: 1.5,
                  color: 'text.secondary',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  position: 'absolute',
                  top: '25%',
                  right: 8,
                  transform: 'translateY(-50%)',
                  zIndex: 1002,
                  pointerEvents: 'auto',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'linear-gradient(135deg, rgba(25, 118, 210, 0.04) 0%, rgba(25, 118, 210, 0.02) 100%)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    transform: 'translateY(calc(-50% - 1px))',
                  }
                }}
              >
                <DesignServices sx={{ fontSize: '1rem' }} />
              </IconButton>
              <IconButton
                onClick={(e) => setHarmonizeOptionsAnchor(e.currentTarget)}
                sx={{
                  width: 32,
                  height: 32,
                  border: '1.5px solid',
                  borderColor: 'rgba(0,0,0,0.12)',
                  borderRadius: 1.5,
                  color: 'text.secondary',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  position: 'absolute',
                  top: '75%',
                  right: 8,
                  transform: 'translateY(-50%)',
                  zIndex: 1002,
                  pointerEvents: 'auto',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'linear-gradient(135deg, rgba(25, 118, 210, 0.04) 0%, rgba(25, 118, 210, 0.02) 100%)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
                    transform: 'translateY(calc(-50% - 1px))',
                  }
                }}
              >
                <SettingsSuggest sx={{ fontSize: '1rem' }} />
              </IconButton>
              {/* Style menu */}
              <Menu
                anchorEl={jewelleryStyleAnchor}
                open={Boolean(jewelleryStyleAnchor)}
                onClose={() => setJewelleryStyleAnchor(null)}
                PaperProps={{ sx: { mt: 0.5, minWidth: 160, borderRadius: 1, p: 0 } }}
              >
                {[
                  'Temple Jewellery',
                  'Antique Jewellery',
                  'Victorian Jewellery',
                  'Jadau Jewellery',
                  'Kundan Meenakari',
                  'Polki Open Setting',
                ].map((opt) => (
                  <MenuItem key={opt} dense sx={{ py: 0.5, px: 1.25, fontSize: '0.82rem' }} onClick={() => { setSelectedJewelleryStyle(opt); setJewelleryStyleAnchor(null) }}>
                    {opt}
                  </MenuItem>
                ))}
              </Menu>
              {/* Harmonize Options menu */}
              <Menu
                anchorEl={harmonizeOptionsAnchor}
                open={Boolean(harmonizeOptionsAnchor)}
                onClose={() => setHarmonizeOptionsAnchor(null)}
                PaperProps={{ sx: { mt: 0.5, minWidth: 160, borderRadius: 1, p: 0 } }}
              >
                {['Ring','Earring','Necklace','Bracelet','Bangles','Pendant'].map((opt) => {
                  const checked = selectedHarmonizeOptions.includes(opt)
                  return (
                    <MenuItem
                      key={opt}
                      dense
                      sx={{ py: 0.5, px: 1.25, fontSize: '0.82rem' }}
                      onClick={() => {
                        setSelectedHarmonizeOptions((prev) => checked ? prev.filter(o => o !== opt) : [...prev, opt])
                      }}
                    >
                      <Checkbox checked={checked} size="small" sx={{ mr: 1 }} />
                      {opt}
                    </MenuItem>
                  )
                })}
              </Menu>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ p: 1.5, display: 'grid', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Stone Settings</Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 'bold' }}>Primary</Typography>
                  <StoneGrid selected={primaryStone} onOpen={(e) => { setStoneAnchor(e.currentTarget); setStoneType('primary') }} label={findStoneDetails(primaryStone).label} icon={findStoneDetails(primaryStone).icon} type="primary" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 'bold' }}>Secondary</Typography>
                  <StoneGrid selected={secondaryStone || ''} onOpen={(e) => { setStoneAnchor(e.currentTarget); setStoneType('secondary') }} label={secondaryStone ? findStoneDetails(secondaryStone).label : 'None'} icon={secondaryStone ? findStoneDetails(secondaryStone).icon : ''} type="secondary" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 'bold' }}>Metal</Typography>
                  <MetalGrid selected={metal} onOpen={(e) => setMetalAnchor(e.currentTarget)} label={METALS.find(m => m.key === metal)?.label || ''} />
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button 
                  component="label"
                  variant="contained"
                  startIcon={
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      '&::before': {
                        content: '""',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }
                    }} />
                  }
                  sx={(theme) => ({
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    py: 1.25,
                    px: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    ...(theme.palette.mode === 'dark'
                      ? {
                          backgroundColor: '#000',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                          '&:hover': {
                            backgroundColor: '#111',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.7)'
                          }
                        }
                      : {
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          color: 'text.primary',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
                            transform: 'translateY(-1px)',
                            border: '1px solid rgba(0,0,0,0.15)',
                          },
                        }),
                    '&:active': {
                      transform: 'translateY(0px)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      transition: 'left 0.6s ease-out',
                    },
                    '&:hover::before': {
                      left: '100%',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 0,
                      height: 0,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      transform: 'translate(-50%, -50%)',
                      transition: 'width 0.6s ease-out, height 0.6s ease-out',
                    },
                    '&:active::after': {
                      width: '200px',
                      height: '200px',
                    }
                  })}
                >
                  Upload Sketch
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                </Button>
                <Tooltip title="Remove Selected Image (Delete/Backspace)">
                  <span>
                    <IconButton
                      onClick={() => {
                        if (selectedImageId) {
                          setUploadedImages(prev => prev.filter(img => img.id !== selectedImageId))
                          setImageLayerMap(prev => {
                            const newMap = { ...prev }
                            delete newMap[selectedImageId]
                            return newMap
                          })
                          setSelectedImageId(null)
                        }
                      }}
                      disabled={!selectedImageId}
                      sx={{
                        color: 'error.main',
                        opacity: selectedImageId ? 1 : 0.3,
                        transition: 'all 0.2s ease-out',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white',
                          transform: 'scale(1.05)',
                        },
                        '&:disabled': {
                          opacity: 0.3,
                          cursor: 'not-allowed',
                        }
                      }}
                    >
                      <Close sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Context</Typography>
                <TextField
                  multiline
                  rows={3}
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Describe your jewelry design context, inspiration, or specific requirements..."
                  variant="outlined"
                  size="small"
                  sx={(theme) => ({
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.8rem',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main
                      }
                    }
                  })}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    console.log('Generate with context:', contextText)
                    // TODO: Implement generation with context
                  }}
                  sx={(theme) => ({
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    py: 1.25,
                    position: 'relative',
                    overflow: 'hidden',
                    ...(theme.palette.mode === 'dark'
                      ? {
                          backgroundColor: '#000',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                          '&:hover': {
                            backgroundColor: '#111',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.7)'
                          }
                        }
                      : {
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
                          border: '1px solid rgba(0,0,0,0.1)',
                          color: 'text.primary',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
                            transform: 'translateY(-1px)',
                            border: '1px solid rgba(0,0,0,0.15)',
                          },
                        }),
                    '&:active': {
                      transform: 'translateY(0px)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                      transition: 'left 0.6s ease-out',
                    },
                    '&:hover::before': {
                      left: '100%',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 0,
                      height: 0,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      transform: 'translate(-50%, -50%)',
                      transition: 'width 0.6s ease-out, height 0.6s ease-out',
                    },
                    '&:active::after': {
                      width: '200px',
                      height: '200px',
                    }
                  })}
                >
                  Generate
                </Button>
              </Box>
            </Box>
            
            {/* Motif Controls */}
            {selectedMotifId && (
              <Box sx={{ p: 1.5, display: 'grid', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Motif Controls</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Tooltip title="Duplicate Motif">
                    <IconButton
                      onClick={duplicateSelectedMotif}
                      sx={{
                        color: 'primary.main',
                        opacity: 0.8,
                        transition: 'all 0.2s ease-out',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'white',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <ContentCopy sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Selected Motif (Delete/Backspace)">
                    <IconButton
                      onClick={removeSelectedMotif}
                      sx={{
                        color: 'error.main',
                        opacity: 1,
                        transition: 'all 0.2s ease-out',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <Delete sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Selected: {insertedMotifs.find(m => m.id === selectedMotifId)?.name || 'Unknown'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {rightSidebarTab === 'more' && (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Box sx={{ p: 1.5, display: 'grid', gap: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Motif Library</Typography>
              
              
              {/* Create Motif Button */}
              <Button
                variant="contained"
                onClick={startCreatingMotif}
                disabled={isCreatingMotif}
                sx={{
                  background: isCreatingMotif 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                    : 'linear-gradient(135deg, #0a0a2e 0%, #16213e 50%, #000000 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 1.5,
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: isCreatingMotif 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                      : 'linear-gradient(135deg, #0f0f3a 0%, #1a2a4a 50%, #111111 100%)',
                    border: '1px solid rgba(0,0,0,0.15)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
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
                {isCreatingMotif ? 'Creating Motif...' : 'Create Motif'}
              </Button>

              {/* Save/Cancel buttons when creating motif */}
              {isCreatingMotif && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={saveMotif}
                    disabled={motifDrawingLines.length === 0}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      py: 1,
                      background: 'linear-gradient(135deg, #0a0a2e 0%, #16213e 50%, #008a73 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0f0f3a 0%, #1a2a4a 50%, #009688 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 138, 115, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                        color: 'text.secondary',
                        transform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }
                    }}
                  >
                    Save Motif
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={cancelMotifCreation}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      py: 1,
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                        backgroundColor: 'error.light',
                        color: 'error.dark'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}

              {/* Motif Gallery */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Your Motifs ({motifs.length})
                </Typography>
                
                {motifs.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 3, 
                    border: '2px dashed', 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    backgroundColor: 'action.hover'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No motifs created yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Click &quot;Create Motif&quot; to start drawing
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                    gap: 1 
                  }}>
                    {motifs.map((motif) => (
                      <Box
                        key={motif.id}
                        sx={{
                          aspectRatio: '1',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover',
                            transform: 'scale(1.05)'
                          }
                        }}
                        onClick={() => {
                          console.log('Selected motif:', motif.name)
                          insertMotif(motif)
                        }}
                      >
                        {renderMotifPreview(motif)}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Signature Style Section */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Signature Styles ({signatureStyles.length}/4)
                </Typography>
                
                <Button
                  component="label"
                  variant="contained"
                  disabled={signatureStyles.length >= 4}
                  sx={{
                    width: '100%',
                    background: signatureStyles.length >= 4 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 1.5,
                    color: 'text.primary',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: signatureStyles.length >= 4 
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                      border: '1px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
                  {signatureStyles.length >= 4 ? 'Maximum 4 styles reached' : 'Upload Signature Style'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleSignatureStyleUpload}
                    disabled={signatureStyles.length >= 4}
                  />
                </Button>

                {/* Signature Style Gallery */}
                {signatureStyles.length > 0 && (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                    gap: 1,
                    mt: 1
                  }}>
                    {signatureStyles.map((style) => (
                      <Box
                        key={style.id}
                        sx={{
                          aspectRatio: '1',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover',
                            transform: 'scale(1.05)'
                          }
                        }}
                        onClick={() => {
                          console.log('Selected signature style:', style.name)
                          // TODO: Apply signature style to canvas or selected elements
                        }}
                      >
                        <img
                          src={style.url}
                          alt={style.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSignatureStyle(style.id)
                          }}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 16,
                            height: 16,
                            backgroundColor: 'error.main',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'error.dark'
                            }
                          }}
                        >
                          <Close sx={{ fontSize: '0.7rem' }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
              
              {/* Divider */}
              <Divider sx={{ my: 2 }} />
              
              {/* Content Builder Section */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Content Builder
              </Typography>
              
              {/* Style and Region Dropdowns */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={(e) => setStyleAnchor(e.currentTarget)}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    py: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  Style: {selectedStyle}
                </Button>
                <Button
                  variant="outlined"
                  onClick={(e) => setRegionAnchor(e.currentTarget)}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    py: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  Region: {selectedRegion}
                </Button>
              </Box>
              
              {/* Content Details Text Field */}
              <TextField
                multiline
                rows={3}
                value={contentDetails}
                onChange={(e) => setContentDetails(e.target.value)}
                placeholder="Enter content details and context for your jewelry design..."
                variant="outlined"
                size="small"
                sx={(theme) => ({
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main
                    }
                  }
                })}
              />
              
              {/* Generate Content Button */}
              <Button
                variant="contained"
                onClick={() => {
                  console.log('Generate Content clicked', {
                    style: selectedStyle,
                    region: selectedRegion,
                    contentDetails: contentDetails
                  })
                  // TODO: Implement content generation
                }}
                disabled={!contentDetails.trim()}
                sx={{
                  background: contentDetails.trim() 
                    ? 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)'
                    : theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
                      : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                  border: 'none',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 1.5,
                  boxShadow: contentDetails.trim() 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  color: contentDetails.trim() ? 'white' : theme.palette.mode === 'dark' ? 'white' : 'text.secondary',
                  '&:hover': {
                    background: contentDetails.trim() 
                      ? 'linear-gradient(135deg, #1a252f 0%, #000000 100%)'
                      : theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, #525252 0%, #757575 100%)'
                        : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                    boxShadow: contentDetails.trim() 
                      ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                      : '0 4px 16px rgba(0, 0, 0, 0.1)',
                    transform: contentDetails.trim() ? 'translateY(-2px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: contentDetails.trim() ? 'translateY(0px)' : 'none',
                    boxShadow: contentDetails.trim() 
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
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
                    transition: 'left 0.6s ease-out',
                  },
                  '&:hover::before': {
                    left: contentDetails.trim() ? '100%' : '-100%',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.6s ease-out, height 0.6s ease-out',
                  },
                  '&:active::after': {
                    width: contentDetails.trim() ? '200px' : '0px',
                    height: contentDetails.trim() ? '200px' : '0px',
                  }
                }}
              >
                Generate Content
              </Button>
            </Box>
          </Box>
        )}

        <Menu anchorEl={stoneAnchor} open={Boolean(stoneAnchor)} onClose={() => setStoneAnchor(null)}>
          {STONES.map(s => (
            <MenuItem 
              key={s.key} 
              onClick={() => { 
                if (s.hasSubmenu) {
                  setSapphireSubmenuAnchor(stoneAnchor)
                } else {
                  stoneType === 'primary' ? setPrimaryStone(s.key) : setSecondaryStone(s.key); 
                  setStoneAnchor(null)
                }
              }}
            >
              {s.label}
              {s.hasSubmenu && <span style={{ fontSize: '0.7em', marginLeft: '8px' }}>▶</span>}
            </MenuItem>
          ))}
        </Menu>

        <Menu 
          anchorEl={sapphireSubmenuAnchor} 
          open={Boolean(sapphireSubmenuAnchor)} 
          onClose={() => setSapphireSubmenuAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {SAPPHIRE_VARIANTS.map(s => (
            <MenuItem 
              key={s.key} 
              onClick={() => { 
                stoneType === 'primary' ? setPrimaryStone(s.key) : setSecondaryStone(s.key); 
                setSapphireSubmenuAnchor(null)
                setStoneAnchor(null)
              }}
            >
              {s.label}
            </MenuItem>
          ))}
        </Menu>

        <Menu anchorEl={metalAnchor} open={Boolean(metalAnchor)} onClose={() => setMetalAnchor(null)}>
          {METALS.map(m => (
            <MenuItem key={m.key} onClick={() => { setMetal(m.key); setMetalAnchor(null) }}>{m.label}</MenuItem>
          ))}
        </Menu>

        {/* Style Menu */}
        <Menu anchorEl={styleAnchor} open={Boolean(styleAnchor)} onClose={() => setStyleAnchor(null)}>
          {STYLES.map(style => (
            <MenuItem key={style} onClick={() => { setSelectedStyle(style); setStyleAnchor(null) }}>
              {style}
            </MenuItem>
          ))}
        </Menu>

        {/* Region Menu */}
        <Menu anchorEl={regionAnchor} open={Boolean(regionAnchor)} onClose={() => setRegionAnchor(null)}>
          {REGIONS.map(region => (
            <MenuItem key={region} onClick={() => { setSelectedRegion(region); setRegionAnchor(null) }}>
              {region}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Mobile Left Drawer */}
      <Drawer 
        anchor="left" 
        open={leftDrawerOpen} 
        onClose={() => setLeftDrawerOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: 260, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Layers</Typography>
          </Box>
          <List dense sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
            {layers.map(l => (
                    <ListItem key={l.id} onClick={() => {
                      console.log('Mobile: Switching to layer:', l.id)
                      setActiveLayerId(l.id)
                    }} sx={{ cursor: 'pointer', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 1, mb: 0.5, backgroundColor: l.id === activeLayerId ? 'action.selected' : 'transparent' }}>
                <ListItemText primary={l.name} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => {
                    console.log('Mobile: Toggling visibility for layer:', l.id, 'Current visible:', l.visible)
                    setLayers(prev => prev.map(x => x.id === l.id ? { ...x, visible: !x.visible } : x))
                  }}>
                    {l.visible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                  </IconButton>
                  {layers.length > 1 && (
                    <IconButton edge="end" size="small" onClick={() => {
                      // Delete layer and clean up mappings
                      setLayers(prev => prev.filter(x => x.id !== l.id))
                      // Move content from deleted layer to the first remaining layer
                      const remainingLayers = layers.filter(x => x.id !== l.id)
                      if (remainingLayers.length > 0) {
                        const targetLayerId = remainingLayers[0].id
                        setLineLayerMap(prev => {
                          const newMap = { ...prev }
                          Object.keys(newMap).forEach(key => {
                            const numKey = parseInt(key)
                            if (newMap[numKey] === l.id) {
                              newMap[numKey] = targetLayerId
                            }
                          })
                          return newMap
                        })
                        setImageLayerMap(prev => {
                          const newMap = { ...prev }
                          Object.keys(newMap).forEach(key => {
                            if (newMap[key] === l.id) {
                              newMap[key] = targetLayerId
                            }
                          })
                          return newMap
                        })
                        // Set active layer to the target layer
                        setActiveLayerId(targetLayerId)
                      }
                    }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button fullWidth startIcon={<Add />} onClick={() => {
              const newLayerId = String(Date.now())
              setLayers(prev => [...prev, { id: newLayerId, name: `Layer ${prev.length + 1}`, visible: true, opacity: 1 }])
              setActiveLayerId(newLayerId)
            }}>Add Layer</Button>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Brush Size</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                {size}px
              </Typography>
            </Box>
            <Slider
              min={1}
              max={20}
              value={size}
              onChange={(_, v) => setSize(v as number)}
              sx={{
                height: 6,
                padding: '12px 0',
                '& .MuiSlider-rail': {
                  opacity: 0.35,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 999
                },
                '& .MuiSlider-track': {
                  border: 'none',
                  background: 'linear-gradient(90deg, #00E5FF 0%, #7C4DFF 100%)',
                  boxShadow: '0 4px 14px rgba(124,77,255,0.35)',
                  borderRadius: 999
                },
                '& .MuiSlider-thumb': {
                  width: 14,
                  height: 14,
                  backgroundColor: '#fff',
                  border: '1px solid rgba(0,0,0,0.25)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(124,77,255,0.16)'
                  },
                  '&::before': { boxShadow: 'none' }
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
              <Typography variant="subtitle2">Brush Opacity</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                {Math.round(brushOpacity * 100)}%
              </Typography>
            </Box>
            <Slider
              min={0.1}
              max={1}
              step={0.05}
              value={brushOpacity}
              onChange={(_, v) => setBrushOpacity(v as number)}
              sx={{
                height: 6,
                padding: '12px 0',
                '& .MuiSlider-rail': {
                  opacity: 0.35,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 999
                },
                '& .MuiSlider-track': {
                  border: 'none',
                  background: 'linear-gradient(90deg, #00C9A7 0%, #6E8EF5 100%)',
                  boxShadow: '0 4px 14px rgba(0,201,167,0.35)',
                  borderRadius: 999
                },
                '& .MuiSlider-thumb': {
                  width: 14,
                  height: 14,
                  backgroundColor: '#fff',
                  border: '1px solid rgba(0,0,0,0.25)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(0,201,167,0.16)'
                  },
                  '&::before': { boxShadow: 'none' }
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2">Canvas Influence</Typography>
                <Tooltip title="Sets how much the AI should stick to your sketch. 100% follows it exactly, lower percentages allow more AI interpretation.">
                  <IconButton size="small" sx={{ p: 0.25, color: 'text.secondary' }}>
                    <Info sx={{ fontSize: '0.875rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                {canvasInfluence}%
              </Typography>
            </Box>
            <Slider
              min={10}
              max={100}
              step={1}
              value={canvasInfluence}
              onChange={(_, v) => setCanvasInfluence(v as number)}
              sx={{
                height: 6,
                padding: '12px 0',
                '& .MuiSlider-rail': {
                  opacity: 0.35,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 999
                },
                '& .MuiSlider-track': {
                  border: 'none',
                  background: 'linear-gradient(90deg, #FF6B6B 0%, #FFD93D 100%)',
                  boxShadow: '0 4px 14px rgba(255,107,107,0.35)',
                  borderRadius: 999
                },
                '& .MuiSlider-thumb': {
                  width: 14,
                  height: 14,
                  backgroundColor: '#fff',
                  border: '1px solid rgba(0,0,0,0.25)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(4px)',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(255,107,107,0.16)'
                  },
                  '&::before': { boxShadow: 'none' }
                }
              }}
            />
            {isApplePencilActive && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Pressure</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: 8, 
                    bgcolor: 'grey.200', 
                    borderRadius: 1, 
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <Box sx={{ 
                      width: `${currentPressure * 100}%`, 
                      height: '100%', 
                      bgcolor: 'primary.main',
                      transition: 'width 0.1s ease-out'
                    }} />
                  </Box>
                  <Typography variant="caption" sx={{ minWidth: '35px', textAlign: 'right' }}>
                    {Math.round(currentPressure * 100)}%
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {isApplePencilActive ? 'Apple Pencil detected - pressure sensitive drawing enabled' : 'Tip: Hold mouse to draw, release to stop.'}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2 }}>
            <UsageBar usageStatus={usageStatus} onReset={resetUsage} />
          </Box>
        </Box>
      </Drawer>

      {/* Mobile Right Drawer */}
      <Drawer 
        anchor="right" 
        open={rightDrawerOpen} 
        onClose={() => setRightDrawerOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Mobile Tab Navigation */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', p: 0.5, gap: 0.5 }}>
            <InteractiveHoverButton
              text="Jewellery Controls"
              onClick={() => setRightSidebarTab('jewellery')}
              className={`flex-1 text-xs ${rightSidebarTab === 'jewellery' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border-border'}`}
            />
            <InteractiveHoverButton
              text="More"
              onClick={() => setRightSidebarTab('more')}
              className={`flex-1 text-xs ${rightSidebarTab === 'more' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border-border'}`}
            />
          </Box>

          {/* Mobile Tab Content */}
          {rightSidebarTab === 'jewellery' && (
            <Box sx={{ p: 1.5, display: 'grid', gap: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Jewellery Controls</Typography>
            <ButtonGroup size="small" orientation="vertical" variant="outlined" sx={{ gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleGenerateClick}
                disabled={isAIProcessing}
                startIcon={isGenerateLoading ? <CircularProgress size={18} color="inherit" /> : <AutoFixHigh sx={{ fontSize: '1rem' }} />}
                sx={{
                  background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
                  border: 'none',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 1.5,
                  px: 2,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a252f 0%, #000000 100%)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
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
                    left: '100%',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }
                }}
              >
                {isGenerateLoading ? 'Generating...' : 'Generate Jewellery'}
              </Button>
              <Button 
                onClick={handleHarmonizeClick}
                disabled={isAIProcessing}
                startIcon={isHarmonizeLoading ? <CircularProgress size={18} color="inherit" /> : <Settings sx={{ fontSize: '1rem' }} />}
                sx={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 1.5,
                  color: 'text.primary',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                    border: '1px solid rgba(0,0,0,0.15)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
                  },
                  '&.Mui-disabled': {
                    opacity: 0.6,
                    cursor: 'not-allowed'
                  }
                }}
              >
                {isHarmonizeLoading ? 'Harmonizing...' : 'Harmonize'}
              </Button>
            </ButtonGroup>
            {generationError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, fontWeight: 600 }}>
                {generationError}
              </Typography>
            )}
            <Divider />
            <Box sx={{ p: 1.5, display: 'grid', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Stone Settings</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 'bold' }}>Primary</Typography>
                <StoneGrid selected={primaryStone} onOpen={(e) => { setStoneAnchor(e.currentTarget); setStoneType('primary') }} label={findStoneDetails(primaryStone).label} icon={findStoneDetails(primaryStone).icon} type="primary" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 'bold' }}>Secondary</Typography>
                <StoneGrid selected={secondaryStone || ''} onOpen={(e) => { setStoneAnchor(e.currentTarget); setStoneType('secondary') }} label={secondaryStone ? findStoneDetails(secondaryStone).label : 'None'} icon={secondaryStone ? findStoneDetails(secondaryStone).icon : ''} type="secondary" />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 'bold' }}>Metal</Typography>
                <MetalGrid selected={metal} onOpen={(e) => setMetalAnchor(e.currentTarget)} label={METALS.find(m => m.key === metal)?.label || ''} />
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button 
                component="label"
                variant="contained"
                startIcon={
                  <Box sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    '&::before': {
                      content: '""',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }
                  }} />
                }
                sx={(theme) => ({
                  flex: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: 1.25,
                  px: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(theme.palette.mode === 'dark'
                    ? {
                        backgroundColor: '#000',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                        '&:hover': {
                          backgroundColor: '#111',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.7)'
                        }
                      }
                    : {
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        color: 'text.primary',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
                          transform: 'translateY(-1px)',
                          border: '1px solid rgba(0,0,0,0.15)',
                        },
                      }),
                  '&:active': {
                    transform: 'translateY(0px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                    transition: 'left 0.6s ease-out',
                  },
                  '&:hover::before': {
                    left: '100%',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.6s ease-out, height 0.6s ease-out',
                  },
                  '&:active::after': {
                    width: '200px',
                    height: '200px',
                  }
                })}
              >
                Upload Sketch
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        const img = new Image()
                        img.onload = () => {
                          const newImage = {
                            id: String(Date.now()),
                            src: event.target?.result as string,
                            x: Math.random() * (canvasSize.width - img.width),
                            y: Math.random() * (canvasSize.height - img.height),
                            width: Math.min(img.width, 200),
                            height: Math.min(img.height, 200),
                            rotation: 0
                          }
                          setUploadedImages(prev => [...prev, newImage])
                          setImageLayerMap(prev => ({ ...prev, [newImage.id]: activeLayerId }))
                          setSelectedImageId(newImage.id)
                        }
                        img.src = event.target?.result as string
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </Button>
              <Tooltip title="Generate with AI">
                <IconButton
                  onClick={() => {
                    console.log('Generate with AI clicked')
                    // TODO: Implement AI generation
                  }}
                  sx={{
                    color: 'primary.main',
                    opacity: 0.8,
                    transition: 'all 0.2s ease-out',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                      transform: 'scale(1.05)',
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
                      left: '100%',
                    }
                  }}
                >
                  <Campaign sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove Selected Image (Delete/Backspace)">
                <IconButton
                  onClick={() => {
                    if (selectedImageId) {
                      setUploadedImages(prev => prev.filter(img => img.id !== selectedImageId))
                      setImageLayerMap(prev => {
                        const newMap = { ...prev }
                        delete newMap[selectedImageId]
                        return newMap
                      })
                      setSelectedImageId(null)
                    }
                  }}
                  disabled={!selectedImageId}
                  sx={{
                    color: 'error.main',
                    opacity: selectedImageId ? 1 : 0.3,
                    transition: 'all 0.2s ease-out',
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'white',
                      transform: 'scale(1.05)',
                    },
                    '&:disabled': {
                      opacity: 0.3,
                      cursor: 'not-allowed',
                    }
                  }}
                >
                  <Close sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Context</Typography>
              <TextField
                multiline
                rows={3}
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Describe your jewelry design context, inspiration, or specific requirements..."
                variant="outlined"
                size="small"
                sx={(theme) => ({
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main
                    }
                  }
                })}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  console.log('Generate with context:', contextText)
                  // TODO: Implement generation with context
                }}
                sx={(theme) => ({
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: 1.25,
                  position: 'relative',
                  overflow: 'hidden',
                  ...(theme.palette.mode === 'dark'
                    ? {
                        backgroundColor: '#000',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                        '&:hover': {
                          backgroundColor: '#111',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.7)'
                        }
                      }
                    : {
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        color: 'text.primary',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #f8f8f8 0%, #f0f0f0 100%)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
                          transform: 'translateY(-1px)',
                          border: '1px solid rgba(0,0,0,0.15)',
                        },
                      }),
                  '&:active': {
                    transform: 'translateY(0px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                    transition: 'left 0.6s ease-out',
                  },
                  '&:hover::before': {
                    left: '100%',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.6s ease-out, height 0.6s ease-out',
                  },
                  '&:active::after': {
                    width: '200px',
                    height: '200px',
                  }
                })}
              >
                Generate
              </Button>
            </Box>
            
            {/* Motif Controls */}
            {selectedMotifId && (
              <Box sx={{ p: 1.5, display: 'grid', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Motif Controls</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Tooltip title="Duplicate Motif">
                    <IconButton
                      onClick={duplicateSelectedMotif}
                      sx={{
                        color: 'primary.main',
                        opacity: 0.8,
                        transition: 'all 0.2s ease-out',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          color: 'white',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <ContentCopy sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove Selected Motif (Delete/Backspace)">
                    <IconButton
                      onClick={removeSelectedMotif}
                      sx={{
                        color: 'error.main',
                        opacity: 1,
                        transition: 'all 0.2s ease-out',
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white',
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <Delete sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Selected: {insertedMotifs.find(m => m.id === selectedMotifId)?.name || 'Unknown'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        )}

        {rightSidebarTab === 'more' && (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            <Box sx={{ p: 1.5, display: 'grid', gap: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Motif Library</Typography>
              
              
              {/* Create Motif Button */}
              <Button
                variant="contained"
                onClick={startCreatingMotif}
                disabled={isCreatingMotif}
                sx={{
                  background: isCreatingMotif 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                    : 'linear-gradient(135deg, #0a0a2e 0%, #16213e 50%, #000000 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 1.5,
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: isCreatingMotif 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                      : 'linear-gradient(135deg, #0f0f3a 0%, #1a2a4a 50%, #111111 100%)',
                    border: '1px solid rgba(0,0,0,0.15)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
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
                {isCreatingMotif ? 'Creating Motif...' : 'Create Motif'}
              </Button>

              {/* Save/Cancel buttons when creating motif */}
              {isCreatingMotif && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={saveMotif}
                    disabled={motifDrawingLines.length === 0}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      py: 1,
                      background: 'linear-gradient(135deg, #0a0a2e 0%, #16213e 50%, #008a73 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0f0f3a 0%, #1a2a4a 50%, #009688 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 138, 115, 0.3)',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                        color: 'text.secondary',
                        transform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }
                    }}
                  >
                    Save Motif
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={cancelMotifCreation}
                    sx={{
                      flex: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      py: 1,
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                        backgroundColor: 'error.light',
                        color: 'error.dark'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}

              {/* Motif Gallery */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Your Motifs ({motifs.length})
                </Typography>
                
                {motifs.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 3, 
                    border: '2px dashed', 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    backgroundColor: 'action.hover'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No motifs created yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Click &quot;Create Motif&quot; to start drawing
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                    gap: 1 
                  }}>
                    {motifs.map((motif) => (
                      <Box
                        key={motif.id}
                        sx={{
                          aspectRatio: '1',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover',
                            transform: 'scale(1.05)'
                          }
                        }}
                        onClick={() => {
                          console.log('Selected motif:', motif.name)
                          insertMotif(motif)
                        }}
                      >
                        {renderMotifPreview(motif)}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              {/* Signature Style Section */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Signature Styles ({signatureStyles.length}/4)
                </Typography>
                
                <Button
                  component="label"
                  variant="contained"
                  disabled={signatureStyles.length >= 4}
                  sx={{
                    width: '100%',
                    background: signatureStyles.length >= 4 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 1.5,
                    color: 'text.primary',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      background: signatureStyles.length >= 4 
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                      border: '1px solid rgba(0,0,0,0.15)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
                  {signatureStyles.length >= 4 ? 'Maximum 4 styles reached' : 'Upload Signature Style'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleSignatureStyleUpload}
                    disabled={signatureStyles.length >= 4}
                  />
                </Button>

                {/* Signature Style Gallery */}
                {signatureStyles.length > 0 && (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                    gap: 1,
                    mt: 1
                  }}>
                    {signatureStyles.map((style) => (
                      <Box
                        key={style.id}
                        sx={{
                          aspectRatio: '1',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover',
                            transform: 'scale(1.05)'
                          }
                        }}
                        onClick={() => {
                          console.log('Selected signature style:', style.name)
                          // TODO: Apply signature style to canvas or selected elements
                        }}
                      >
                        <img
                          src={style.url}
                          alt={style.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSignatureStyle(style.id)
                          }}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 16,
                            height: 16,
                            backgroundColor: 'error.main',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'error.dark'
                            }
                          }}
                        >
                          <Close sx={{ fontSize: '0.7rem' }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
              
              {/* Divider */}
              <Divider sx={{ my: 2 }} />
              
              {/* Content Builder Section */}
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Content Builder
              </Typography>
              
              {/* Style and Region Dropdowns */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={(e) => setStyleAnchor(e.currentTarget)}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    py: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  Style: {selectedStyle}
                </Button>
                <Button
                  variant="outlined"
                  onClick={(e) => setRegionAnchor(e.currentTarget)}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    py: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  Region: {selectedRegion}
                </Button>
              </Box>
              
              {/* Content Details Text Field */}
              <TextField
                multiline
                rows={3}
                value={contentDetails}
                onChange={(e) => setContentDetails(e.target.value)}
                placeholder="Enter content details and context for your jewelry design..."
                variant="outlined"
                size="small"
                sx={(theme) => ({
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main
                    }
                  }
                })}
              />
              
              {/* Generate Content Button */}
              <Button
                variant="contained"
                onClick={() => {
                  console.log('Generate Content clicked', {
                    style: selectedStyle,
                    region: selectedRegion,
                    contentDetails: contentDetails
                  })
                  // TODO: Implement content generation
                }}
                disabled={!contentDetails.trim()}
                sx={{
                  background: contentDetails.trim() 
                    ? 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)'
                    : theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
                      : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                  border: 'none',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 1.5,
                  boxShadow: contentDetails.trim() 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  color: contentDetails.trim() ? 'white' : theme.palette.mode === 'dark' ? 'white' : 'text.secondary',
                  '&:hover': {
                    background: contentDetails.trim() 
                      ? 'linear-gradient(135deg, #1a252f 0%, #000000 100%)'
                      : theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, #525252 0%, #757575 100%)'
                        : 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)',
                    boxShadow: contentDetails.trim() 
                      ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                      : '0 4px 16px rgba(0, 0, 0, 0.1)',
                    transform: contentDetails.trim() ? 'translateY(-2px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:active': {
                    transform: contentDetails.trim() ? 'translateY(0px)' : 'none',
                    boxShadow: contentDetails.trim() 
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 16px rgba(0, 0, 0, 0.1)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
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
                    transition: 'left 0.6s ease-out',
                  },
                  '&:hover::before': {
                    left: contentDetails.trim() ? '100%' : '-100%',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.6s ease-out, height 0.6s ease-out',
                  },
                  '&:active::after': {
                    width: contentDetails.trim() ? '200px' : '0px',
                    height: contentDetails.trim() ? '200px' : '0px',
                  }
                }}
              >
                Generate Content
              </Button>
            </Box>
          </Box>
        )}
        </Box>
      </Drawer>

      {/* Mobile Floating Action Buttons */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          left: 16, 
          display: { xs: 'flex', md: 'none' },
          zIndex: 1000
        }}
        onClick={() => setLeftDrawerOpen(true)}
      >
        <LayersIcon />
      </Fab>
      <Fab
        color="secondary"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16, 
          display: { xs: 'flex', md: 'none' },
          zIndex: 1000
        }}
        onClick={() => setRightDrawerOpen(true)}
      >
        <Settings />
      </Fab>

      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return
          setSnackbar(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(null)}
          severity={snackbar?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// Helpers / small presentational components

function StoneGrid({ selected, onOpen, label, icon, type }: { selected: string; onOpen: (e: any) => void; label: string; icon: string; type: 'primary' | 'secondary' }) {
  // Modern minimal icons
  const getIcon = () => {
    if (type === 'primary') {
      // Solitaire icon - single diamond
      return (
        <Box sx={{ 
          width: 20, 
          height: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative'
        }}>
          <Box sx={{
            width: 12,
            height: 12,
            border: '2px solid',
            borderColor: 'text.primary',
            borderRadius: '50%',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 6,
              height: 6,
              border: '1px solid',
              borderColor: 'text.primary',
              borderRadius: '50%',
            }
          }} />
        </Box>
      )
    } else {
      // Small stones icon - multiple small diamonds
      return (
        <Box sx={{ 
          width: 20, 
          height: 20, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 0.5
        }}>
          <Box sx={{
            width: 4,
            height: 4,
            border: '1px solid',
            borderColor: 'text.primary',
            borderRadius: '50%',
          }} />
          <Box sx={{
            width: 4,
            height: 4,
            border: '1px solid',
            borderColor: 'text.primary',
            borderRadius: '50%',
          }} />
          <Box sx={{
            width: 4,
            height: 4,
            border: '1px solid',
            borderColor: 'text.primary',
            borderRadius: '50%',
          }} />
        </Box>
      )
    }
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 1, aspectRatio: '1', width: 60, height: 60 }}>
      <CardActionArea 
        onClick={onOpen} 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 0.5,
          height: '100%',
          minHeight: 60
        }}
      >
        <MUICardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, p: 0 }}>
          {getIcon()}
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.6rem', lineHeight: 1 }}>{label}</Typography>
        </MUICardContent>
      </CardActionArea>
    </Card>
  )
}

function MetalGrid({ selected, onOpen, label }: { selected: string; onOpen: (e: any) => void; label: string }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 1, aspectRatio: '1', width: 60, height: 60 }}>
      <CardActionArea 
        onClick={onOpen} 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 0.5,
          height: '100%',
          minHeight: 60
        }}
      >
        <MUICardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, p: 0 }}>
          <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.6rem', lineHeight: 1 }}>{label}</Typography>
        </MUICardContent>
      </CardActionArea>
    </Card>
  )
}


