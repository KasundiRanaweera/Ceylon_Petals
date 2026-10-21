import { prisma } from '../lib/prisma.js'
import { badRequest } from '../lib/errors.js'

// Photos the owner uploads when Cloudinary is not set up. They are kept in the database (so they
// survive redeploys, unlike files on the server's disk) and served at /api/images/<id>.
// The browser shrinks each photo before sending it, so a product photo is usually 100-400 KB.

export const STORED_IMAGE_MAX_BYTES = 5 * 1024 * 1024

const STORED_URL = /^\/api\/images\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/

/** The photo types we accept, recognised by their first bytes (never by the name or the browser's claim). */
export function detectImageType(bytes: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | null {
  if (bytes.length < 12) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (bytes.toString('ascii', 4, 8) === 'ftyp' && /^avi[fs]$/.test(bytes.toString('ascii', 8, 12))) return 'image/avif'
  return null
}

/** Saves an uploaded photo and returns the address to store on the product. */
export async function saveStoredImage(bytes: Buffer): Promise<{ url: string }> {
  if (bytes.length === 0) throw badRequest('The photo is empty.')
  if (bytes.length > STORED_IMAGE_MAX_BYTES) throw badRequest('The photo is larger than 5 MB. Please choose a smaller photo.')
  const mime = detectImageType(bytes)
  if (!mime) throw badRequest('Please upload a JPG, PNG, WebP or AVIF photo.')
  const row = await prisma.storedImage.create({ data: { mime, data: new Uint8Array(bytes), size: bytes.length }, select: { id: true } })
  return { url: `/api/images/${row.id}` }
}

export async function getStoredImage(id: string): Promise<{ mime: string; data: Buffer } | null> {
  const row = await prisma.storedImage.findUnique({ where: { id }, select: { mime: true, data: true } })
  return row ? { mime: row.mime, data: Buffer.from(row.data) } : null
}

/** The stored photo's id, if this address is one of ours. */
export function storedImageId(url: string): string | null {
  return url.match(STORED_URL)?.[1] ?? null
}

export function isStoredImageUrl(url: string): boolean {
  return storedImageId(url) !== null
}

/** Deletes a stored photo. Best effort: a failure is logged and never blocks the owner. */
export async function deleteStoredImage(id: string): Promise<void> {
  try {
    await prisma.storedImage.deleteMany({ where: { id } })
  } catch (err) {
    console.warn(`[images] could not delete stored photo ${id}:`, (err as Error).message)
  }
}

/**
 * Deletes uploaded photos that no product or category uses, once they are a day old (an upload the
 * owner never saved, or a photo since replaced). Returns how many were removed.
 */
export async function deleteUnusedStoredImages(olderThanHours = 24): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanHours * 3600_000)
  const candidates = await prisma.storedImage.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true } })
  if (candidates.length === 0) return 0
  const urls = candidates.map((c) => `/api/images/${c.id}`)
  const [inProducts, inCategories] = await Promise.all([
    prisma.productImage.findMany({ where: { url: { in: urls } }, select: { url: true } }),
    prisma.category.findMany({ where: { imageUrl: { in: urls } }, select: { imageUrl: true } }),
  ])
  const used = new Set([...inProducts.map((p) => p.url), ...inCategories.map((c) => c.imageUrl)])
  const unused = candidates.filter((c) => !used.has(`/api/images/${c.id}`)).map((c) => c.id)
  if (unused.length === 0) return 0
  const { count } = await prisma.storedImage.deleteMany({ where: { id: { in: unused } } })
  return count
}
