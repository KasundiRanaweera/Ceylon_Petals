import axios, { isAxiosError } from 'axios'

// One axios instance for the whole site.
//
// VITE_API_URL is the address of the backend ("https://api.example.com"). Leave it empty in
// development: requests go to /api on the same address as the website and Vite forwards them to
// the backend (see vite.config.ts), so the login cookie behaves like a normal same-site cookie.
const origin = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export const api = axios.create({
  baseURL: `${origin}/api`,
  // The login is an httpOnly cookie the server sets. The browser only sends it when asked to.
  withCredentials: true,
  timeout: 20_000,
})

/** An error from the server, with the friendly sentence the pages show to people. */
export class ApiError extends Error {
  status: number
  code: string
  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: { field?: string; message?: string }[] }
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!isAxiosError<ErrorBody>(error)) throw error
    if (!error.response) {
      throw new ApiError("We couldn't reach the shop's server. Please check your connection and try again.", 0, 'NETWORK_ERROR')
    }
    const { status, data } = error.response
    const body = data?.error
    // For form mistakes the first detail is the friendliest sentence ("Please enter your name").
    const message =
      (body?.code === 'VALIDATION_ERROR' && body.details?.[0]?.message) ||
      body?.message ||
      (status >= 500 ? 'Something went wrong on our side. Please try again.' : 'Something went wrong. Please try again.')
    throw new ApiError(message, status, body?.code ?? 'ERROR')
  }
)

/** Runs a request and returns just the data. */
export async function get<T>(url: string, params?: object, headers?: Record<string, string>): Promise<T> {
  return (await api.get<T>(url, { params, headers })).data
}
export async function post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  return (await api.post<T>(url, body, { headers })).data
}
export async function put<T>(url: string, body?: unknown): Promise<T> {
  return (await api.put<T>(url, body)).data
}
export async function patch<T>(url: string, body?: unknown): Promise<T> {
  return (await api.patch<T>(url, body)).data
}
export async function del(url: string): Promise<void> {
  await api.delete(url)
}

/** True when a failure means "not there / not allowed to see it" rather than a real problem. */
export function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 403 || error.status === 401)
}
