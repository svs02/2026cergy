'use client'

import type { ReactNode } from 'react'
import { AdminProvider } from './AdminContext'
import { DrawerProvider } from './DrawerContext'
import { DrawerMenu } from './DrawerMenu'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <DrawerProvider>
        <div
          style={{
            maxWidth: 768,
            margin: '0 auto',
            position: 'relative',
            minHeight: '100vh',
            background: '#ffffff',
          }}
        >
          {children}
        </div>
        <DrawerMenu />
      </DrawerProvider>
    </AdminProvider>
  )
}
