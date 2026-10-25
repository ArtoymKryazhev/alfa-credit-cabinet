import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEMO_PASSWORD,
  loginRequest,
  logoutRequest,
  meRequest,
  type AuthUser,
} from '../api/auth'
import { getAuthToken, setAuthToken } from '../api/client'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (login: string, password?: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const me = await meRequest()
      setUser(me)
    } catch {
      setAuthToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await refresh()
      if (!cancelled) {
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const login = useCallback(
    async (loginName: string, password: string = DEMO_PASSWORD) => {
      await loginRequest(loginName, password)
      const me = await meRequest()
      setUser(me)
      return me
    },
    [],
  )

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
