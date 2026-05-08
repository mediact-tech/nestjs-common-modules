import Fastify, { FastifyInstance } from 'fastify'
import {
  correlationMiddleware,
  getCorrelationId,
  getUserId,
  setUserId,
  getRequestContext,
  CORRELATION_ID_HEADER,
} from './correlation.middleware'

describe('correlation.middleware', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    await app.register(correlationMiddleware)
  })

  afterEach(async () => {
    await app.close()
  })

  describe('outside request context', () => {
    it('returns undefined for getCorrelationId / getUserId / getRequestContext', () => {
      expect(getCorrelationId()).toBeUndefined()
      expect(getUserId()).toBeUndefined()
      expect(getRequestContext()).toBeUndefined()
    })

    it('setUserId is a no-op outside context', () => {
      expect(() => setUserId('u-1')).not.toThrow()
      expect(getUserId()).toBeUndefined()
    })
  })

  describe('inside fastify request', () => {
    it('reuses incoming x-correlation-id header', async () => {
      let captured: string | undefined
      app.get('/t', (req, reply) => {
        captured = getCorrelationId()
        reply.send({ ok: true })
      })

      const res = await app.inject({
        method: 'GET',
        url: '/t',
        headers: { [CORRELATION_ID_HEADER]: 'fixed-id-123' },
      })

      expect(captured).toBe('fixed-id-123')
      expect(res.headers[CORRELATION_ID_HEADER]).toBe('fixed-id-123')
    })

    it('generates a new correlation id when missing', async () => {
      let captured: string | undefined
      app.get('/t', (req, reply) => {
        captured = getCorrelationId()
        reply.send({ ok: true })
      })

      const res = await app.inject({ method: 'GET', url: '/t' })

      expect(captured).toBeDefined()
      expect(captured).toMatch(/[0-9a-f-]{36}/i)
      expect(res.headers[CORRELATION_ID_HEADER]).toBe(captured)
    })

    it('exposes requestTimestamp in context', async () => {
      let ts: number | undefined
      app.get('/t', (req, reply) => {
        ts = getRequestContext()?.requestTimestamp
        reply.send({})
      })
      const before = Date.now()
      await app.inject({ method: 'GET', url: '/t' })
      expect(ts).toBeGreaterThanOrEqual(before)
    })

    it('setUserId stores userId in current context', async () => {
      let captured: string | undefined
      app.get('/t', (req, reply) => {
        setUserId('user-42')
        captured = getUserId()
        reply.send({})
      })
      await app.inject({ method: 'GET', url: '/t' })
      expect(captured).toBe('user-42')
    })

    it('isolates context between concurrent requests', async () => {
      const seen: string[] = []
      app.get('/t', async (req, reply) => {
        const id = getCorrelationId()!
        await new Promise((r) => setTimeout(r, 10))
        // After awaiting, ALS must still resolve to the same id
        expect(getCorrelationId()).toBe(id)
        seen.push(id)
        reply.send({})
      })

      await Promise.all([
        app.inject({ method: 'GET', url: '/t', headers: { [CORRELATION_ID_HEADER]: 'a' } }),
        app.inject({ method: 'GET', url: '/t', headers: { [CORRELATION_ID_HEADER]: 'b' } }),
        app.inject({ method: 'GET', url: '/t', headers: { [CORRELATION_ID_HEADER]: 'c' } }),
      ])

      expect(seen.sort()).toEqual(['a', 'b', 'c'])
    })
  })
})
