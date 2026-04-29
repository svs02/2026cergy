import Link from 'next/link'
import { TOKENS } from '@/lib/tokens'
import {
  isVideo,
  listGallery,
  listNotices,
  type GalleryItem,
  type NoticeItem,
} from '@/lib/api'
import { Display } from '@/components/Display'
import { Eyebrow } from '@/components/Eyebrow'
import { GoldRule } from '@/components/GoldRule'
import { SectionHead } from '@/components/SectionHead'
import { Photo } from '@/components/Photo'
import { ArrowIcon, MapIcon, PhoneIcon, PlayIcon } from '@/components/Icons'
import { HeroMenuButton } from '@/components/HeroMenuButton'

export const dynamic = 'force-dynamic'

async function fetchHomeData(): Promise<{
  notices: NoticeItem[]
  gallery: GalleryItem[]
}> {
  const [noticesResult, galleryResult] = await Promise.allSettled([
    listNotices(1, 3),
    listGallery(),
  ])
  const notices = noticesResult.status === 'fulfilled' ? noticesResult.value.items : []
  const galleryAll = galleryResult.status === 'fulfilled' ? galleryResult.value.items : []
  const featured = galleryAll.filter((item) => item.featured)
  const gallery = (featured.length > 0 ? featured : galleryAll).slice(0, 4)
  return { notices, gallery }
}

function formatNoticeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

const PREVIEW_INSTRUCTORS = [
  { name: '박서연', nameEn: 'PARK SEOYEON', role: '원장 · Director', tone: 'green' as const },
  { name: '김민하', nameEn: 'KIM MINHA', role: '전임강사 · Lecturer', tone: 'wood' as const },
]

const FALLBACK_GALLERY = [
  { label: '겨울 발표회 · 2025', tone: 'green' as const, width: 240 },
  { label: '레슨실 03', tone: 'wood' as const, width: 180 },
  { label: '창가의 오후', tone: 'sun' as const, width: 220 },
  { label: '악기 진열', tone: 'greenL' as const, width: 180 },
]

export default async function HomePage() {
  const { notices, gallery } = await fetchHomeData()
  const eventCount = notices.filter((notice) => notice.tag === 'EVENT').length

  return (
    <div style={{ background: TOKENS.bg, paddingBottom: 24 }}>
      {/* HERO */}
      <div style={{ position: 'relative', height: 560, overflow: 'hidden' }}>
        <Photo label="HERO · 학원 창가 · 햇살" height={560} tone="green" />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(120% 60% at 15% 10%, rgba(245,200,120,.45), transparent 55%), linear-gradient(180deg, rgba(22,32,29,.05) 30%, rgba(22,32,29,.6) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 22,
              color: '#fff',
              letterSpacing: 1,
            }}
          >
            Cergy Music Academy
          </div>
          <HeroMenuButton />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: 32,
            color: '#fff',
            zIndex: 2,
          }}
        >
          <Eyebrow color={TOKENS.sun}>SINCE 2014 · VIOLIN ATELIER</Eyebrow>
          <Display size={40} color="#fff" style={{ marginTop: 14, fontWeight: 500 }}>
            오늘, 한 음을
            <br />
            당신의 일상에.
          </Display>
          <div
            style={{
              marginTop: 18,
              fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
              fontSize: 13,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,.85)',
              maxWidth: 280,
            }}
          >
            도심 속 작은 살롱에서, 천천히 한 음씩.
            <br />
            세르지에서 시작하는 당신의 클래식.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <Link
              href="/lessons"
              style={{
                padding: '14px 22px',
                background: '#fff',
                color: TOKENS.green,
                border: 'none',
                borderRadius: 0,
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 2,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
            >
              체험 레슨 신청 <ArrowIcon size={12} color={TOKENS.green} />
            </Link>
            <Link
              href="/gallery"
              style={{
                padding: '14px 16px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid #fff',
                borderRadius: 0,
                fontFamily: "var(--font-sans), 'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: 2,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              둘러보기
            </Link>
          </div>
        </div>
      </div>

      {/* PHILOSOPHY */}
      <div style={{ padding: '56px 24px 48px', background: TOKENS.bg }}>
        <Eyebrow>OUR PHILOSOPHY</Eyebrow>
        <Display size={26} color={TOKENS.green} style={{ marginTop: 14 }}>
          소리는 천천히
          <br />
          <span style={{ color: TOKENS.gold }}>몸에 깃듭니다.</span>
        </Display>
        <GoldRule width={32} />
        <p
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 14,
            lineHeight: 1.85,
            color: TOKENS.inkSoft,
            margin: '14px 0 0',
          }}
        >
          서두르지 않습니다. 누군가의 표준이 아닌,
          <br />
          당신만의 박자로 다듬어 가는 한 시간.
          <br />
          세르지는 그 시간이 머무는 곳입니다.
        </p>
      </div>

      {/* PHOTO BREAK */}
      <div style={{ position: 'relative' }}>
        <Photo label="레슨 풍경 · 손과 활" height={300} tone="wood" />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 60%, rgba(22,32,29,.55))',
          }}
        />
        <div style={{ position: 'absolute', left: 24, bottom: 24, color: '#fff' }}>
          <Display size={22} color="#fff">
            —   천천히, 한 음씩.
          </Display>
        </div>
      </div>

      {/* INSTRUCTORS preview */}
      <div style={{ padding: '56px 24px 32px', background: TOKENS.bgWarm }}>
        <SectionHead eyebrow="INSTRUCTORS" title="선생님" action="ALL" />
        <Link href="/instructors" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {PREVIEW_INSTRUCTORS.map((person) => (
              <div key={person.name}>
                <Photo label={person.name} height={180} tone={person.tone} />
                <div style={{ marginTop: 10 }}>
                  <Display size={16} italic={false} color={TOKENS.green} fontWeight={600}>
                    {person.name}
                  </Display>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: 2,
                      color: TOKENS.gold,
                      fontFamily: "var(--font-sans), 'Inter', sans-serif",
                      marginTop: 2,
                    }}
                  >
                    {person.nameEn}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                      fontSize: 11,
                      color: TOKENS.inkSoft,
                      marginTop: 4,
                    }}
                  >
                    {person.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Link>
      </div>

      {/* MOMENTS */}
      <div style={{ padding: '56px 0 32px', background: TOKENS.bg }}>
        <div style={{ padding: '0 24px' }}>
          <SectionHead eyebrow="MOMENTS" title="최근의 순간들" action="GALLERY" />
        </div>
        {gallery.length > 0 ? (
          <Link
            href="/gallery"
            className="cergy-no-scrollbar"
            style={{
              display: 'flex',
              gap: 8,
              padding: '0 24px',
              overflowX: 'auto',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            {gallery.map((item) => (
              <div key={item._id} style={{ flexShrink: 0, width: 220 }}>
                <div style={{ position: 'relative' }}>
                  <Photo
                    label={item.caption ?? ''}
                    height={240}
                    tone="green"
                    src={isVideo(item) ? (item.thumbnailUrl ?? undefined) : item.imageUrl}
                    alt={item.caption ?? ''}
                  />
                  {isVideo(item) && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PlayIcon size={20} color="#fff" />
                      </div>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: TOKENS.green,
                    marginTop: 8,
                  }}
                >
                  {item.caption ?? ''}
                </div>
              </div>
            ))}
          </Link>
        ) : (
          <Link
            href="/gallery"
            className="cergy-no-scrollbar"
            style={{
              display: 'flex',
              gap: 8,
              padding: '0 24px',
              overflowX: 'auto',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            {FALLBACK_GALLERY.map((item) => (
              <div key={item.label} style={{ flexShrink: 0, width: item.width }}>
                <Photo label={item.label} height={240} tone={item.tone} />
                <div
                  style={{
                    fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: TOKENS.green,
                    marginTop: 8,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </Link>
        )}
      </div>

      {/* NOTICE strip */}
      <div
        style={{
          padding: '48px 24px 32px',
          background: TOKENS.bg,
          borderTop: '1px solid rgba(22,32,29,.08)',
        }}
      >
        <SectionHead
          eyebrow="NOTICE"
          title={
            <>
              공지{' '}
              <span
                style={{
                  fontSize: 14,
                  color: TOKENS.gold,
                  marginLeft: 8,
                  letterSpacing: 2,
                  fontStyle: 'normal',
                  fontFamily: "var(--font-sans), 'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                · EVENT {eventCount}
              </span>
            </>
          }
          action="BOARD"
        />
        <Link href="/notice" style={{ cursor: 'pointer', textDecoration: 'none' }}>
          {notices.length > 0 ? (
            notices.map((notice) => {
              const tagColor = notice.tag === 'EVENT' ? TOKENS.gold : TOKENS.green
              return (
                <div
                  key={notice._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '62px 1fr auto',
                    gap: 12,
                    alignItems: 'center',
                    padding: '14px 0',
                    borderBottom: '0.5px solid rgba(22,32,29,.12)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: 1.5,
                      fontWeight: 700,
                      fontFamily: "var(--font-sans), 'Inter', sans-serif",
                      color: tagColor,
                      border: `1px solid ${tagColor}`,
                      padding: '4px 0',
                      textAlign: 'center',
                    }}
                  >
                    {notice.tag}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                      fontSize: 13.5,
                      color: TOKENS.ink,
                      lineHeight: 1.4,
                    }}
                  >
                    {notice.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans), 'Inter', sans-serif",
                      fontSize: 11,
                      color: TOKENS.inkMute,
                    }}
                  >
                    {formatNoticeDate(notice.createdAt)}
                  </div>
                </div>
              )
            })
          ) : (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
                fontSize: 13,
                color: TOKENS.inkMute,
              }}
            >
              준비된 공지가 없습니다.
            </div>
          )}
        </Link>
      </div>

      {/* VISIT */}
      <div id="visit" style={{ padding: '48px 24px 56px', background: TOKENS.green, color: '#fff' }}>
        <Eyebrow color={TOKENS.goldBright}>VISIT</Eyebrow>
        <Display size={26} color="#fff" style={{ marginTop: 12 }}>
          오시는 길
        </Display>
        <GoldRule width={32} color={TOKENS.goldBright} />
        <div
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 14,
            lineHeight: 1.8,
            color: 'rgba(255,255,255,.85)',
            marginTop: 14,
          }}
        >
          서울 마포구 와우산로 23-7, 3층
          <br />
          홍대입구역 9번 출구에서 도보 4분
          <br />
          평일 13:00 — 21:00 / 토요일 10:00 — 18:00
        </div>
        <div style={{ marginTop: 20, height: 180, position: 'relative' }}>
          <Photo label="MAP · 위치 지도" height={180} tone="greenL" />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <a
            href="https://map.naver.com/"
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              padding: '14px',
              textAlign: 'center',
              background: '#fff',
              color: TOKENS.green,
              fontFamily: "var(--font-sans), 'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <MapIcon size={14} color={TOKENS.green} /> 지도 열기
          </a>
          <a
            href="tel:02-1234-5678"
            style={{
              flex: 1,
              padding: '14px',
              textAlign: 'center',
              background: 'transparent',
              color: '#fff',
              border: '1px solid #fff',
              fontFamily: "var(--font-sans), 'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <PhoneIcon size={14} color="#fff" /> 전화하기
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          padding: '40px 24px',
          background: TOKENS.greenDeep,
          color: 'rgba(255,245,220,.6)',
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display), 'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 26,
            color: '#fff',
          }}
        >
          Cergy Music Academy
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 3,
            color: TOKENS.goldBright,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            marginTop: 4,
          }}
        >
          VIOLIN · SINCE 2014
        </div>
        <div
          style={{
            fontFamily: "var(--font-kr), 'Noto Sans KR', sans-serif",
            fontSize: 11,
            lineHeight: 1.8,
            marginTop: 24,
          }}
        >
          © 2026 Cergy Music Academy
          <br />
          서울 마포구 와우산로 23-7 · 02-1234-5678
          <br />
          사업자등록번호 123-45-67890
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 20,
            fontSize: 11,
            fontFamily: "var(--font-sans), 'Inter', sans-serif",
            letterSpacing: 1.5,
          }}
        >
          <span>INSTAGRAM</span>
          <span>YOUTUBE</span>
          <span>BLOG</span>
        </div>
      </div>
    </div>
  )
}
