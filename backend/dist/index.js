"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./env");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./lib/db");
const galleryMigration_1 = require("./lib/galleryMigration");
async function bootstrap() {
    await (0, db_1.connectDB)();
    await (0, galleryMigration_1.migrateGallerySortOrder)();
    app_1.default.listen(Number(env_1.env.PORT), () => {
        console.log(`서버 실행 중: http://localhost:${env_1.env.PORT}`);
    });
}
bootstrap().catch((error) => {
    console.error('서버 시작 실패:', error);
    process.exit(1);
});
