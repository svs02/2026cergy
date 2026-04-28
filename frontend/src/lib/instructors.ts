import type { PhotoTone } from './tokens'

export interface Instructor {
  name: string
  nameEn: string
  role: string
  tone: PhotoTone
  major: string
  career: readonly string[]
  quote: string
}

export const INSTRUCTORS = [
  {
    name: '박서연',
    nameEn: 'PARK SEOYEON',
    role: '원장 · Director',
    tone: 'green',
    major: '서울대학교 음악대학 기악과 졸업',
    career: [
      '뉴잉글랜드 콘서바토리 석사 (Violin Performance)',
      'KBS 교향악단 객원 단원 역임',
      'Cergy Violin Atelier 설립 (2014)',
    ],
    quote: '서두르지 않아도 괜찮습니다. 한 음을 정확히 듣는 일이 먼저입니다.',
  },
  {
    name: '김민하',
    nameEn: 'KIM MINHA',
    role: '전임 강사 · Lecturer',
    tone: 'wood',
    major: '한국예술종합학교 기악과 졸업',
    career: [
      'Manhattan School of Music 석사 과정 수료',
      '예울음악협회 정기연주 다수',
      '성인·유소년 입문 지도 8년',
    ],
    quote: '레슨은 함께 만들어 가는 30분의 대화입니다.',
  },
  {
    name: '이지우',
    nameEn: 'LEE JIWOO',
    role: '객원 강사 · Guest Lecturer',
    tone: 'greenL',
    major: '한양대학교 음악대학 졸업',
    career: [
      'Salzburg Mozarteum 단기 연수',
      '실내악 앙상블 «소르티» 멤버',
      '입시·콩쿠르 지도 5년',
    ],
    quote: '기술 너머의 음악성을 함께 찾아 갑니다.',
  },
] as const satisfies readonly Instructor[]
