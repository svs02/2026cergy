"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const multer_1 = require("../lib/multer");
const auth_1 = require("../middleware/auth");
exports.uploadRouter = (0, express_1.Router)();
exports.uploadRouter.post('/', auth_1.requireAdmin, multer_1.upload.single('image'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: '이미지 파일이 필요합니다' });
        return;
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
