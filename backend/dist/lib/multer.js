"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryUpload = exports.upload = exports.UPLOAD_DIR = void 0;
exports.mediaTypeFromMime = mediaTypeFromMime;
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
exports.UPLOAD_DIR = path_1.default.join(__dirname, '..', '..', 'uploads');
if (!fs_1.default.existsSync(exports.UPLOAD_DIR)) {
    fs_1.default.mkdirSync(exports.UPLOAD_DIR, { recursive: true });
}
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const ALLOWED_MEDIA_MIME = new Set([...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME]);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, exports.UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const randomHex = crypto_1.default.randomBytes(6).toString('hex');
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${timestamp}-${randomHex}${ext}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
            cb(new Error('허용되지 않는 이미지 형식입니다'));
            return;
        }
        cb(null, true);
    },
});
exports.galleryUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MEDIA_MIME.has(file.mimetype)) {
            callback(new Error('허용되지 않는 파일 형식입니다'));
            return;
        }
        callback(null, true);
    },
});
function mediaTypeFromMime(mime) {
    return ALLOWED_VIDEO_MIME.has(mime) ? 'video' : 'image';
}
