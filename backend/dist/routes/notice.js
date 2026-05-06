"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noticeRouter = void 0;
const express_1 = require("express");
const v4_1 = require("zod/v4");
const Notice_1 = require("../models/Notice");
const auth_1 = require("../middleware/auth");
exports.noticeRouter = (0, express_1.Router)();
const createNoticeSchema = v4_1.z.strictObject({
    title: v4_1.z.string().min(1),
    body: v4_1.z.string().min(1),
    tag: v4_1.z.enum(Notice_1.NoticeTag),
    images: v4_1.z.array(v4_1.z.string()).default([]),
});
const updateNoticeSchema = v4_1.z.strictObject({
    title: v4_1.z.string().min(1).optional(),
    body: v4_1.z.string().min(1).optional(),
    tag: v4_1.z.enum(Notice_1.NoticeTag).optional(),
    images: v4_1.z.array(v4_1.z.string()).optional(),
});
const listQuerySchema = v4_1.z.strictObject({
    page: v4_1.z.coerce.number().int().min(1).default(1),
    limit: v4_1.z.coerce.number().int().min(1).max(100).default(20),
    ignorePin: v4_1.z.coerce.boolean().default(false),
});
exports.noticeRouter.get('/', async (req, res, next) => {
    try {
        const parsed = listQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ error: '잘못된 쿼리 파라미터입니다' });
            return;
        }
        const { page, limit, ignorePin } = parsed.data;
        const skip = (page - 1) * limit;
        const query = Notice_1.Notice.find();
        if (ignorePin) {
            query.sort({ createdAt: -1 });
        }
        else {
            query.sort({ isPinned: -1, pinnedAt: -1, createdAt: -1 });
        }
        const [items, total] = await Promise.all([
            query.skip(skip).limit(limit),
            Notice_1.Notice.countDocuments(),
        ]);
        res.json({ items, total, page, limit });
    }
    catch (error) {
        next(error);
    }
});
exports.noticeRouter.get('/:id', async (req, res, next) => {
    try {
        const notice = await Notice_1.Notice.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).orFail();
        res.json(notice);
    }
    catch (error) {
        next(error);
    }
});
exports.noticeRouter.post('/', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = createNoticeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const notice = await Notice_1.Notice.create(parsed.data);
        res.status(201).json(notice);
    }
    catch (error) {
        next(error);
    }
});
exports.noticeRouter.put('/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = updateNoticeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const notice = await Notice_1.Notice.findByIdAndUpdate(req.params.id, parsed.data, {
            new: true,
            runValidators: true,
        }).orFail();
        res.json(notice);
    }
    catch (error) {
        next(error);
    }
});
exports.noticeRouter.delete('/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        await Notice_1.Notice.findByIdAndDelete(req.params.id).orFail();
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
const pinNoticeSchema = v4_1.z.strictObject({
    isPinned: v4_1.z.boolean(),
});
exports.noticeRouter.patch('/:id/pin', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = pinNoticeSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const { isPinned } = parsed.data;
        const notice = await Notice_1.Notice.findByIdAndUpdate(req.params.id, { isPinned, pinnedAt: isPinned ? new Date() : null }, { new: true, runValidators: true }).orFail();
        res.json(notice);
    }
    catch (error) {
        next(error);
    }
});
