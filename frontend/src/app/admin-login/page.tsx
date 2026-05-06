import type { Metadata } from 'next'
import { AdminLoginClient } from './AdminLoginClient'

export const metadata: Metadata = {
  title: '운영자 로그인',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return <AdminLoginClient />
}
