import { config } from 'dotenv'
config({ path: '.env.local' })

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} 환경변수가 설정되지 않았습니다`)
  }
  return value
}

export const env = {
  PORT: requireEnv('PORT'),
  CLIENT_URL: requireEnv('CLIENT_URL'),
  SESSION_SECRET: requireEnv('SESSION_SECRET'),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  NAVER_CLIENT_ID: requireEnv('NAVER_CLIENT_ID'),
  NAVER_CLIENT_SECRET: requireEnv('NAVER_CLIENT_SECRET'),
}
