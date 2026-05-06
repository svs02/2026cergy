"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonRouter = void 0;
const express_1 = require("express");
const v4_1 = require("zod/v4");
const Lesson_1 = require("../models/Lesson");
const auth_1 = require("../middleware/auth");
exports.lessonRouter = (0, express_1.Router)();
const createLessonSchema = v4_1.z.strictObject({
    title: v4_1.z.string().min(1, '제목을 입력해 주세요'),
    subtitle: v4_1.z.string().min(1, '부제를 입력해 주세요'),
    description: v4_1.z.string().min(1, '설명을 입력해 주세요'),
    price: v4_1.z.string().min(1, '가격을 입력해 주세요'),
    active: v4_1.z.boolean().default(true),
});
const updateLessonSchema = v4_1.z.strictObject({
    title: v4_1.z.string().min(1).optional(),
    subtitle: v4_1.z.string().min(1).optional(),
    description: v4_1.z.string().min(1).optional(),
    price: v4_1.z.string().min(1).optional(),
    active: v4_1.z.boolean().optional(),
});
const reorderSchema = v4_1.z.strictObject({
    orderedIds: v4_1.z.array(v4_1.z.string().min(1)).min(1).max(500),
});
// GET /api/lessons
exports.lessonRouter.get('/', async (req, res, next) => {
    try {
        const isAdmin = req.session?.isAdmin === true;
        const filter = {};
        if (!isAdmin) {
            filter.active = true;
        }
        const items = await Lesson_1.Lesson.find(filter).sort({ sortOrder: 1 });
        res.json({ items });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/lessons/:id
exports.lessonRouter.get('/:id', async (req, res, next) => {
    try {
        const lesson = await Lesson_1.Lesson.findById(req.params.id).orFail();
        res.json(lesson);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/lessons
exports.lessonRouter.post('/', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = createLessonSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const top = await Lesson_1.Lesson.findOne().sort({ sortOrder: 1 }).select({ sortOrder: 1 }).lean();
        const nextSortOrder = top ? top.sortOrder - 1 : 0;
        const lesson = await Lesson_1.Lesson.create({
            ...parsed.data,
            sortOrder: nextSortOrder,
        });
        res.status(201).json(lesson);
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/lessons/:id
exports.lessonRouter.put('/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = updateLessonSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const lesson = await Lesson_1.Lesson.findByIdAndUpdate(req.params.id, parsed.data, {
            new: true,
            runValidators: true,
        }).orFail();
        res.json(lesson);
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/lessons/:id
exports.lessonRouter.delete('/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        await Lesson_1.Lesson.findByIdAndDelete(req.params.id).orFail();
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
// PATCH /api/lessons/reorder
exports.lessonRouter.patch('/reorder', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = reorderSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const operations = parsed.data.orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { sortOrder: index } },
            },
        }));
        if (operations.length > 0) {
            await Lesson_1.Lesson.bulkWrite(operations);
        }
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
