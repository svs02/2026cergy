"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryRouter = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const express_1 = require("express");
const v4_1 = require("zod/v4");
const Gallery_1 = require("../models/Gallery");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../lib/multer");
exports.galleryRouter = (0, express_1.Router)();
const galleryCategoryValues = Object.values(Gallery_1.GalleryCategory);
const createGallerySchema = v4_1.z.strictObject({
    category: v4_1.z.enum(galleryCategoryValues),
    caption: v4_1.z.string().optional(),
    featured: v4_1.z
        .union([v4_1.z.boolean(), v4_1.z.enum(['true', 'false'])])
        .optional()
        .transform((value) => {
        if (typeof value === 'boolean') {
            return value;
        }
        if (value === 'true') {
            return true;
        }
        return false;
    }),
});
const reorderSchema = v4_1.z.strictObject({
    orderedIds: v4_1.z.array(v4_1.z.string().min(1)).min(1).max(500),
});
exports.galleryRouter.get('/', async (req, res, next) => {
    try {
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const filter = {};
        if (category && category !== '전체') {
            filter.category = category;
        }
        const items = await Gallery_1.Gallery.find(filter).sort({ sortOrder: 1 });
        res.json({ items });
    }
    catch (error) {
        next(error);
    }
});
exports.galleryRouter.post('/', auth_1.requireAdmin, multer_1.galleryUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
]), async (req, res, next) => {
    try {
        const files = req.files;
        const imageFile = files?.image?.[0];
        const thumbnailFile = files?.thumbnail?.[0];
        if (!imageFile) {
            res.status(400).json({ error: '파일이 필요합니다' });
            return;
        }
        const parsed = createGallerySchema.safeParse(req.body);
        if (!parsed.success) {
            await promises_1.default.unlink(imageFile.path).catch(() => { });
            if (thumbnailFile) {
                await promises_1.default.unlink(thumbnailFile.path).catch(() => { });
            }
            res.status(400).json({ error: '입력값이 올바르지 않습니다', details: parsed.error.issues });
            return;
        }
        const top = await Gallery_1.Gallery.findOne().sort({ sortOrder: 1 }).select({ sortOrder: 1 }).lean();
        const nextSortOrder = top ? top.sortOrder - 1 : 0;
        const gallery = await Gallery_1.Gallery.create({
            imageUrl: `/uploads/${imageFile.filename}`,
            mediaType: (0, multer_1.mediaTypeFromMime)(imageFile.mimetype),
            thumbnailUrl: thumbnailFile ? `/uploads/${thumbnailFile.filename}` : undefined,
            caption: parsed.data.caption ?? '',
            category: parsed.data.category,
            featured: parsed.data.featured ?? false,
            sortOrder: nextSortOrder,
        });
        res.status(201).json(gallery);
    }
    catch (error) {
        next(error);
    }
});
exports.galleryRouter.patch('/reorder', auth_1.requireAdmin, async (req, res, next) => {
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
            await Gallery_1.Gallery.bulkWrite(operations);
        }
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
exports.galleryRouter.delete('/:id', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const gallery = await Gallery_1.Gallery.findById(req.params.id).orFail();
        const fileName = path_1.default.basename(gallery.imageUrl);
        await promises_1.default.unlink(path_1.default.join(multer_1.UPLOAD_DIR, fileName)).catch(() => { });
        if (gallery.thumbnailUrl) {
            const thumbName = path_1.default.basename(gallery.thumbnailUrl);
            await promises_1.default.unlink(path_1.default.join(multer_1.UPLOAD_DIR, thumbName)).catch(() => { });
        }
        await Gallery_1.Gallery.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    }
    catch (error) {
        next(error);
    }
});
