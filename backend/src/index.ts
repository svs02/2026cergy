import { env } from './env'
import app from './app'
import { connectDB } from './lib/db'

async function bootstrap() {
  await connectDB()
  app.listen(Number(env.PORT), () => {
    console.log(`서버 실행 중: http://localhost:${env.PORT}`)
  })
}

bootstrap().catch((error: unknown) => {
  console.error('서버 시작 실패:', error)
  process.exit(1)
})
