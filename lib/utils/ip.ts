/**
 * Extract client IP from Next.js headers
 * Priority: x-forwarded-for > x-real-ip > x-client-ip > null
 */
export function getClientIp(headers: Headers): string | null {
  try {
    // Check x-forwarded-for first (can contain multiple IPs, take first)
    const forwardedFor = headers.get('x-forwarded-for')
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim())
      if (ips.length > 0 && ips[0]) {
        return ips[0]
      }
    }

    // Check x-real-ip
    const realIp = headers.get('x-real-ip')
    if (realIp) {
      return realIp
    }

    // Check x-client-ip
    const clientIp = headers.get('x-client-ip')
    if (clientIp) {
      return clientIp
    }

    return null
  } catch (error) {
    console.error('Error extracting client IP:', error)
    return null
  }
}
