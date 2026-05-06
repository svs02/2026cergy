"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.local' });
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`${key} 환경변수가 설정되지 않았습니다`);
    }
    return value;
}
function readAdminPasswordHash() {
    if (process.env.NODE_ENV === 'test') {
        return '$2b$10$IGS4ZSiA7Dc1cSSN15btt.ksDK4BN5.rCjp00EBEVHEBZBjiXcDlK';
    }
    const value = process.env.ADMIN_PASSWORD_HASH;
    if (value) {
        return value;
    }
    throw new Error('ADMIN_PASSWORD_HASH 환경변수가 설정되지 않았습니다');
}
exports.env = {
    PORT: requireEnv('PORT'),
    CLIENT_URL: requireEnv('CLIENT_URL'),
    SESSION_SECRET: requireEnv('SESSION_SECRET'),
    MONGODB_URI: requireEnv('MONGODB_URI'),
    ADMIN_PASSWORD_HASH: readAdminPasswordHash(),
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '',
    ADMIN_NOTIFICATION_FROM: process.env.ADMIN_NOTIFICATION_FROM ?? 'onboarding@resend.dev',
};
