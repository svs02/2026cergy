import Link from 'next/link'
import { TOKENS } from '@/lib/tokens'
import { INSTRUCTORS } from '@/lib/instructors'
import { PageHeader } from '@/components/PageHeader'
import { Display } from '@/components/Display'
import { GoldRule } from '@/components/GoldRule'
import { Photo } from '@/components/Photo'
import { ArrowIcon } from '@/components/Icons'

export default function InstructorsPage() {
  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 56 }}>
      <PageHeader
        title="선생님"
        eyebrow="INSTRUCTORS"
        lead="Cergy의 음악은 사람으로부터 시작됩니다."
      />

      <div style={{ padding: '8px 24px 0' }}>
        {INSTRUCTORS.map((person, index) => (
          <div
            key={person.name}
            style={{
              marginBottom: 28,
              background: index === 0 ? TOKENS.bgWarm : '#fff',
              border: index === 0 ? 'none' : '1px solid rgba(22,32,29,.1)',
            }}
          >
            <Photo label={person.name} height={260} tone={person.tone} />
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <Display size={24} italic={false} color={TOKENS.green} fontWeight={600}>
                  {person.name}
                </Display>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 2.5,
                    color: TOKENS.gold,
                    fontFamily: "var(--font-sans), 'Inter', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {person.nameEn}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                  fontSize: 12,
                  color: TOKENS.inkSoft,
                  marginTop: 4,
                  letterSpacing: 0.5,
                }}
              >
                {person.role}
              </div>

              <GoldRule width={28} />

              <div
                style={{
                  fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                  fontSize: 13,
                  color: TOKENS.ink,
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {person.major}
              </div>

              <ul
                style={{
                  margin: '12px 0 0',
                  padding: 0,
                  listStyle: 'none',
                  fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                  fontSize: 12.5,
                  color: TOKENS.inkSoft,
                  lineHeight: 1.75,
                }}
              >
                {person.career.map((item) => (
                  <li key={item} style={{ display: 'flex', gap: 10, paddingLeft: 0 }}>
                    <span style={{ color: TOKENS.gold }}>—</span>
                    <span style={{ flex: 1 }}>{item}</span>
                  </li>
                ))}
              </ul>

              <div
                style={{
                  marginTop: 18,
                  padding: '14px 16px',
                  borderLeft: `2px solid ${TOKENS.gold}`,
                  fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: TOKENS.green,
                  lineHeight: 1.5,
                  background: index === 0 ? 'rgba(255,255,255,.5)' : TOKENS.bgWarm,
                }}
              >
                &ldquo;{person.quote}&rdquo;
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 24px 0' }}>
        <Link
          href="/lessons"
          style={{
            width: '100%',
            padding: '16px',
            background: TOKENS.green,
            color: '#fff',
            border: 'none',
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          1:1 레슨 상담 신청 <ArrowIcon size={12} color="#fff" />
        </Link>
      </div>
    </div>
  )
}
