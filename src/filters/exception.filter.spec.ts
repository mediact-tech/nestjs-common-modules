import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { AllExceptionsFilter, ExceptionNotifyService } from './exception.filter'
import { CustomLogger } from '../custom-logger'
import { BussinessException, ResponseStatusCode } from '../interceptors/models/custom-response.model'
import { LogModel } from '../models/log.model'

function makeHost(): { host: ArgumentsHost; reply: jest.Mock } {
  const reply = jest.fn()
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/x', method: 'GET', body: {}, query: {}, headers: {} }),
      getResponse: () => ({}),
    }),
  } as unknown as ArgumentsHost
  ;(host as any)._reply = reply
  return { host, reply }
}

function makeFilter(notify?: ExceptionNotifyService) {
  const reply = jest.fn()
  const adapterHost = { httpAdapter: { reply } } as unknown as HttpAdapterHost

  const apiLog = new LogModel()
  apiLog.message = ''
  const errLog = new LogModel()
  errLog.message = 'err-msg'

  const logger = {
    logApiRequestResponse: jest.fn().mockReturnValue(apiLog),
    error: jest.fn().mockReturnValue(errLog),
  } as unknown as CustomLogger

  const filter = new AllExceptionsFilter(adapterHost, logger, notify)
  return { filter, logger, reply, apiLog, errLog }
}

describe('AllExceptionsFilter', () => {
  it('maps BussinessException to 422 with status code from exception', () => {
    const { filter, reply } = makeFilter()
    const { host } = makeHost()
    const ex = new BussinessException('biz error', 4001)

    filter.catch(ex, host)

    const [, body, status] = reply.mock.calls[0]
    expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
    expect(body.status).toBe('4001')
    expect(body.message).toBe('biz error')
  })

  it('maps generic HttpException to its own status', () => {
    const { filter, reply } = makeFilter()
    const { host } = makeHost()
    filter.catch(new HttpException('forbidden', HttpStatus.FORBIDDEN), host)

    const [, body, status] = reply.mock.calls[0]
    expect(status).toBe(HttpStatus.FORBIDDEN)
    expect(body.status).toBe(ResponseStatusCode.unknownException)
  })

  it('maps unknown error to 500', () => {
    const { filter, reply } = makeFilter()
    const { host } = makeHost()
    filter.catch(new Error('boom'), host)

    const [, body, status] = reply.mock.calls[0]
    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(body.status).toBe(ResponseStatusCode.unknownException)
    expect(body.message).toBe('boom')
  })

  it('flattens BadRequestException array message to first item', () => {
    const { filter, reply } = makeFilter()
    const { host } = makeHost()
    const ex = new BadRequestException({
      message: ['field is required', 'must be a string'],
      error: 'Bad Request',
    })

    filter.catch(ex, host)

    const [, body] = reply.mock.calls[0]
    expect(body.message).toBe('field is required')
  })

  it('calls notifyService when provided', () => {
    const notify: ExceptionNotifyService = { sendNotiIgnoreError: jest.fn() }
    const { filter } = makeFilter(notify)
    const { host } = makeHost()

    filter.catch(new Error('x'), host)

    expect(notify.sendNotiIgnoreError).toHaveBeenCalledTimes(1)
  })

  it('skips notify when not provided', () => {
    const { filter } = makeFilter()
    const { host } = makeHost()
    expect(() => filter.catch(new Error('x'), host)).not.toThrow()
  })
})
