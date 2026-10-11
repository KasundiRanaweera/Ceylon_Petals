// Shrinks a photo in the browser before saving it.
// TODO (backend): upload the File to POST /api/admin/uploads (Cloudinary) and store the returned URL
// instead of this data URL — browser storage only holds a few MB.

export function resizeImage(file: File, maxSize = 1000, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`${file.name} is not an image.`))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read ${file.name}.`))
    }
    img.src = url
  })
}

// Stitch photos come from Google's image server, which sends a blurry 512 px copy unless a
// width is asked for. These helpers request a sharp size (the originals top out at 1408 px).
// Our own product photos live in /images/products as "<slug>-640.webp" and "<slug>-1280.webp".
// Other URLs (uploads, data URLs) are returned unchanged.
const GOOGLE_IMAGE = /^https:\/\/lh3\.googleusercontent\.com\/[^=]+$/
const LOCAL_IMAGE = /^(\/images\/products\/.+)-(640|1280)\.webp$/

export function sizedImage(url: string, width: number): string {
  if (GOOGLE_IMAGE.test(url)) return `${url}=w${width}`
  const local = url.match(LOCAL_IMAGE)
  if (local) return `${local[1]}-${width <= 640 ? 640 : 1280}.webp`
  return url
}

/** srcset so phones load a smaller file and large / retina screens get the sharp one. */
export function imageSrcSet(url: string, widths: number[] = [640, 960, 1408]): string | undefined {
  const local = url.match(LOCAL_IMAGE)
  if (local) return `${local[1]}-640.webp 640w, ${local[1]}-1280.webp 1280w`
  if (!GOOGLE_IMAGE.test(url)) return undefined
  return widths.map((w) => `${url}=w${w} ${w}w`).join(', ')
}
