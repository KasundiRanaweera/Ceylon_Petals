import axios from 'axios'
import { get, post } from '../lib/api'

// Product photos. When Cloudinary is set up, they go straight from the browser to Cloudinary (the
// server only signs the upload). Without it, the browser shrinks each photo and sends it to the shop
// itself, which keeps it in the database and serves it at /api/images/<id>. Either way the owner
// just picks photos from their phone or computer; pasting a link still works too.

interface UploadSignature {
  uploadUrl: string
  params: Record<string, string | number>
}

const MAX_BYTES = 10 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
// iPhone photos. Browsers that can open them are converted to WebP/JPEG before upload.
const PHONE_TYPES = ['image/heic', 'image/heif']
// Photos saved in the shop are shrunk to this size first: sharp on product pages, small to store.
const MAX_SIDE = 1600

let modeRequest: Promise<'cloudinary' | 'shop'> | null = null
function uploadMode() {
  modeRequest ??= get<{ mode: 'cloudinary' | 'shop' }>('/admin/uploads/mode').then((r) => r.mode, (err) => {
    modeRequest = null
    throw err
  })
  return modeRequest
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** Shrinks a photo to at most MAX_SIDE pixels on its longest side, as WebP (or JPEG where WebP can't be made). */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const webp = await canvasToBlob(canvas, 'image/webp', 0.86)
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.88)
  if (jpeg) return jpeg
  throw new Error('could not encode')
}

async function uploadToCloudinary(file: File): Promise<string> {
  const { uploadUrl, params } = await post<UploadSignature>('/admin/uploads/sign')
  const body = new FormData()
  for (const [key, value] of Object.entries(params)) body.append(key, String(value))
  body.append('file', file)
  // A plain axios call (not our API client): this goes to Cloudinary, which must not get our cookie.
  const { data } = await axios.post<{ secure_url?: string }>(uploadUrl, body, { timeout: 60_000 })
  if (!data.secure_url) throw new Error('missing link')
  return data.secure_url
}

async function uploadToShop(file: File): Promise<string> {
  let photo: Blob
  try {
    photo = await shrink(file)
  } catch {
    photo = file // the browser could not read it; let the server check the original
  }
  const { url } = await post<{ url: string }>('/admin/uploads', photo, { 'Content-Type': photo.type || file.type })
  return url
}

/** Uploads one photo and returns the address to save on the product. */
export async function uploadPhoto(original: File): Promise<string> {
  let file = original
  if (PHONE_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name)) {
    try {
      const converted = await shrink(file)
      file = new File([converted], file.name.replace(/\.hei[cf]$/i, converted.type === 'image/webp' ? '.webp' : '.jpg'), { type: converted.type })
    } catch {
      throw new Error(`${file.name} is an iPhone (HEIC) photo this browser can't open. Please choose JPG or PNG, or set the iPhone camera to "Most Compatible".`)
    }
  }
  if (!TYPES.includes(file.type)) throw new Error(`${file.name} is not a JPG, PNG, WebP or AVIF photo.`)
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB. Please choose a smaller photo.`)
  try {
    return (await uploadMode()) === 'cloudinary' ? await uploadToCloudinary(file) : await uploadToShop(file)
  } catch (err) {
    const message = (err as { message?: string })?.message
    throw new Error(message && !/^(missing link|Network Error|Request failed)/.test(message) ? message : `Could not upload ${file.name}. Please try again.`, { cause: err })
  }
}
