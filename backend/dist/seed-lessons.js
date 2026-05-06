"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const env_1 = require("./env");
const Lesson_1 = require("./models/Lesson");
const SEED_DATA = [
    {
        title: '성인 입문',
        subtitle: 'For absolute beginners',
        description: '주 1회 30분 · 자세·활쓰기부터 천천히. 악기 대여 가능.',
        price: '월 22만원~',
        sortOrder: 0,
        active: true,
    },
    {
        title: '성인 심화',
        subtitle: 'For continuing players',
        description: '주 1~2회 · 곡 중심 진도 + 분기별 살롱 발표회.',
        price: '월 28만원~',
        sortOrder: 1,
        active: true,
    },
    {
        title: '유소년반',
        subtitle: 'Ages 7+',
        description: '주 2회 · 음감과 자세 중심, 학부모 리포트 매월.',
        price: '월 30만원~',
        sortOrder: 2,
        active: true,
    },
    {
        title: '입시·콩쿠르',
        subtitle: 'Pre-college / Competition',
        description: '주 2~3회 · 개별 커리큘럼, 모의 심사 포함.',
        price: '상담 후 책정',
        sortOrder: 3,
        active: true,
    },
];
async function seed() {
    await (0, mongoose_1.connect)(env_1.env.MONGODB_URI);
    console.log('MongoDB 연결 완료');
    const existing = await Lesson_1.Lesson.countDocuments();
    if (existing > 0) {
        console.log(`이미 ${existing}개의 커리큘럼이 존재합니다. 시드를 건너뜁니다.`);
        await (0, mongoose_1.disconnect)();
        return;
    }
    await Lesson_1.Lesson.insertMany(SEED_DATA);
    console.log(`${SEED_DATA.length}개의 커리큘럼을 등록했습니다.`);
    await (0, mongoose_1.disconnect)();
}
seed().catch((error) => {
    console.error('시드 실패:', error);
    process.exit(1);
});
