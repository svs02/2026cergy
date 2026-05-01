import { TOKENS } from '@/lib/tokens'
import { LESSONS } from '@/lib/lessons'
import { PageHeader } from '@/components/PageHeader'
import { ArrowIcon } from '@/components/Icons'

export default function LessonsPage() {
  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 40 }}>
      <PageHeader
        title="커리큘럼"
        eyebrow="CURRICULUM"
        lead={
          <>
            기초부터 심화까지, 단계적으로 설계된 레슨
          </>
        }
      />

      {LESSONS.map((lesson, index) => {
        const isGreen = index % 2 === 0
        return (
          <div
            key={lesson.number}
            style={{
              margin: '0 24px 18px',
              padding: 22,
              background: isGreen ? TOKENS.green : TOKENS.bgWarm,
              color: isGreen ? '#fff' : TOKENS.ink,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: 36,
                color: isGreen ? TOKENS.goldBright : TOKENS.gold,
              }}
            >
              {lesson.number}
            </div>
            <div
              style={{
                fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: 24,
                fontWeight: 500,
                letterSpacing: -0.2,
                lineHeight: 1.05,
                color: isGreen ? '#fff' : TOKENS.green,
                marginTop: 4,
              }}
            >
              {lesson.title}
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: 2,
                color: isGreen ? TOKENS.sun : TOKENS.gold,
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              {lesson.subtitle.toUpperCase()}
            </div>
            <div
              style={{
                height: 1,
                background: isGreen ? 'rgba(255,255,255,.2)' : 'rgba(22,32,29,.12)',
                margin: '16px 0',
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                fontSize: 13,
                lineHeight: 1.7,
                color: isGreen ? 'rgba(255,255,255,.85)' : TOKENS.inkSoft,
              }}
            >
              {lesson.description}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 18,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                  fontSize: 18,
                  fontStyle: 'italic',
                }}
              >
                {lesson.price}
              </div>
              <div
                style={{
                  padding: '10px 16px',
                  border: `1px solid ${isGreen ? '#fff' : TOKENS.ink}`,
                  fontSize: 11,
                  letterSpacing: 2,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans), 'Inter', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                상담 신청 <ArrowIcon size={11} color={isGreen ? '#fff' : TOKENS.ink} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
