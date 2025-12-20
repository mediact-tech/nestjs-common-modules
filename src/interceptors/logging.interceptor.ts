import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { CustomLogger } from '../custom-logger'
import { CustomResponse } from './models/custom-response.model'
import { FastifyRequest, FastifyReply } from 'fastify'
import { EXCLUDE_RESPONSE_LOGGER_KEY } from '../decorators/exclude-response-logger.decorator'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private customLogger: CustomLogger,
    private reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const excludeResponseLogger = this.reflector.getAllAndOverride<boolean>(
      EXCLUDE_RESPONSE_LOGGER_KEY,
      [context.getHandler(), context.getClass()]
    )

    const http = context.switchToHttp()
    const request = http.getRequest<FastifyRequest>()
    const response = http.getResponse<FastifyReply>()

    return next
      .handle()
      .pipe(
        tap((data: CustomResponse<any>) =>
          this.customLogger.logApiRequestResponse(
            request,
            data.status,
            response.statusCode,
            excludeResponseLogger ? undefined : data
          )
        )
      )
  }
}
