import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if user is on mobile device
  const userAgent = request.headers.get('user-agent') || ''
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent)
  
  // For testing: Allow manual access to mcanvas without redirects
  // Only redirect if it's a real mobile device (not tablet) and trying to access canvas
  if (isMobile && !isTablet && pathname.startsWith('/canvas/') && !pathname.includes('mcanvas')) {
    // Redirect to mobile canvas
    const url = request.nextUrl.clone()
    url.pathname = '/mcanvas'
    return NextResponse.redirect(url)
  }
  
  // Redirect mobile users trying to access root to mcanvas
  if (isMobile && !isTablet && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/mcanvas'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
