'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { adminLogin, adminLogout, getAdminStatus } from '@/lib/api'

interface AdminContextValue {
  isAdmin: boolean
  loading: boolean
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await getAdminStatus()
      setIsAdmin(result.isAdmin)
    } catch {
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (password: string) => {
    try {
      const result = await adminLogin(password)
      setIsAdmin(result.isAdmin)
      return result.isAdmin
    } catch {
      setIsAdmin(false)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminLogout()
    } finally {
      setIsAdmin(false)
    }
  }, [])

  const value = useMemo(
    () => ({ isAdmin, loading, login, logout, refresh }),
    [isAdmin, loading, login, logout, refresh],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdmin은 AdminProvider 내부에서만 사용할 수 있습니다')
  }
  return ctx
}
