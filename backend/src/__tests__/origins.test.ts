import { afterEach, describe, expect, it, vi } from 'vitest'

// Which websites may talk to the API from a browser (the CSRF allow-list).
async function allowedIn(nodeEnv: string) {
  vi.resetModules()
  vi.stubEnv('NODE_ENV', nodeEnv)
  vi.stubEnv('FRONTEND_URL', 'https://shop.example.com')
  return (await import('../config/env.js')).isAllowedOrigin
}

afterEach(() => vi.unstubAllEnvs())

describe('allowed origins', () => {
  it('accepts the configured website everywhere (with or without a trailing slash)', async () => {
    for (const mode of ['development', 'production', 'test']) {
      const allowed = await allowedIn(mode)
      expect(allowed('https://shop.example.com'), mode).toBe(true)
      expect(allowed('https://shop.example.com/'), mode).toBe(true)
    }
  })

  it('never accepts other websites', async () => {
    for (const mode of ['development', 'production', 'test']) {
      const allowed = await allowedIn(mode)
      expect(allowed('https://evil.example'), mode).toBe(false)
      expect(allowed('https://shop.example.com.evil.example'), mode).toBe(false)
      expect(allowed('http://localhost.evil.example'), mode).toBe(false)
    }
  })

  it('in development any localhost port works (Vite moves to 5174 when 5173 is busy)', async () => {
    const allowed = await allowedIn('development')
    expect(allowed('http://localhost:5174')).toBe(true)
    expect(allowed('http://127.0.0.1:4173')).toBe(true)
  })

  it('in production and tests localhost is NOT accepted unless configured', async () => {
    for (const mode of ['production', 'test']) {
      const allowed = await allowedIn(mode)
      expect(allowed('http://localhost:5174'), mode).toBe(false)
    }
  })
})
