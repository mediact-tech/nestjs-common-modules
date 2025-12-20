import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CustomLogger } from '../custom-logger';
export declare class LoggingInterceptor implements NestInterceptor {
    private customLogger;
    private reflector;
    constructor(customLogger: CustomLogger, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
//# sourceMappingURL=logging.interceptor.d.ts.map