import { Gallery } from '../models/Gallery'

export async function migrateGallerySortOrder(): Promise<void> {
  const pending = await Gallery.find({ sortOrder: { $exists: false } })
    .sort({ createdAt: -1 })
    .select({ _id: 1 })
    .lean()

  if (pending.length === 0) {
    return
  }

  const operations = pending.map((doc, index) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { sortOrder: index } },
    },
  }))

  await Gallery.bulkWrite(operations)
  console.log(`갤러리 sortOrder 마이그레이션 완료: ${pending.length}건`)
}
