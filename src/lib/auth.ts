import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

function getCookieFromRequest(name: string): string | null {
  try {
    const req = getRequest()
    if (!req) return null
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(new RegExp('(^|; )' + name + '=([^;]*)'))
    return match ? decodeURIComponent(match[2]) : null
  } catch {
    return null
  }
}

export interface User {
  username: string
  email: string
  roles: string[]
  token?: {
    access_token: string
  }
}

export type { User as IdentityUser }

export function decodeJwt(token: string): User | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const rawPayload = typeof window !== 'undefined'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('binary')

    const jsonPayload = decodeURIComponent(
      rawPayload
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    return {
      username: payload.sub || payload.username || payload.email || '',
      email: payload.email || payload.sub || '',
      roles: payload.roles || [],
      token: {
        access_token: token
      }
    }
  } catch (e) {
    return null
  }
}

export const getServerUser = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const token = getCookieFromRequest('auth_token')
      if (!token) {
        return null
      }
      return decodeJwt(token) as any
    } catch {
      return null
    }
  }
)

