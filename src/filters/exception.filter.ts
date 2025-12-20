import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, BadRequestException } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { CustomLogger } from '../custom-logger'
import { BussinessException, CustomResponse, ResponseStatusCode } from '../interceptors/models/custom-response.model'
import { isArray } from 'class-validator'

/**
 * Notification service interface for exception alerts
 * Implement this interface to receive exception notifications
 */
export interface ExceptionNotifyService {
  sendNotiIgnoreError(message: string): void | Promise<void>
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private customLogger: CustomLogger,
    private notifyService?: ExceptionNotifyService
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost

    const ctx = host.switchToHttp()
    const request = ctx.getRequest<FastifyRequest>()

    const responseBody = new CustomResponse()
    responseBody.message = (exception as any)?.message
    responseBody.status = ResponseStatusCode.unknownException

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR
    if (exception instanceof BussinessException) {
      httpStatus = HttpStatus.UNPROCESSABLE_ENTITY
      responseBody.status = exception.getStatus()?.toString() ?? ResponseStatusCode.bussinessException
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus()
    }

    if (exception instanceof BadRequestException) {
      exception.message = (exception.getResponse() as object)['message']
      responseBody.message =
        isArray(exception?.message) && (exception as any)?.message.length > 0
          ? (exception as any)?.message[0]
          : (exception as any)?.message
    }
    
    const log = this.customLogger.logApiRequestResponse(request, responseBody.status, httpStatus, responseBody)
    const errLog = this.customLogger.error(exception as Error)
    if (log && errLog && errLog.message) log.message = errLog.message

    if (log && this.notifyService) {
      this.notifyService.sendNotiIgnoreError(log.toReadAbleFormat())
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)
  }
}
