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
