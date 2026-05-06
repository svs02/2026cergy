"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notice = exports.NoticeTag = void 0;
const mongoose_1 = require("mongoose");
exports.NoticeTag = {
    NOTICE: 'NOTICE',
    EVENT: 'EVENT',
};
const noticeSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    images: { type: [String], default: [] },
    tag: {
        type: String,
        required: true,
        enum: Object.values(exports.NoticeTag),
        default: exports.NoticeTag.NOTICE,
    },
    views: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },
}, { timestamps: true });
noticeSchema.index({ isPinned: -1, pinnedAt: -1, createdAt: -1 });
exports.Notice = (0, mongoose_1.model)('Notice', noticeSchema);
