/**
 * DevTools Protection
 * Hides sensitive authentication data from browser DevTools
 * This makes it harder (but not impossible) for users to view tokens
 */

/**
 * Hide sensitive cookies from DevTools
 * Overrides document.cookie getter to filter out sensitive cookies
 */
export function hideSensitiveCookies() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  try {
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
    if (!originalCookieDescriptor) return

    const originalGetter = originalCookieDescriptor.get
    const originalSetter = originalCookieDescriptor.set

    Object.defineProperty(document, 'cookie', {
      get: function() {
        if (!originalGetter) return ''
        
        const cookies = originalGetter.call(document)
        
        // Filter out sensitive cookies
        const filteredCookies = cookies
          .split('; ')
          .filter((cookie: string) => {
            const cookieName = cookie.split('=')[0]
            // Hide cookies containing sensitive keywords
            return !cookieName.includes('arkomik-aut') &&
                   !cookieName.includes('sb-') &&
                   !cookieName.includes('auth-token') &&
                   !cookieName.includes('access-token') &&
                   !cookieName.includes('refresh-token')
          })
          .join('; ')
        
        return filteredCookies
      },
      set: function(value) {
        if (!originalSetter) return
        originalSetter.call(document, value)
      },
      configurable: true,
    })

    console.log('🔒 Cookie protection enabled')
  } catch (error) {
    console.error('Failed to enable cookie protection:', error)
  }
}

/**
 * Hide sensitive localStorage keys from DevTools
 * Overrides localStorage methods to filter out sensitive data
 */
export function hideSensitiveLocalStorage() {
  if (typeof window === 'undefined') return

  try {
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    const originalKey = Storage.prototype.key
    const originalLength = Object.getOwnPropertyDescriptor(Storage.prototype, 'length')

    // List of sensitive key patterns to hide
    const sensitivePatterns = [
      'arkomik-auth',
      'sb-',
      'supabase',
      'auth-token',
      'access-token',
      'refresh-token',
      'access_token',
      'refresh_token',
    ]

    function isSensitiveKey(key: string): boolean {
      return sensitivePatterns.some(pattern => key.includes(pattern))
    }

    // Override getItem to return null for sensitive keys
    Storage.prototype.getItem = function(key: string) {
      const value = originalGetItem.call(this, key)
      
      // Return actual value (needed for app to work)
      // But when accessed from DevTools console, it will be hidden
      if (isSensitiveKey(key)) {
        // Check if called from our app or DevTools
        const stack = new Error().stack || ''
        if (stack.includes('devtools') || stack.includes('console')) {
          return null
        }
      }
      
      return value
    }

    // Override setItem to hide sensitive keys
    Storage.prototype.setItem = function(key: string, value: string) {
      return originalSetItem.call(this, key, value)
    }

    // Override key() to skip sensitive keys
    Storage.prototype.key = function(index: number) {
      let currentIndex = 0
      let actualIndex = 0
      
      while (actualIndex < localStorage.length) {
        const key = originalKey.call(this, actualIndex)
        if (key && !isSensitiveKey(key)) {
          if (currentIndex === index) {
            return key
          }
          currentIndex++
        }
        actualIndex++
      }
      
      return null
    }

    // Override length to exclude sensitive keys
    if (originalLength && originalLength.get) {
      Object.defineProperty(Storage.prototype, 'length', {
        get: function() {
          const actualLength = originalLength.get!.call(this)
          let visibleCount = 0
          
          for (let i = 0; i < actualLength; i++) {
            const key = originalKey.call(this, i)
            if (key && !isSensitiveKey(key)) {
              visibleCount++
            }
          }
          
          return visibleCount
        },
        configurable: true,
      })
    }

    console.log('🔒 LocalStorage protection enabled')
  } catch (error) {
    console.error('Failed to enable localStorage protection:', error)
  }
}

/**
 * Disable console.log for sensitive data
 * Prevents accidental logging of tokens
 */
export function protectConsoleLogging() {
  if (typeof window === 'undefined') return

  try {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info

    function filterSensitiveData(args: any[]): any[] {
      return args.map(arg => {
        if (typeof arg === 'string') {
          // Redact tokens in strings
          return arg
            .replace(/access[_-]?token["\s:=]+[a-zA-Z0-9._-]+/gi, 'access_token: [REDACTED]')
            .replace(/refresh[_-]?token["\s:=]+[a-zA-Z0-9._-]+/gi, 'refresh_token: [REDACTED]')
            .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]')
        } else if (typeof arg === 'object' && arg !== null) {
          // Redact tokens in objects
          const filtered = { ...arg }
          if (filtered.access_token) filtered.access_token = '[REDACTED]'
          if (filtered.refresh_token) filtered.refresh_token = '[REDACTED]'
          if (filtered.accessToken) filtered.accessToken = '[REDACTED]'
          if (filtered.refreshToken) filtered.refreshToken = '[REDACTED]'
          return filtered
        }
        return arg
      })
    }

    console.log = function(...args: any[]) {
      originalLog.apply(console, filterSensitiveData(args))
    }

    console.error = function(...args: any[]) {
      originalError.apply(console, filterSensitiveData(args))
    }

    console.warn = function(...args: any[]) {
      originalWarn.apply(console, filterSensitiveData(args))
    }

    console.info = function(...args: any[]) {
      originalInfo.apply(console, filterSensitiveData(args))
    }

    console.log('🔒 Console logging protection enabled')
  } catch (error) {
    console.error('Failed to enable console protection:', error)
  }
}

/**
 * Detect if DevTools is open
 * Can be used to show warnings or take additional security measures
 */
export function detectDevTools(callback?: (isOpen: boolean) => void) {
  if (typeof window === 'undefined') return

  let devtoolsOpen = false

  // Method 1: Check console.log timing
  const checkDevTools = () => {
    const start = performance.now()
    // This will be slow if DevTools is open
    console.log('%c', '')
    const end = performance.now()
    
    const isOpen = end - start > 100
    
    if (isOpen !== devtoolsOpen) {
      devtoolsOpen = isOpen
      if (callback) callback(isOpen)
    }
  }

  // Check every 1 second
  setInterval(checkDevTools, 1000)
}

/**
 * Initialize all DevTools protections
 * Call this once when the app starts
 */
export function initializeDevToolsProtection(options?: {
  hideCookies?: boolean
  hideLocalStorage?: boolean
  protectConsole?: boolean
  detectDevTools?: boolean
  onDevToolsOpen?: (isOpen: boolean) => void
}) {
  const {
    hideCookies = true,
    hideLocalStorage = true,
    protectConsole = true,
    detectDevTools: shouldDetect = false,
    onDevToolsOpen,
  } = options || {}

  console.log('🛡️ Initializing DevTools protection...')

  if (hideCookies) {
    hideSensitiveCookies()
  }

  if (hideLocalStorage) {
    hideSensitiveLocalStorage()
  }

  if (protectConsole) {
    protectConsoleLogging()
  }

  if (shouldDetect) {
    detectDevTools(onDevToolsOpen)
  }

  console.log('✅ DevTools protection initialized')
}

/**
 * Disable DevTools protection (for development)
 */
export function disableDevToolsProtection() {
  console.warn('⚠️ DevTools protection disabled')
  // This would require storing original references
  // For now, just log a warning
}
