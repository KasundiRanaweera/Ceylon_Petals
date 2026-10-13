import { describe, expect, it } from 'vitest'
import express from 'express'
import request from 'supertest'
import { z } from 'zod'
import { createApp } from '../app.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { conflict, forbidden, notFound } from '../lib/errors.js'
import { emailSchema, phoneSchema } from '../lib/validation.js'
import { isValidPhone, normalizePhone, samePhone } from '../lib/phone.js'

describe('app', () => {
  const app = createApp()

  it('answers the health check', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nothing-here')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('returns a JSON 400 for malformed JSON bodies', async () => {
    const res = await request(app).post('/api/health').set('Content-Type', 'application/json').send('{"broken":')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('sends security headers and hides Express', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('allows the frontend origin and blocks others', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173')
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(allowed.headers['access-control-allow-credentials']).toBe('true')
    const blocked = await request(app).get('/api/health').set('Origin', 'https://evil.example')
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('error handler', () => {
  const app = express()
  app.use(express.json())
  app.get('/not-found', () => {
    throw notFound('Product not found')
  })
  app.get('/forbidden', () => {
    throw forbidden()
  })
  app.get('/conflict', () => {
    throw conflict('Email already used')
  })
  app.get('/async', async () => {
    throw conflict('Raised from an async handler')
  })
  app.get('/bug', () => {
    throw new Error('database exploded')
  })
  app.post('/validate', (req, res) => {
    const body = z.object({ email: emailSchema, phone: phoneSchema }).parse(req.body)
    res.json(body)
  })
  app.use(errorHandler)

  it('maps thrown AppErrors to their status and code', async () => {
    const nf = await request(app).get('/not-found')
    expect(nf.status).toBe(404)
    expect(nf.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Product not found' } })
    expect((await request(app).get('/forbidden')).status).toBe(403)
    expect((await request(app).get('/conflict')).status).toBe(409)
  })

  it('catches errors thrown inside async handlers (Express 5)', async () => {
    const res = await request(app).get('/async')
    expect(res.status).toBe(409)
  })

  it('does not leak anything for unexpected errors beyond a 500', async () => {
    const res = await request(app).get('/bug')
    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
  })

  it('turns Zod failures into a 400 listing the bad fields', async () => {
    const res = await request(app).post('/validate').send({ email: 'nope', phone: '12' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    const fields = res.body.error.details.map((d: { field: string }) => d.field)
    expect(fields).toEqual(expect.arrayContaining(['email', 'phone']))
  })

  it('cleans valid input (lower-cases email, normalises phone)', async () => {
    const res = await request(app).post('/validate').send({ email: '  Amaya@Example.COM ', phone: '077 123 4567' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ email: 'amaya@example.com', phone: '94771234567' })
  })
})

describe('phone helpers', () => {
  it('normalises Sri Lankan and overseas numbers', () => {
    expect(normalizePhone('077 123 4567')).toBe('94771234567')
    expect(normalizePhone('+94 77 123 4567')).toBe('94771234567')
    expect(normalizePhone('77 123 4567')).toBe('94771234567')
    expect(normalizePhone('0044 7700 900123')).toBe('447700900123')
  })

  it('validates', () => {
    expect(isValidPhone('0771234567')).toBe(true)
    expect(isValidPhone('+44 7700 900123')).toBe(true)
    expect(isValidPhone('12345')).toBe(false)
    expect(isValidPhone('94 77 123')).toBe(false)
  })

  it('compares loosely', () => {
    expect(samePhone('0771234567', '+94 77 123 4567')).toBe(true)
    expect(samePhone('0771234567', '0771234568')).toBe(false)
  })
})
