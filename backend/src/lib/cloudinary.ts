import { createHash } from 'node:crypto'
import { env } from '../config/env.js'
import { serviceUnavailable } from './errors.js'

// Product photos live on Cloudinary. The browser uploads the file DIRECTLY to Cloudinary, using a
// signature this server makes, so photos never pass through (or fill up) our API. The server
// only ever sees the final https address, which it stores on the product.
//
// Signing, as in Cloudinary's documentation: take the upload parameters, sort them by name, join
// as name=value with "&", append the API secret, and SHA-1 the result.

const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif'

export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1').update(toSign + apiSecret).digest('hex')
}

export interface UploadSignature {
  /** Post the photo (field "file") plus every field in `params` to this address. */
  uploadUrl: string
  params: { api_key: string; timestamp: number; folder: string; allowed_formats: string; signature: string }
}

export function createUploadSignature(now: Date = new Date()): UploadSignature {
  const { configured, cloudName, apiKey, apiSecret, folder } = env.cloudinary
  if (!configured) throw serviceUnavailable('Photo uploads are not set up yet. You can paste a link to a photo instead.')

  const timestamp = Math.floor(now.getTime() / 1000)
  // Only these fields are signed, so the browser cannot upload anywhere else or change the format rules.
  const signature = signParams({ allowed_formats: ALLOWED_FORMATS, folder, timestamp }, apiSecret)
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    params: { api_key: apiKey, timestamp, folder, allowed_formats: ALLOWED_FORMATS, signature },
  }
}

/** "https://res.cloudinary.com/demo/image/upload/v123/ceylon-petals/products/abc.jpg" -> "ceylon-petals/products/abc" */
export function publicIdFromUrl(url: string): string | null {
  if (!env.cloudinary.configured) return null
  const prefix = `https://res.cloudinary.com/${env.cloudinary.cloudName}/image/upload/`
  if (!url.startsWith(prefix)) return null
  const match = url.slice(prefix.length).match(/^(?:v\d+\/)?(.+)\.[A-Za-z0-9]+$/)
  return match?.[1] ?? null
}

/** Deletes a photo from Cloudinary. Best effort: a failure is logged and never blocks the owner. */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const { configured, cloudName, apiKey, apiSecret } = env.cloudinary
  if (!configured) return
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature: signParams({ public_id: publicId, timestamp }, apiSecret),
    })
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body })
    if (!res.ok) console.warn(`[uploads] Cloudinary refused to delete ${publicId} (HTTP ${res.status})`)
  } catch (error) {
    console.warn(`[uploads] could not delete ${publicId} from Cloudinary:`, error)
  }
}
