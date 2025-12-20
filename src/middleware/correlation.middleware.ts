import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'

/**
 * Request context store for correlation tracking
 */
export interface RequestContext {
  correlationId: string
  userId?: string
}

/**
 * AsyncLocalStorage instance for request context
 * This is the single source of truth for correlation ID and user ID
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Get the current correlation ID from request context
 */
export function getCorrelationId(): string | undefined {
  return asyncLocalStorage.getStore()?.correlationId
}

/**
 * Get the current user ID from request context
 */
export function getUserId(): string | undefined {
  return asyncLocalStorage.getStore()?.userId
}

/**
 * Set the user ID in the current request context
 * Call this after authentication to track which user made the request
 */
export function setUserId(userId: string): void {
  const store = asyncLocalStorage.getStore()
  if (store) {
    store.userId = userId
  }
}

/**
 * Get the full request context
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore()
}

/**
 * Correlation ID header name
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id'

/**
 * Fastify plugin that sets up correlation ID tracking via AsyncLocalStorage
 * This middleware MUST be registered for the logger to work correctly
 */
export const correlationMiddleware = fp(
  (fastify: FastifyInstance) => {
    fastify.addHook('onRequest', (req: FastifyRequest, reply: FastifyReply, done) => {
      const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID()

      asyncLocalStorage.run({ correlationId }, () => {
        // Set correlation ID in request headers for downstream use
        req.headers[CORRELATION_ID_HEADER] = correlationId
        // Also set in response headers for client tracking
        reply.header(CORRELATION_ID_HEADER, correlationId)
        done()
      })
    })
  },
)

/**
 * Internal function used by CustomLogger to get context
 * This is not exported in the public API
 */
export function _getLoggerContext(): { correlationId?: string; userId?: string } {
  const store = asyncLocalStorage.getStore()
  return {
    correlationId: store?.correlationId,
    userId: store?.userId,
  }
}
