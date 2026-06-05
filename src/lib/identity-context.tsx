import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { decodeJwt, type User } from './auth'

// Custom Errors for compatibility with index.tsx
export class MissingIdentityError extends Error {
  constructor(message = 'Identity service not available') {
    super(message)
    this.name = 'MissingIdentityError'
  }
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

interface IdentityContextValue {
  user: User | null
  ready: boolean
  logout: () => Promise<void>
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const token = getCookieValue('auth_token') || localStorage.getItem('auth_token')
      if (token) {
        const decoded = decodeJwt(token)
        setUser(decoded)
        // Ensure both cookie and localStorage are synchronized
        if (!getCookieValue('auth_token')) {
          document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`
        }
        if (!localStorage.getItem('auth_token')) {
          localStorage.setItem('auth_token', token)
        }
      } else {
        setUser(null)
      }
      setReady(true)
    }
  }

  useEffect(() => {
    checkAuth()

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-change', checkAuth)
      return () => window.removeEventListener('auth-change', checkAuth)
    }
  }, [])

  const logout = async () => {
    clearAuthSession()
  }

  return (
    <IdentityContext.Provider value={{ user, ready, logout }}>
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within an IdentityProvider')
  return ctx
}

// ── CUSTOM AUTH OPERATIONS ─────────────────────────────────

export async function login(usernameOrEmail: string, password: string): Promise<User> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameOrEmail, password }),
      })
      if (!res.ok) {
        throw new AuthError('Invalid username or password.', res.status)
      }
      const data = await res.json()
      const token = data.token || data.accessToken
      if (!token) {
        throw new AuthError('Authentication failed: no token received.', 500)
      }
      setAuthSession(token)
      const decoded = decodeJwt(token)
      if (!decoded) {
        throw new AuthError('Invalid session token format.', 500)
      }
      return decoded
    } catch (e) {
      if (e instanceof AuthError) throw e
      throw new AuthError('Backend connection error. Please verify the Spring Boot server is online.', 503)
    }
  }

  throw new AuthError('Authentication API endpoint not configured.', 404)
}

export async function oauthLogin(provider: string): Promise<never> {
  throw new Error(`Social OAuth (${provider}) is disabled under custom backend authentication.`)
}

export async function handleAuthCallback(): Promise<null> {
  return null
}

// ── UTILITIES ──────────────────────────────────────────────

function generateMockJwt(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encode = (obj: object) => {
    const jsonStr = JSON.stringify(obj)
    if (typeof window !== 'undefined') {
      return window.btoa(unescape(encodeURIComponent(jsonStr)))
    }
    return Buffer.from(jsonStr).toString('base64')
  }
  return `${encode(header)}.${encode(payload)}.mock_signature`
}

function setAuthSession(token: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`
    localStorage.setItem('auth_token', token)
    window.dispatchEvent(new Event('auth-change'))
  }
}

function clearAuthSession() {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax'
    localStorage.removeItem('auth_token')
    window.dispatchEvent(new Event('auth-change'))
  }
}
