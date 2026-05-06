"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instructor = exports.Day = exports.PhotoTone = void 0;
const mongoose_1 = require("mongoose");
exports.PhotoTone = {
    GREEN: 'green',
    GREEN_L: 'greenL',
    WOOD: 'wood',
    SUN: 'sun',
    CREAM: 'cream',
    IVORY: 'ivory',
};
exports.Day = {
    MON: '월',
    TUE: '화',
    WED: '수',
    THU: '목',
    FRI: '금',
    SAT: '토',
    SUN: '일',
};
const scheduleSlotSchema = new mongoose_1.Schema({
    day: { type: String, required: true, enum: Object.values(exports.Day) },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    lessonName: { type: String, required: true },
}, { _id: false });
const instructorSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    nameEn: { type: String, required: true },
    role: { type: String, required: true },
    photoUrl: { type: String },
    tone: {
        type: String,
        required: true,
        enum: Object.values(exports.PhotoTone),
    },
    major: { type: String, required: true },
    career: { type: [String], required: true },
    quote: { type: String },
    schedule: { type: [scheduleSlotSchema], default: [] },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, required: true, default: 0 },
    active: { type: Boolean, default: true },
}, { timestamps: true });
instructorSchema.index({ sortOrder: 1 });
exports.Instructor = (0, mongoose_1.model)('Instructor', instructorSchema);
