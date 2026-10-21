import { Router } from 'express'
import { idParams } from '../lib/validation.js'
import { notFound } from '../lib/errors.js'
import { getStoredImage } from '../services/storedImages.js'

export const imagesRouter = Router()

// GET /api/images/:id  ->  a photo the owner uploaded (see services/storedImages.ts).
// A stored photo never changes (a new upload gets a new id), so browsers may keep it for a year.
imagesRouter.get('/:id', async (req, res) => {
  const image = await getStoredImage(idParams.parse(req.params).id)
  if (!image) throw notFound('Photo not found')
  res.set({
    'Content-Type': image.mime,
    'Content-Length': String(image.data.length),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': 'inline',
    // Photos are shown on our own pages; this stops them being opened as anything but an image.
    'Content-Security-Policy': "default-src 'none'",
    'Cross-Origin-Resource-Policy': 'cross-origin',
  })
  res.end(image.data)
})
