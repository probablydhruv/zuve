'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MobileCanvas from '@/components/mobile/MobileCanvas'

function MobileCanvasPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check for testing bypass parameter
    const urlParams = new URLSearchParams(window.location.search)
    const forceMobile = urlParams.get('mobile') === 'true'
    
    // Check if device is mobile (excluding tablets/iPads)
    const checkMobile = () => {
      const userAgent = navigator.userAgent
      const isMobileDevice = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent)
      
      // For testing: also check if we're in mobile viewport or force parameter
      const isMobileViewport = window.innerWidth < 768
      
      return forceMobile || (isMobileDevice && !isTablet) || isMobileViewport
    }

    const handleResize = () => {
      const mobile = checkMobile()
      setIsMobile(mobile)
      
      // Redirect desktop users to regular canvas (unless forced)
      if (!mobile && !forceMobile) {
        const projectId = searchParams.get('projectId')
        if (projectId) {
          router.push(`/canvas/${projectId}`)
        } else {
          router.push('/canvas/1')
        }
      }
    }

    // Initial check
    handleResize()

    // Listen for resize events (when dev tools change device)
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [router, searchParams])

  if (!isMobile) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2>Redirecting to desktop canvas...</h2>
        <p>This page is optimized for mobile devices.</p>
      </div>
    )
  }

  const projectId = searchParams.get('projectId')
  return <MobileCanvas projectId={projectId || undefined} />
}

export default function MobileCanvasPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <MobileCanvasPageContent />
    </Suspense>
  )
}
