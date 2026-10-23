import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // Fake settings so the tests never touch your real database or secrets.
    // (dotenv does not override variables that are already set.)
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123456',
      FRONTEND_URL: 'http://localhost:5173',
      BCRYPT_ROUNDS: '4', // fast hashing in tests
      GROQ_API_KEY: 'test-groq-key', // the AI itself is always mocked in tests
      GROQ_API_KEY: 'test-groq-key', // the AI itself is always mocked in tests
    },
  },
})
