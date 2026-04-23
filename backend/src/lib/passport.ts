import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as NaverStrategy, type Profile as NaverProfile } from 'passport-naver-v2'
import { User } from '../models/User'
import { env } from '../env'

const callbackBase = `http://localhost:${env.PORT}`

passport.serializeUser((user, done) => {
  const typedUser = user as { id: string }
  done(null, typedUser.id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error as Error)
  }
})

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${callbackBase}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await User.findOneAndUpdate(
          { provider: 'google', providerId: profile.id },
          {
            $setOnInsert: {
              provider: 'google' as const,
              providerId: profile.id,
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              profileImage: profile.photos?.[0]?.value,
              role: 'MEMBER' as const,
            },
          },
          { upsert: true, new: true }
        )
        done(null, user ?? undefined)
      } catch (error) {
        done(error as Error)
      }
    }
  )
)

passport.use(
  new NaverStrategy(
    {
      clientID: env.NAVER_CLIENT_ID,
      clientSecret: env.NAVER_CLIENT_SECRET,
      callbackURL: `${callbackBase}/api/auth/naver/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      const naverProfile = profile as unknown as NaverProfile
      try {
        const user = await User.findOneAndUpdate(
          { provider: 'naver', providerId: naverProfile.id },
          {
            $setOnInsert: {
              provider: 'naver' as const,
              providerId: naverProfile.id,
              email: naverProfile.email,
              name: naverProfile.nickname ?? naverProfile.name ?? '이름 없음',
              profileImage: naverProfile.profileImage,
              role: 'MEMBER' as const,
            },
          },
          { upsert: true, new: true }
        )
        done(null, user ?? false)
      } catch (error) {
        done(error as Error)
      }
    }
  )
)
