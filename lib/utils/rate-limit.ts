/**
 * In-memory rate limiting with fixed window
 * Auto-cleanup of expired records every hour
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup expired records every hour (unref so it doesn't block process exit)
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 60 * 1000) // 1 hour

// Allow process to exit naturally (non-blocking timer)
if (cleanupInterval.unref) {
  cleanupInterval.unref()
}

/**
 * Check if request is allowed under rate limit
 * @param ip - Client IP address
 * @param key - Rate limit key (e.g., 'feedback', 'like')
 * @param maxRequests - Maximum requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  ip: string,
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  try {
    const now = Date.now()
    const storeKey = `${ip}:${key}`

    let record = rateLimitStore.get(storeKey)

    // Reset if window expired
    if (!record || record.resetTime < now) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      }
      rateLimitStore.set(storeKey, record)
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      return false
    }

    // Increment counter
    record.count++
    return true
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return true // Allow on error
  }
}
