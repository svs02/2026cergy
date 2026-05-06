"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gallery = exports.MediaType = exports.GalleryCategory = void 0;
const mongoose_1 = require("mongoose");
exports.GalleryCategory = {
    SPACE: '공간',
    LESSON: '레슨',
    RECITAL: '발표회',
    INSTRUMENT: '악기',
};
exports.MediaType = {
    IMAGE: 'image',
    VIDEO: 'video',
};
const gallerySchema = new mongoose_1.Schema({
    imageUrl: { type: String, required: true },
    mediaType: {
        type: String,
        required: true,
        default: exports.MediaType.IMAGE,
        enum: Object.values(exports.MediaType),
    },
    thumbnailUrl: { type: String },
    caption: { type: String, default: '' },
    category: {
        type: String,
        required: true,
        enum: Object.values(exports.GalleryCategory),
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, required: true, default: 0 },
}, { timestamps: true });
gallerySchema.index({ sortOrder: 1 });
exports.Gallery = (0, mongoose_1.model)('Gallery', gallerySchema);
