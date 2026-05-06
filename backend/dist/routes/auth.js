"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const v4_1 = require("zod/v4");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../env");
const email_1 = require("../lib/email");
exports.authRouter = (0, express_1.Router)();
const loginSchema = v4_1.z.strictObject({
    password: v4_1.z.string().min(1),
});
exports.authRouter.post('/admin/login', async (req, res, next) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(parsed.data.password, env_1.env.ADMIN_PASSWORD_HASH);
        if (!isMatch) {
            res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
            return;
        }
        req.session.isAdmin = true;
        void (0, email_1.sendAdminLoginNotification)({
            ip: req.ip ?? 'unknown',
            userAgent: req.get('user-agent') ?? 'unknown',
            when: new Date(),
        });
        res.json({ isAdmin: true });
    }
    catch (error) {
        next(error);
    }
});
exports.authRouter.post('/admin/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            res.status(500).json({ error: '로그아웃에 실패했습니다' });
            return;
        }
        res.clearCookie('connect.sid');
        res.json({ ok: true });
    });
});
exports.authRouter.get('/admin/me', (req, res) => {
    res.json({ isAdmin: !!req.session?.isAdmin });
});
