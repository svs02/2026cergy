import { config } from 'dotenv'
config({ path: '.env.local' })

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} 환경변수가 설정되지 않았습니다`)
  }
  return value
}

function readAdminPassword(): string {
  const value = process.env.ADMIN_PASSWORD
  if (value) {
    return value
  }
  if (process.env.NODE_ENV === 'test') {
    return 'test-admin'
  }
  throw new Error('ADMIN_PASSWORD 환경변수가 설정되지 않았습니다')
}

export const env = {
  PORT: requireEnv('PORT'),
  CLIENT_URL: requireEnv('CLIENT_URL'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  ADMIN_PASSWORD: readAdminPassword(),
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '',
  ADMIN_NOTIFICATION_FROM: process.env.ADMIN_NOTIFICATION_FROM ?? 'onboarding@resend.dev',
}
