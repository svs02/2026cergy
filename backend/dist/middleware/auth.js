"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
function requireAdmin(req, res, next) {
    if (!req.session?.isAdmin) {
        res.status(401).json({ error: '관리자 인증이 필요합니다' });
        return;
    }
    next();
}
