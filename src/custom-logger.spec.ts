import Fastify, { FastifyInstance, FastifyRequest } from 'fastify'
import { AxiosResponse } from 'axios'
import { CustomLogger } from './custom-logger'
import { correlationMiddleware, CORRELATION_ID_HEADER } from './middleware/correlation.middleware'

type LogEntry = Record<string, any>

function makeLogger(opts: ConstructorParameters<typeof CustomLogger>[0] = {}): {
  logger: CustomLogger
  logs: LogEntry[]
} {
  const logs: LogEntry[] = []
  const logger = new CustomLogger(opts)
  // Replace pino logger with a stub that captures calls
  ;(logger as any).logger = {
    info: (obj: any, msg?: string) => logs.push({ level: 'info', obj, msg }),
    debug: (obj: any, msg?: string) => logs.push({ level: 'debug', obj, msg }),
    warn: (obj: any, msg?: string) => logs.push({ level: 'warn', obj, msg }),
    error: (obj: any, msg?: string) => logs.push({ level: 'error', obj, msg }),
    fatal: (obj: any, msg?: string) => logs.push({ level: 'fatal', obj, msg }),
    trace: (obj: any, msg?: string) => logs.push({ level: 'trace', obj, msg }),
    child: (bindings: any) => {
      const child = {
        info: (obj: any, msg?: string) => logs.push({ level: 'info', obj: { ...bindings, ...obj }, msg }),
        debug: (obj: any, msg?: string) => logs.push({ level: 'debug', obj: { ...bindings, ...obj }, msg }),
        warn: (obj: any, msg?: string) => logs.push({ level: 'warn', obj: { ...bindings, ...obj }, msg }),
        error: (obj: any, msg?: string) => logs.push({ level: 'error', obj: { ...bindings, ...obj }, msg }),
        fatal: (obj: any, msg?: string) => logs.push({ level: 'fatal', obj: { ...bindings, ...obj }, msg }),
        trace: (obj: any, msg?: string) => logs.push({ level: 'trace', obj: { ...bindings, ...obj }, msg }),
        child: (b: any) => ({ ...child, _bindings: { ...bindings, ...b } }),
      }
      return child
    },
  }
  return { logger, logs }
}

async function runInRequest<T>(fn: (req: FastifyRequest) => Promise<T> | T): Promise<T> {
  const app: FastifyInstance = Fastify()
  await app.register(correlationMiddleware)

  let result: T
  app.post('/api/test', async (req, reply) => {
    result = await fn(req)
    reply.send({ ok: true })
  })

  await app.inject({
    method: 'POST',
    url: '/api/test?foo=bar',
    headers: {
      [CORRELATION_ID_HEADER]: 'corr-123',
      authorization: 'Bearer secret-token',
    },
    payload: { username: 'john', password: 'p@ss' },
  })
  await app.close()
  return result!
}

describe('CustomLogger', () => {
  describe('logApiRequestResponse', () => {
    it('skips logging for health-check URLs', async () => {
      const { logger, logs } = makeLogger()
      const fakeReq = { url: '/health-check', method: 'GET', body: {}, query: {}, headers: {} } as any
      logger.logApiRequestResponse(fakeReq, '0000', 200, { ok: true })
      expect(logs).toHaveLength(0)
    })

    it('sanitizes body, query, headers and response', async () => {
      const { logger, logs } = makeLogger()
      await runInRequest((req) => {
        logger.logApiRequestResponse(req, '0000', 200, { token: 'abc', name: 'ok' })
      })

      expect(logs).toHaveLength(1)
      const entry = logs[0]
      expect(entry.msg).toBe('api-log')
      expect(entry.obj.body).toContain('[REDACTED]')
      expect(entry.obj.body).toContain('john')
      expect(entry.obj.header).toContain('[REDACTED]')
      expect(entry.obj.response).toContain('[REDACTED]')
      expect(entry.obj.response).toContain('"name":"ok"')
      expect(entry.obj.endpoint).toBe('/api/test?foo=bar')
      expect(entry.obj.method).toBe('POST')
      expect(entry.obj.statusCode).toBe('0000')
      expect(entry.obj.httpStatusCode).toBe(200)
      expect(entry.obj.correlationId).toBe('corr-123')
      expect(entry.obj.latencyMs).toBeGreaterThanOrEqual(0)
    })

    it('truncates large body when skipTruncate is false (default)', async () => {
      const { logger, logs } = makeLogger({ maxBodyLength: 50 })
      const big = 'x'.repeat(500)
      await runInRequest((req) => {
        logger.logApiRequestResponse(req, '0000', 200, { big })
      })
      expect(logs[0].obj.response).toContain('[TRUNCATED]')
    })

    it('does NOT truncate when skipTruncate option is true', async () => {
      const { logger, logs } = makeLogger({ maxBodyLength: 50 })
      const big = 'x'.repeat(500)
      await runInRequest((req) => {
        logger.logApiRequestResponse(req, '0000', 200, { big }, { skipTruncate: true })
      })
      expect(logs[0].obj.response).not.toContain('[TRUNCATED]')
      expect(logs[0].obj.response).toContain(big)
    })

    it('handles undefined response data (e.g. ExcludeResponseLogger)', async () => {
      const { logger, logs } = makeLogger()
      await runInRequest((req) => {
        logger.logApiRequestResponse(req, '0000', 200, undefined)
      })
      expect(logs[0].obj.response).toBe('')
    })
  })

  describe('logAxiosHttpResponse', () => {
    it('logs axios response with sanitized fields', () => {
      const { logger, logs } = makeLogger()
      const res = {
        status: 200,
        data: { token: 'abc', name: 'foo' },
        config: {
          url: 'https://example.com',
          method: 'post',
          data: { password: 'p1' },
          params: { q: '1' },
          headers: { [CORRELATION_ID_HEADER]: 'header-corr', authorization: 'Bearer x' },
        },
      } as unknown as AxiosResponse

      logger.logAxiosHttpResponse(res)

      expect(logs).toHaveLength(1)
      const entry = logs[0]
      expect(entry.msg).toBe('axios-http')
      expect(entry.obj.method).toBe('POST')
      expect(entry.obj.endpoint).toBe('https://example.com')
      expect(entry.obj.body).toContain('[REDACTED]')
      expect(entry.obj.response).toContain('[REDACTED]')
      expect(entry.obj.header).toContain('[REDACTED]')
      expect(entry.obj.correlationId).toBe('header-corr')
      expect(entry.obj.httpStatusCode).toBe(200)
    })

    it('handles undefined response gracefully', () => {
      const { logger, logs } = makeLogger()
      logger.logAxiosHttpResponse(undefined)
      expect(logs).toHaveLength(1)
      expect(logs[0].obj.httpStatusCode).toBeUndefined()
    })
  })

  describe('error / fatal', () => {
    it('extracts message and stack from Error', () => {
      const { logger, logs } = makeLogger()
      const err = new Error('boom')
      const result = logger.error(err)
      expect(result.message).toBe('boom')
      expect(result.errorStack).toBeDefined()
      expect(logs[0].level).toBe('error')
      expect(logs[0].msg).toBe('error')
    })

    it('treats string message as the log message', () => {
      const { logger, logs } = makeLogger()
      logger.error('something went wrong')
      expect(logs[0].msg).toBe('something went wrong')
      expect(logs[0].obj.errorStack).toBeUndefined()
    })

    it('fatal logs at fatal level', () => {
      const { logger, logs } = makeLogger()
      logger.fatal(new Error('die'))
      expect(logs[0].level).toBe('fatal')
    })
  })

  describe('info / debug / warn / verbose', () => {
    it('emits at the right level with merged metadata', () => {
      const { logger, logs } = makeLogger()
      logger.info('hi', { extra: 1 })
      logger.debug('d', { extra: 2 })
      logger.warn('w')
      logger.verbose('v')

      expect(logs.map((l) => l.level)).toEqual(['info', 'debug', 'warn', 'trace'])
      expect(logs[0].obj.extra).toBe(1)
      expect(logs[1].obj.extra).toBe(2)
    })

    it('log() forwards to info()', () => {
      const { logger, logs } = makeLogger()
      logger.log('hello')
      expect(logs[0].level).toBe('info')
      expect(logs[0].msg).toBe('hello')
    })
  })

  describe('child', () => {
    it('creates a child logger with scope binding', () => {
      const { logger, logs } = makeLogger()
      const child = logger.child('module-a')
      child.info('x')
      expect(logs[0].obj.scope).toBe('module-a')
    })
  })
})
