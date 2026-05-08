import { ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { of } from 'rxjs'
import { LoggingInterceptor } from './logging.interceptor'
import { CustomLogger } from '../custom-logger'
import { EXCLUDE_RESPONSE_LOGGER_KEY } from '../decorators/exclude-response-logger.decorator'
import { EXCLUDE_API_LOG_TRUNCATE_KEY } from '../decorators/exclude-api-log-truncate.decorator'

function makeContext(): ExecutionContext {
  const req = { url: '/x', method: 'GET', body: {}, query: {}, headers: {} }
  const res = { statusCode: 201 }
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any
}

describe('LoggingInterceptor', () => {
  let logger: jest.Mocked<CustomLogger>
  let reflector: Reflector

  beforeEach(() => {
    logger = { logApiRequestResponse: jest.fn() } as any
    reflector = new Reflector()
  })

  function makeInterceptor(metadata: Record<string, boolean> = {}): LoggingInterceptor {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation(((key: string) => metadata[key]) as any)
    return new LoggingInterceptor(logger, reflector)
  }

  function runIntercept(interceptor: LoggingInterceptor, data: unknown) {
    const ctx = makeContext()
    const next: CallHandler = { handle: () => of(data) } as any
    return new Promise<void>((resolve) => {
      interceptor.intercept(ctx, next).subscribe({ complete: () => resolve() })
    })
  }

  it('passes data to logger when no decorators are present', async () => {
    const interceptor = makeInterceptor()
    const payload = { status: '0000', data: { x: 1 } }
    await runIntercept(interceptor, payload)

    expect(logger.logApiRequestResponse).toHaveBeenCalledWith(
      expect.any(Object),
      '0000',
      201,
      payload,
      { skipTruncate: undefined }
    )
  })

  it('passes undefined data when @ExcludeResponseLogger is set', async () => {
    const interceptor = makeInterceptor({ [EXCLUDE_RESPONSE_LOGGER_KEY]: true })
    await runIntercept(interceptor, { status: '0000', data: { x: 1 } })

    expect(logger.logApiRequestResponse).toHaveBeenCalledWith(
      expect.any(Object),
      '0000',
      201,
      undefined,
      { skipTruncate: undefined }
    )
  })

  it('passes skipTruncate=true when @ExcludeApiLogTruncate is set', async () => {
    const interceptor = makeInterceptor({ [EXCLUDE_API_LOG_TRUNCATE_KEY]: true })
    const payload = { status: '0000', data: { x: 1 } }
    await runIntercept(interceptor, payload)

    expect(logger.logApiRequestResponse).toHaveBeenCalledWith(
      expect.any(Object),
      '0000',
      201,
      payload,
      { skipTruncate: true }
    )
  })

  it('combines both decorators (data=undefined, skipTruncate=true)', async () => {
    const interceptor = makeInterceptor({
      [EXCLUDE_RESPONSE_LOGGER_KEY]: true,
      [EXCLUDE_API_LOG_TRUNCATE_KEY]: true,
    })
    await runIntercept(interceptor, { status: '0000', data: { x: 1 } })

    expect(logger.logApiRequestResponse).toHaveBeenCalledWith(
      expect.any(Object),
      '0000',
      201,
      undefined,
      { skipTruncate: true }
    )
  })
})
