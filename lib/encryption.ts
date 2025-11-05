/**
 * Token Encryption Utilities
 * Encrypt tokens before storing in cookies
 */

import crypto from 'crypto'

// Encryption key (should be in environment variable in production)
const ENCRYPTION_KEY = process.env.COOKIE_ENCRYPTION_KEY || 'arkomik-secret-key-32-chars-min'
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypt token using AES-256-GCM
 */
export function encryptToken(token: string): string {
  try {
    // Generate key from secret (32 bytes for AES-256)
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12)
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    // Encrypt
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get auth tag
    const authTag = cipher.getAuthTag()
    
    // Combine IV + authTag + encrypted (all in hex)
    // Format: iv(24 chars) + authTag(32 chars) + encrypted
    return iv.toString('hex') + authTag.toString('hex') + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    // Fallback: return original token (not recommended for production)
    return token
  }
}

/**
 * Decrypt token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    // Generate same key
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    
    // Extract IV (first 24 hex chars = 12 bytes)
    const iv = Buffer.from(encryptedToken.slice(0, 24), 'hex')
    
    // Extract auth tag (next 32 hex chars = 16 bytes)
    const authTag = Buffer.from(encryptedToken.slice(24, 56), 'hex')
    
    // Extract encrypted data (remaining)
    const encrypted = encryptedToken.slice(56)
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    // If decryption fails, might be unencrypted token (backward compatibility)
    return encryptedToken
  }
}

/**
 * Check if token is encrypted
 */
export function isEncrypted(token: string): boolean {
  // Encrypted tokens are hex strings with specific length
  // Min length: 24 (IV) + 32 (authTag) + encrypted data
  return token.length > 56 && /^[0-9a-f]+$/i.test(token)
}
