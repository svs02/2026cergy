import { Resend } from 'resend'
import { env } from '../env'

let resendClient: Resend | null = null

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL) {
    return null
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY)
  }
  return resendClient
}

function formatKst(date: Date): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const year = kst.getUTCFullYear()
  const month = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  const hour = String(kst.getUTCHours()).padStart(2, '0')
  const minute = String(kst.getUTCMinutes()).padStart(2, '0')
  const second = String(kst.getUTCSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second} KST`
}

interface AdminLoginNotification {
  ip: string
  userAgent: string
  when: Date
}

export async function sendAdminLoginNotification(payload: AdminLoginNotification): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const client = getClient()
  if (!client) {
    console.info('[email] Resend 키 또는 ADMIN_EMAIL이 설정되지 않아 알림을 건너뜁니다')
    return
  }

  const when = formatKst(payload.when)
  const subject = '[Cergy] 관리자 로그인 알림'
  const text = [
    '관리자 계정 로그인이 발생했습니다.',
    '',
    `시간: ${when}`,
    `IP: ${payload.ip}`,
    `User-Agent: ${payload.userAgent}`,
    '',
    '본인이 아니라면 즉시 비밀번호를 변경해 주세요.',
  ].join('\n')

  try {
    await client.emails.send({
      from: env.ADMIN_NOTIFICATION_FROM,
      to: env.ADMIN_EMAIL,
      subject,
      text,
    })
  } catch (error) {
    console.error('[email] 관리자 로그인 알림 발송 실패:', error)
  }
}
