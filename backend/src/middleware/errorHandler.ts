import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '../generated/prisma/client.js'
import { env } from '../config/env.js'
import { AppError, notFound } from '../lib/errors.js'

// Every error response has the same shape, so the frontend handles all failures in one place:
//   { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }

function body(code: string, message: string, details?: unknown) {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } }
}

/** Requests that match no route. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(notFound(`Cannot ${req.method} ${req.path}`))
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // If the response has already started there is nothing useful we can still send.
  if (res.headersSent) return next(err)

  if (err instanceof AppError) {
    return res.status(err.status).json(body(err.code, err.message, err.details))
  }

  // Zod: the request body, query or params did not match the expected shape.
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    const first = details[0]
    const message = first?.field ? `${first.field}: ${first.message}` : (first?.message ?? 'Invalid request')
    return res.status(400).json(body('VALIDATION_ERROR', message, details))
  }

  // Prisma: translate the common database errors into friendly responses.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | string | undefined) ?? []
      const fields = Array.isArray(target) ? target.join(', ') : String(target)
      return res.status(409).json(body('CONFLICT', fields ? `A record with this ${fields} already exists` : 'This record already exists'))
    }
    if (err.code === 'P2025') return res.status(404).json(body('NOT_FOUND', 'That record was not found'))
    if (err.code === 'P2003') return res.status(409).json(body('CONFLICT', 'This record is still being used by something else'))
  }

  // body-parser (express.json) errors: bad JSON or a body that is too large.
  const parserError = err as { type?: string; status?: number }
  if (parserError.type === 'entity.parse.failed') return res.status(400).json(body('BAD_REQUEST', 'The request body is not valid JSON'))
  if (parserError.type === 'entity.too.large') return res.status(413).json(body('BAD_REQUEST', 'The request body is too large'))

  // Anything else is a bug. Log it for us, and show the customer a safe message.
  console.error(`[error] ${req.method} ${req.originalUrl}`, err)
  const message = env.isProduction ? 'Something went wrong on our side. Please try again.' : String((err as Error)?.message ?? err)
  return res.status(500).json(body('INTERNAL_ERROR', message))
}
