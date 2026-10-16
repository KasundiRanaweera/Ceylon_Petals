import axios from 'axios'
import { post } from '../lib/api'

// Product photos go straight from the browser to Cloudinary. The server only signs the upload
// (so nobody else can upload to our account) and never handles the image bytes.

interface UploadSignature {
  uploadUrl: string
  params: Record<string, string | number>
}

const MAX_BYTES = 10 * 1024 * 1024
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Uploads one photo and returns its https link. */
export async function uploadPhoto(file: File): Promise<string> {
  if (!TYPES.includes(file.type)) throw new Error(`${file.name} is not a JPG, PNG, WebP or AVIF photo.`)
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB. Please choose a smaller photo.`)

  const { uploadUrl, params } = await post<UploadSignature>('/admin/uploads/sign')
  const body = new FormData()
  for (const [key, value] of Object.entries(params)) body.append(key, String(value))
  body.append('file', file)

  try {
    // A plain axios call (not our API client): this goes to Cloudinary, which must not get our cookie.
    const { data } = await axios.post<{ secure_url?: string }>(uploadUrl, body, { timeout: 60_000 })
    if (!data.secure_url) throw new Error('missing link')
    return data.secure_url
  } catch {
    throw new Error(`Could not upload ${file.name}. Please try again.`)
  }
}
