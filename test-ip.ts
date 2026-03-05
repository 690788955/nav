import { getClientIp } from './lib/utils/ip'

const headers1 = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
const headers2 = new Headers({ 'x-real-ip': '9.10.11.12' })
const headers3 = new Headers({})

console.log('Test 1 (x-forwarded-for):', getClientIp(headers1))
console.log('Test 2 (x-real-ip):', getClientIp(headers2))
console.log('Test 3 (no headers):', getClientIp(headers3))
