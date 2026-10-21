import { deleteUnusedStoredImages } from '../services/storedImages.js'

const EVERY_HOURS = 6

async function run() {
  try {
    const removed = await deleteUnusedStoredImages()
    if (removed > 0) console.log(`[images] removed ${removed} uploaded photo(s) no product or category uses`)
  } catch (error) {
    console.error('[images] cleaning up unused photos failed:', error)
  }
}

/** Removes uploaded photos nothing uses, a little after start-up and then every few hours. */
export function startPhotoCleanupJob() {
  setTimeout(() => void run(), 60_000).unref()
  setInterval(() => void run(), EVERY_HOURS * 3600_000).unref()
}
