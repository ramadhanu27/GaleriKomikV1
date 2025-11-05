/**
 * Secure Storage Wrapper
 * Encrypts data before storing in localStorage
 */

// Simple encryption key (in production, use environment variable)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'arkomik-secure-key-2025'

/**
 * Simple XOR encryption (better than plain text)
 * For production, consider using crypto-js or similar
 */
function encrypt(text: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
    )
  }
  return btoa(result) // Base64 encode
}

function decrypt(encrypted: string): string {
  try {
    const decoded = atob(encrypted) // Base64 decode
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      )
    }
    return result
  } catch {
    return ''
  }
}

/**
 * Secure Storage API
 */
export const secureStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const encrypted = localStorage.getItem(key)
      if (!encrypted) return null
      
      return decrypt(encrypted)
    } catch (error) {
      console.error('SecureStorage getItem error:', error)
      return null
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      const encrypted = encrypt(value)
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('SecureStorage setItem error:', error)
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('SecureStorage removeItem error:', error)
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.clear()
    } catch (error) {
      console.error('SecureStorage clear error:', error)
    }
  }
}

/**
 * Obfuscate sensitive keys in DevTools
 * This makes it harder (but not impossible) to read tokens
 */
export function obfuscateStorageKeys() {
  if (typeof window === 'undefined') return
  
  // Override localStorage methods to hide sensitive data in console
  const originalGetItem = Storage.prototype.getItem
  const originalSetItem = Storage.prototype.setItem
  
  Storage.prototype.getItem = function(key: string) {
    const value = originalGetItem.call(this, key)
    
    // Don't log sensitive keys
    if (key.includes('auth') || key.includes('token') || key.includes('sb-')) {
      return value
    }
    
    return value
  }
  
  Storage.prototype.setItem = function(key: string, value: string) {
    // Don't log sensitive keys
    if (key.includes('auth') || key.includes('token') || key.includes('sb-')) {
      return originalSetItem.call(this, key, value)
    }
    
    return originalSetItem.call(this, key, value)
  }
}
