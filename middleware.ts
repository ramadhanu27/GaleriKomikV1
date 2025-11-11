/**
 * Next.js Middleware
 * Handles authentication and security headers
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/komik',
  '/chapter',
  '/api/komiku',
]

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/bookmarks',
  '/api/history',
  '/api/profile',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route requires authentication
  const isProtectedAPI = PROTECTED_API_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  if (isProtectedAPI) {
    // Check for access token in HttpOnly cookie
    const accessToken = request.cookies.get('arkomik-access-token')
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
  
  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Add pathname to headers for layout
  response.headers.set('x-pathname', pathname)
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
