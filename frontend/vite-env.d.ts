/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend address, e.g. https://api.example.com. Empty in development (Vite forwards /api). */
  readonly VITE_API_URL?: string
}
