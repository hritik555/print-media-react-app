import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { decodeJwt, type User } from '../lib/auth'

async function getMiddlewareUser(): Promise<User | null> {
  try {
    const req = getRequest()
    if (!req) return null
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(new RegExp('(^|; )auth_token=([^;]*)'))
    const token = match ? decodeURIComponent(match[2]) : null

    if (!token) {
      return null
    }
    return decodeJwt(token)
  } catch {
    return null
  }
}

export const identityMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await getMiddlewareUser()
  return next({ context: { user } })
})

export const requireAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const user = await getMiddlewareUser()
  if (!user) throw new Error('Authentication required')
  return next({ context: { user } })
})

export function requireRoleMiddleware(role: string) {
  return createMiddleware().server(async ({ next }) => {
    const user = await getMiddlewareUser()
    if (!user) throw new Error('Authentication required')
    if (!user.roles?.includes(role)) throw new Error(`Role '${role}' required`)
    return next({ context: { user } })
  })
}
