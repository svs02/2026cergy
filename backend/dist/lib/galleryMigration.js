"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateGallerySortOrder = migrateGallerySortOrder;
const Gallery_1 = require("../models/Gallery");
async function migrateGallerySortOrder() {
    const pending = await Gallery_1.Gallery.find({ sortOrder: { $exists: false } })
        .sort({ createdAt: -1 })
        .select({ _id: 1 })
        .lean();
    if (pending.length === 0) {
        return;
    }
    const operations = pending.map((doc, index) => ({
        updateOne: {
            filter: { _id: doc._id },
            update: { $set: { sortOrder: index } },
        },
    }));
    await Gallery_1.Gallery.bulkWrite(operations);
    console.log(`갤러리 sortOrder 마이그레이션 완료: ${pending.length}건`);
}
