import { Inject, Injectable, LoggerService, Optional } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { plainToInstance } from 'class-transformer'
import { LogModel } from './models/log.model'
import { AxiosResponse } from 'axios'
import pino, { Logger as PinoLogger } from 'pino'
import { LoggerModuleOptions } from './interfaces/logger-options.interface'
import { LOGGER_MODULE_OPTIONS, DEFAULT_LOG_LEVEL, DEFAULT_SERVICE_NAME, DEFAULT_ENVIRONMENT } from './constants/logger.constants'
import { sanitizePayload } from './utils/sanitizer.util'
import { _getLoggerContext, CORRELATION_ID_HEADER } from './middleware/correlation.middleware'

@Injectable()
export class CustomLogger implements LoggerService {
  public readonly logger: PinoLogger
  private readonly options: Required<Pick<LoggerModuleOptions, 'maxBodyLength' | 'sensitiveFields' | 'maskPattern'>>
  private readonly scope?: string

  constructor(
    @Optional() @Inject(LOGGER_MODULE_OPTIONS) options?: LoggerModuleOptions,
    @Optional() parentLogger?: PinoLogger,
    @Optional() scope?: string
  ) {
    const opts = options || {}
    const serviceName = opts.serviceName || DEFAULT_SERVICE_NAME
    const logLevel = opts.logLevel || DEFAULT_LOG_LEVEL
    const environment = opts.environment || DEFAULT_ENVIRONMENT
    const prettyPrint = opts.prettyPrint ?? environment === 'local'

    this.options = {
      maxBodyLength: opts.maxBodyLength ?? 2048,
      sensitiveFields: opts.sensitiveFields ?? [
        'password', 'token', 'secret', 'authorization', 'apiKey', 'api_key',
        'accessToken', 'access_token', 'refreshToken', 'refresh_token',
        'credential', 'credentials', 'private_key', 'privateKey',
      ],
      maskPattern: opts.maskPattern ?? '[REDACTED]',
    }

    this.scope = scope

    if (parentLogger) {
      this.logger = parentLogger.child({ scope })
    } else {
      this.logger = pino({
        level: logLevel,
        timestamp: pino.stdTimeFunctions.isoTime,
        base: {
          service: serviceName,
          environment,
          ...opts.baseMetadata,
        },
        redact: opts.redactPaths,
        transport: prettyPrint
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      })
    }
  }

  /**
   * Create a child logger with a specific scope
   */
  child(scope: string, extraMeta?: Record<string, unknown>): CustomLogger {
    const childPino = this.logger.child({ scope, ...extraMeta })
    const childLogger = Object.create(CustomLogger.prototype) as CustomLogger
    Object.assign(childLogger, {
      logger: childPino,
      options: this.options,
      scope,
    })
    return childLogger
  }

  /**
   * Get context from the built-in correlation middleware
   * This is enforced by the module - no custom provider allowed
   */
  private getContext(): { correlationId?: string; userId?: string } {
    return _getLoggerContext()
  }

  private sanitize(payload: unknown): string {
    return sanitizePayload(payload, {
      maxLength: this.options.maxBodyLength,
      sensitiveFields: this.options.sensitiveFields,
      maskPattern: this.options.maskPattern,
    })
  }

  /**
   * Log API request/response with automatic sanitization
   */
  logApiRequestResponse(request: FastifyRequest, statusCode: string, httpStatusCode: number, data?: unknown): LogModel {
    if (request.url.includes('health-check')) return new LogModel()

    const ctx = this.getContext()
    const logInfo = plainToInstance(LogModel, {
      correlationId: ctx.correlationId,
      endpoint: request.url,
      method: request.method,
      body: this.sanitize(request.body),
      param: this.sanitize(request.query),
      response: this.sanitize(data),
      userId: ctx.userId,
      statusCode,
      httpStatusCode,
      header: this.sanitize(request.headers),
    })
    this.logger.info(logInfo, 'api-log')
    return logInfo
  }

  /**
   * Log Axios HTTP response with automatic sanitization
   */
  logAxiosHttpResponse(res?: AxiosResponse): LogModel {
    const ctx = this.getContext()
    const logInfo = plainToInstance(LogModel, {
      correlationId: (res?.config?.headers?.[CORRELATION_ID_HEADER] as string) ?? ctx.correlationId,
      endpoint: res?.config?.url,
      method: res?.config?.method?.toUpperCase(),
      body: this.sanitize(res?.config?.data),
      param: this.sanitize(res?.config?.params),
      userId: ctx.userId,
      response: this.sanitize(res?.data),
      httpStatusCode: res?.status,
      header: this.sanitize(res?.config?.headers),
    })
    this.logger.info(logInfo, 'axios-http')
    return logInfo
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LoggerService interface implementation (for NestJS integration)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Log at info level
   */
  log(message: string, meta?: Record<string, unknown>): void {
    this.info(message, meta)
  }

  /**
   * Log at info level with optional metadata
   */
  info(message: string, meta?: Record<string, unknown>): void {
    const ctx = this.getContext()
    const logInfo = {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      scope: this.scope,
      ...meta,
    }
    this.logger.info(logInfo, message)
  }

  /**
   * Log at debug level with optional metadata
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    const ctx = this.getContext()
    const logInfo = {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      scope: this.scope,
      ...meta,
    }
    this.logger.debug(logInfo, message)
  }

  /**
   * Log at warn level with optional metadata
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    const ctx = this.getContext()
    const logInfo = {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      scope: this.scope,
      ...meta,
    }
    this.logger.warn(logInfo, message)
  }

  /**
   * Log an error with optional metadata
   */
  error(messageOrError: string | Error, meta?: Record<string, unknown>): LogModel {
    const ctx = this.getContext()
    const isError = messageOrError instanceof Error

    const logInfo = plainToInstance(LogModel, {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      scope: this.scope,
      message: isError ? messageOrError.message : messageOrError,
      errorStack: isError ? messageOrError.stack : undefined,
      ...meta,
    })

    this.logger.error(logInfo, isError ? 'error' : messageOrError)
    return logInfo
  }

  /**
   * Log at fatal level (critical errors)
   */
  fatal(messageOrError: string | Error, meta?: Record<string, unknown>): LogModel {
    const ctx = this.getContext()
    const isError = messageOrError instanceof Error

    const logInfo = plainToInstance(LogModel, {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      scope: this.scope,
      message: isError ? messageOrError.message : messageOrError,
      errorStack: isError ? messageOrError.stack : undefined,
      ...meta,
    })

    this.logger.fatal(logInfo, isError ? 'fatal' : messageOrError)
    return logInfo
  }

  /**
   * Log at verbose level (alias for trace)
   */
  verbose(message: string, meta?: Record<string, unknown>): void {
    const ctx = this.getContext()
    const logInfo = {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      scope: this.scope,
      ...meta,
    }
    this.logger.trace(logInfo, message)
  }
}
