"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lesson = void 0;
const mongoose_1 = require("mongoose");
const lessonSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    sortOrder: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
}, { timestamps: true });
lessonSchema.index({ sortOrder: 1 });
exports.Lesson = (0, mongoose_1.model)('Lesson', lessonSchema);
