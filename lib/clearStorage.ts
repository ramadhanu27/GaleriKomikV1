/**
 * Utility functions to clear browser storage
 * Use these to clean up site data
 */

/**
 * Clear all authentication-related data from localStorage
 */
export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return

  try {
    // Remove specific auth key
    localStorage.removeItem('arkomik-auth')
    
    // Remove any Supabase-related keys
    Object.keys(localStorage).forEach(key => {
      if (
        key.startsWith('sb-') || 
        key.includes('auth') || 
        key.includes('supabase')
      ) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('✅ Auth storage cleared')
  } catch (error) {
    console.error('Error clearing auth storage:', error)
  }
}

/**
 * Clear all localStorage data (use with caution!)
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.clear()
    sessionStorage.clear()
    console.log('✅ All storage cleared')
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}

/**
 * Get current storage usage
 */
export function getStorageInfo(): {
  keys: string[]
  totalSize: number
  authKeys: string[]
} {
  if (typeof window === 'undefined') {
    return { keys: [], totalSize: 0, authKeys: [] }
  }

  try {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter(key => 
      key.startsWith('sb-') || 
      key.includes('auth') || 
      key.includes('supabase') ||
      key === 'arkomik-auth'
    )
    
    // Calculate approximate size
    let totalSize = 0
    keys.forEach(key => {
      const value = localStorage.getItem(key) || ''
      totalSize += key.length + value.length
    })
    
    return {
      keys,
      totalSize,
      authKeys,
    }
  } catch (error) {
    console.error('Error getting storage info:', error)
    return { keys: [], totalSize: 0, authKeys: [] }
  }
}

/**
 * Clear old/expired data
 */
export function clearExpiredData(): void {
  if (typeof window === 'undefined') return

  try {
    const now = Date.now()
    
    Object.keys(localStorage).forEach(key => {
      try {
        const value = localStorage.getItem(key)
        if (!value) return
        
        // Try to parse as JSON
        const data = JSON.parse(value)
        
        // Check for expiry
        if (data.expiresAt && data.expiresAt < now) {
          localStorage.removeItem(key)
          console.log(`🗑️ Removed expired key: ${key}`)
        }
      } catch {
        // Not JSON or no expiry, skip
      }
    })
    
    console.log('✅ Expired data cleared')
  } catch (error) {
    console.error('Error clearing expired data:', error)
  }
}

/**
 * Clear dismissed announcements (for testing)
 */
export function clearDismissedAnnouncements(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('dismissedAnnouncements')
    console.log('✅ Dismissed announcements cleared')
  } catch (error) {
    console.error('Error clearing announcements:', error)
  }
}

/**
 * Debug: Log all storage keys
 */
export function debugStorage(): void {
  if (typeof window === 'undefined') {
    console.log('❌ Not in browser environment')
    return
  }

  const info = getStorageInfo()
  
  console.group('📦 Storage Debug Info')
  console.log('Total keys:', info.keys.length)
  console.log('Total size:', `${(info.totalSize / 1024).toFixed(2)} KB`)
  console.log('Auth keys:', info.authKeys.length)
  console.log('\nAll keys:')
  info.keys.forEach(key => {
    const value = localStorage.getItem(key) || ''
    const size = (key.length + value.length) / 1024
    console.log(`  ${key}: ${size.toFixed(2)} KB`)
  })
  console.groupEnd()
}

/**
 * Export storage data (for backup)
 */
export function exportStorage(): string {
  if (typeof window === 'undefined') return '{}'

  try {
    const data: Record<string, string> = {}
    Object.keys(localStorage).forEach(key => {
      data[key] = localStorage.getItem(key) || ''
    })
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Error exporting storage:', error)
    return '{}'
  }
}

/**
 * Import storage data (from backup)
 */
export function importStorage(jsonString: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const data = JSON.parse(jsonString)
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, value as string)
    })
    console.log('✅ Storage imported')
    return true
  } catch (error) {
    console.error('Error importing storage:', error)
    return false
  }
}
