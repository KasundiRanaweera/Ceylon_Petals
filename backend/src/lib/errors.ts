// Errors the API throws on purpose. The error handler (middleware/errorHandler.ts) turns each
// one into a JSON response with the right HTTP status, so route code just throws.
//
//   throw notFound('Product not found')
//   throw conflict('An account with this email already exists')

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'TOO_MANY_REQUESTS'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    /** Extra info for the client, e.g. which form field is wrong. */
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const badRequest = (message = 'Bad request', details?: unknown) => new AppError(400, 'BAD_REQUEST', message, details)
export const unauthorized = (message = 'Please sign in to continue') => new AppError(401, 'UNAUTHORIZED', message)
export const forbidden = (message = 'You do not have permission to do that') => new AppError(403, 'FORBIDDEN', message)
export const notFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message)
export const conflict = (message: string, details?: unknown) => new AppError(409, 'CONFLICT', message, details)
/** The request was understood but cannot be done, e.g. "only 2 left in stock". */
export const unprocessable = (message: string, details?: unknown) => new AppError(422, 'UNPROCESSABLE', message, details)
export const tooManyRequests = (message = 'Too many attempts. Please wait a moment and try again.') =>
  new AppError(429, 'TOO_MANY_REQUESTS', message)
/** A feature that is switched off or not set up yet, e.g. card payments. */
export const serviceUnavailable = (message: string) => new AppError(503, 'SERVICE_UNAVAILABLE', message)
