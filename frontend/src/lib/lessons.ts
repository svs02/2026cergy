export interface Lesson {
  number: string
  title: string
  subtitle: string
  description: string
  price: string
}

export const LESSONS = [
  {
    number: '01',
    title: '성인 입문',
    subtitle: 'For absolute beginners',
    description: '주 1회 30분 · 자세·활쓰기부터 천천히. 악기 대여 가능.',
    price: '월 22만원~',
  },
  {
    number: '02',
    title: '성인 심화',
    subtitle: 'For continuing players',
    description: '주 1~2회 · 곡 중심 진도 + 분기별 살롱 발표회.',
    price: '월 28만원~',
  },
  {
    number: '03',
    title: '유소년반',
    subtitle: 'Ages 7+',
    description: '주 2회 · 음감과 자세 중심, 학부모 리포트 매월.',
    price: '월 30만원~',
  },
  {
    number: '04',
    title: '입시·콩쿠르',
    subtitle: 'Pre-college / Competition',
    description: '주 2~3회 · 개별 커리큘럼, 모의 심사 포함.',
    price: '상담 후 책정',
  },
] as const satisfies readonly Lesson[]
