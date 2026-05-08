import { HttpService } from '@nestjs/axios'
import { AxiosError, AxiosResponse, AxiosHeaders, InternalAxiosRequestConfig } from 'axios'
import { HttpModule } from './custom-http.module'
import { CustomLogger } from './custom-logger'
import {
  CORRELATION_ID_HEADER,
  correlationMiddleware,
} from './middleware/correlation.middleware'
import Fastify, { FastifyInstance } from 'fastify'

type Interceptor<T> = { use: jest.Mock<number, [(arg: T) => T, (err: any) => any]> }

function makeHttpService(): {
  service: HttpService
  reqInterceptor: Interceptor<InternalAxiosRequestConfig>
  resInterceptor: Interceptor<AxiosResponse>
} {
  const reqInterceptor: Interceptor<InternalAxiosRequestConfig> = { use: jest.fn() }
  const resInterceptor: Interceptor<AxiosResponse> = { use: jest.fn() }
  const service = {
    axiosRef: {
      interceptors: { request: reqInterceptor, response: resInterceptor },
    },
  } as unknown as HttpService
  return { service, reqInterceptor, resInterceptor }
}

function makeLogger() {
  return {
    logAxiosHttpResponse: jest.fn(),
  } as unknown as CustomLogger
}

describe('HttpModule (axios interceptors)', () => {
  it('attaches request and response interceptors on init', () => {
    const { service, reqInterceptor, resInterceptor } = makeHttpService()
    const mod = new HttpModule(service, makeLogger())

    mod.onModuleInit()

    expect(reqInterceptor.use).toHaveBeenCalledTimes(1)
    expect(resInterceptor.use).toHaveBeenCalledTimes(1)
  })

  describe('request interceptor', () => {
    it('sets x-correlation-id header from active context', async () => {
      const { service, reqInterceptor } = makeHttpService()
      const mod = new HttpModule(service, makeLogger())
      mod.onModuleInit()

      const onFulfilled = reqInterceptor.use.mock.calls[0][0]

      const app: FastifyInstance = Fastify()
      await app.register(correlationMiddleware)
      let result: InternalAxiosRequestConfig | undefined
      app.get('/t', async (req, reply) => {
        const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
        result = onFulfilled(config)
        reply.send({})
      })
      await app.inject({
        method: 'GET',
        url: '/t',
        headers: { [CORRELATION_ID_HEADER]: 'corr-xyz' },
      })
      await app.close()

      expect(result!.headers[CORRELATION_ID_HEADER]).toBe('corr-xyz')
    })

    it('does NOT set header when correlationId is unavailable (outside ALS)', () => {
      const { service, reqInterceptor } = makeHttpService()
      const mod = new HttpModule(service, makeLogger())
      mod.onModuleInit()

      const onFulfilled = reqInterceptor.use.mock.calls[0][0]
      const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
      const out = onFulfilled(config)

      expect(out.headers[CORRELATION_ID_HEADER]).toBeUndefined()
    })

    it('rejects with original error in request error handler', () => {
      const { service, reqInterceptor } = makeHttpService()
      new HttpModule(service, makeLogger()).onModuleInit()
      const onError = reqInterceptor.use.mock.calls[0][1]
      expect(() => onError(new Error('req-fail'))).toThrow('req-fail')
    })
  })

  describe('response interceptor', () => {
    it('logs axios response on success and returns it', () => {
      const { service, resInterceptor } = makeHttpService()
      const logger = makeLogger()
      new HttpModule(service, logger).onModuleInit()

      const onFulfilled = resInterceptor.use.mock.calls[0][0]
      const res = { status: 200, data: { ok: true } } as AxiosResponse
      const result = onFulfilled(res)

      expect(logger.logAxiosHttpResponse).toHaveBeenCalledWith(res)
      expect(result).toBe(res)
    })

    it('logs axios error response and rethrows the original error', () => {
      const { service, resInterceptor } = makeHttpService()
      const logger = makeLogger()
      new HttpModule(service, logger).onModuleInit()

      const onError = resInterceptor.use.mock.calls[0][1]
      const errorResponse = { status: 500, data: { error: 'boom' } } as AxiosResponse
      const err = { response: errorResponse, message: 'fail' } as AxiosError

      expect(() => onError(err)).toThrow()
      expect(logger.logAxiosHttpResponse).toHaveBeenCalledWith(errorResponse)
    })
  })
})
