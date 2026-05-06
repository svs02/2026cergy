"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const env_1 = require("./env");
const auth_1 = require("./routes/auth");
const notice_1 = require("./routes/notice");
const gallery_1 = require("./routes/gallery");
const upload_1 = require("./routes/upload");
const instructor_1 = require("./routes/instructor");
const lesson_1 = require("./routes/lesson");
const Notice_1 = require("./models/Notice");
const Gallery_1 = require("./models/Gallery");
const Instructor_1 = require("./models/Instructor");
const Lesson_1 = require("./models/Lesson");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: env_1.env.CLIENT_URL,
    credentials: true,
}));
app.use((0, express_session_1.default)({
    secret: env_1.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({ mongoUrl: env_1.env.MONGODB_URI }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
    },
}));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
}));
const isTest = process.env.NODE_ENV === 'test';
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요' },
    skip: () => isTest,
});
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요' },
    skip: () => isTest,
});
app.use('/api/', apiLimiter);
app.use('/api/auth/admin/login', loginLimiter);
app.use('/api/auth', auth_1.authRouter);
app.use('/api/notices', notice_1.noticeRouter);
app.use('/api/gallery', gallery_1.galleryRouter);
app.use('/api/upload', upload_1.uploadRouter);
app.use('/api/instructors', instructor_1.instructorRouter);
app.use('/api/lessons', lesson_1.lessonRouter);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
if (process.env.NODE_ENV === 'test') {
    app.post('/api/test/reset', async (_req, res, next) => {
        try {
            await Promise.all([Notice_1.Notice.deleteMany({}), Gallery_1.Gallery.deleteMany({}), Instructor_1.Instructor.deleteMany({}), Lesson_1.Lesson.deleteMany({})]);
            res.json({ ok: true });
        }
        catch (error) {
            next(error);
        }
    });
}
app.use((err, _req, res, _next) => {
    const error = err;
    if (error?.name === 'DocumentNotFoundError') {
        res.status(404).json({ error: '존재하지 않는 리소스입니다' });
        return;
    }
    if (error?.name === 'CastError') {
        res.status(400).json({ error: '잘못된 식별자입니다' });
        return;
    }
    if (process.env.NODE_ENV === 'production') {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[ERROR] ${message}`);
    }
    else {
        console.error(err);
    }
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
});
exports.default = app;
