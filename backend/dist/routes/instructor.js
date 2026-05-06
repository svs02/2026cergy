"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instructorRouter = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const express_1 = require("express");
const v4_1 = require("zod/v4");
const Instructor_1 = require("../models/Instructor");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../lib/multer");
exports.instructorRouter = (0, express_1.Router)();
const photoToneValues = Object.values(Instructor_1.PhotoTone);
const dayValues = Object.values(Instructor_1.Day);
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const scheduleSlotSchema = v4_1.z.strictObject({
    day: v4_1.z.enum(dayValues),
    startTime: v4_1.z.string().regex(timePattern, '시간 형식은 HH:mm이어야 합니다'),
    endTime: v4_1.z.string().regex(timePattern, '시간 형식은 HH:mm이어야 합니다'),
    lessonName: v4_1.z.string().min(1, '수업명을 입력해 주세요'),
}).check(v4_1.z.refine((slot) => slot.startTime < slot.endTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다',
}));
const createInstructorSchema = v4_1.z.strictObject({
    name: v4_1.z.string().min(1, '이름을 입력해 주세요'),
    nameEn: v4_1.z.string().min(1, '영문 이름을 입력해 주세요').regex(/^[A-Z\s]+$/, '영문 대문자와 공백만 입력 가능합니다'),
    role: v4_1.z.string().min(1, '직책을 입력해 주세요'),
    photoUrl: v4_1.z.string().optional(),
    tone: v4_1.z.enum(photoToneValues),
    major: v4_1.z.string().min(1, '전공을 입력해 주세요'),
    career: v4_1.z.array(v4_1.z.string().min(1)).min(1, '경력을 최소 1개 입력해 주세요').max(10),
    quote: v4_1.z.string().optional(),
    schedule: v4_1.z.array(scheduleSlotSchema).default([]),
    featured: v4_1.z.boolean().default(false),
    active: v4_1.z.boolean().default(true),
});
const updateInstructorSchema = v4_1.z.strictObject({
    name: v4_1.z.string().min(1).optional(),
    nameEn: v4_1.z.string().min(1).regex(/^[A-Z\s]+$/, '영문 대문자와 공백만 입력 가능합니다').optional(),
    role: v4_1.z.string().min(1).optional(),
    photoUrl: v4_1.z.string().nullable().optional(),
    tone: v4_1.z.enum(photoToneValues).optional(),
    major: v4_1.z.string().min(1).optional(),
    career: v4_1.z.array(v4_1.z.string().min(1)).min(1).max(10).optional(),
    quote: v4_1.z.string().nullable().optional(),
    schedule: v4_1.z.array(scheduleSlotSchema).optional(),
    featured: v4_1.z.boolean().optional(),
    active: v4_1.z.boolean().optional(),
});
const reorderSchema = v4_1.z.strictObject({
    orderedIds: v4_1.z.array(v4_1.z.string().min(1)).min(1).max(500),
});
// GET /api/instructors
exports.instructorRouter.get('/', async (req, res, next) => {
    try {
        const featured = req.query.featured === 'true';
        const isAdmin = req.session?.isAdmin === true;
        const filter = {};
        if (!isAdmin) {
            filter.active = true;
        }
        if (featured) {
            filter.featured = true;
        }
        const items = await Instructor_1.Instructor.find(filter).sort({ sortOrder: 1 });
        res.json({ items });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/instructors/:id
exports.instructorRouter.get('/:id', async (req, res, next) => {
    try {
        const instructor = await Instructor_1.Instructor.findById(req.params.id).orFail();
        res.json(instructor);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/instructors
exports.instructorRouter.post('/', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = createInstructorSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const top = await Instructor_1.Instructor.findOne().sort({ sortOrder: 1 }).select({ sortOrder: 1 }).lean();
        const nextSortOrder = top ? top.sortOrder - 1 : 0;
        const instructor = await Instructor_1.Instructor.create({
            ...parsed.data,
            sortOrder: nextSortOrder,
        });
        res.status(201).json(instructor);
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/instructors/:id
exports.instructorRouter.put('/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const parsed = updateInstructorSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const instructor = await Instructor_1.Instructor.findByIdAndUpdate(req.params.id, parsed.data, {
            new: true,
            runValidators: true,
        }).orFail();
        res.json(instructor);
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/instructors/:id
exports.instructorRouter.delete('/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const instructor = await Instructor_1.Instructor.findById(req.params.id).orFail();
        if (instructor.photoUrl) {
            const fileName = path_1.default.basename(instructor.photoUrl);
            await promises_1.default.unlink(path_1.default.join(multer_1.UPLOAD_DIR, fileName)).catch(() => { });
        }
        await Instructor_1.Instructor.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
// PATCH /api/instructors/reorder
exports.instructorRouter.patch('/reorder', auth_1.requireAdmin, async (req, res, next) => {
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
            await Instructor_1.Instructor.bulkWrite(operations);
        }
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
