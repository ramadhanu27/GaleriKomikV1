/**
 * Server-Side Cookie Management
 * HttpOnly cookies for secure token storage with encryption
 */

import { cookies } from 'next/headers'
import { encryptToken, decryptToken, isEncrypted } from './encryption'

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'arkomik-access-token',
  REFRESH_TOKEN: 'arkomik-refresh-token',
  SESSION: 'arkomik-session',
} as const

// Cookie options for production
export const COOKIE_OPTIONS = {
  httpOnly: true,      // Cannot be accessed by JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

// Short-lived access token (15 minutes)
export const ACCESS_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 15, // 15 minutes
}

// Long-lived refresh token (7 days)
export const REFRESH_TOKEN_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

/**
 * Set authentication cookies (server-side only)
 * Tokens are encrypted before storage
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  
  // Encrypt tokens before storing
  const encryptedAccessToken = encryptToken(accessToken)
  const encryptedRefreshToken = encryptToken(refreshToken)
  
  // Set access token (short-lived, encrypted)
  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, encryptedAccessToken, ACCESS_TOKEN_OPTIONS)
  
  // Set refresh token (long-lived, encrypted)
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, encryptedRefreshToken, REFRESH_TOKEN_OPTIONS)
  
  console.log('🔐 Tokens encrypted and stored in HttpOnly cookies')
}

/**
 * Get access token from cookie (server-side only)
 * Automatically decrypts the token
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const encryptedToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)
  
  if (!encryptedToken?.value) return null
  
  // Decrypt token before returning
  const decryptedToken = isEncrypted(encryptedToken.value)
    ? decryptToken(encryptedToken.value)
    : encryptedToken.value // Backward compatibility
  
  return decryptedToken
}

/**
 * Get refresh token from cookie (server-side only)
 * Automatically decrypts the token
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const encryptedToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)
  
  if (!encryptedToken?.value) return null
  
  // Decrypt token before returning
  const decryptedToken = isEncrypted(encryptedToken.value)
    ? decryptToken(encryptedToken.value)
    : encryptedToken.value // Backward compatibility
  
  return decryptedToken
}

/**
 * Clear all authentication cookies (server-side only)
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN)
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN)
  cookieStore.delete(COOKIE_NAMES.SESSION)
}

/**
 * Set session data cookie (for user info, not tokens)
 */
export async function setSessionCookie(sessionData: {
  userId: string
  email: string
  username?: string
}) {
  const cookieStore = await cookies()
  
  // Store non-sensitive session data
  // This can be read by client but doesn't contain tokens
  cookieStore.set(
    COOKIE_NAMES.SESSION,
    JSON.stringify(sessionData),
    {
      ...COOKIE_OPTIONS,
      httpOnly: false, // Allow client to read user info
    }
  )
}

/**
 * Get session data from cookie
 */
export async function getSessionCookie() {
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAMES.SESSION)
  
  if (!session?.value) return null
  
  try {
    return JSON.parse(session.value)
  } catch {
    return null
  }
}
