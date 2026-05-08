import { LoggerService } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { LogModel } from './models/log.model';
import { AxiosResponse } from 'axios';
import { Logger as PinoLogger } from 'pino';
import { LoggerModuleOptions } from './interfaces/logger-options.interface';
export declare class CustomLogger implements LoggerService {
    readonly logger: PinoLogger;
    private readonly options;
    private readonly scope?;
    constructor(options?: LoggerModuleOptions);
    child(scope: string, extraMeta?: Record<string, unknown>): CustomLogger;
    private getContext;
    private sanitize;
    logApiRequestResponse(request: FastifyRequest, statusCode: string, httpStatusCode: number, data?: unknown, options?: {
        skipTruncate?: boolean;
    }): LogModel;
    logAxiosHttpResponse(res?: AxiosResponse): LogModel;
    log(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(messageOrError: string | Error, meta?: Record<string, unknown>): LogModel;
    fatal(messageOrError: string | Error, meta?: Record<string, unknown>): LogModel;
    verbose(message: string, meta?: Record<string, unknown>): void;
}
//# sourceMappingURL=custom-logger.d.ts.map