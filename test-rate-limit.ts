import { checkRateLimit } from './lib/utils/rate-limit'

const ip = '1.2.3.4'
const key = 'feedback'

for (let i = 0; i < 7; i++) {
  const allowed = checkRateLimit(ip, key, 5, 60000) // 5 requests per minute
  console.log(`Request ${i+1}: ${allowed ? 'ALLOWED' : 'BLOCKED'}`)
}
