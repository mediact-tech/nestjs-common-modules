import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { CustomLogger } from '../custom-logger';
export interface ExceptionNotifyService {
    sendNotiIgnoreError(message: string): void | Promise<void>;
}
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly httpAdapterHost;
    private customLogger;
    private notifyService?;
    constructor(httpAdapterHost: HttpAdapterHost, customLogger: CustomLogger, notifyService?: ExceptionNotifyService);
    catch(exception: unknown, host: ArgumentsHost): void;
}
//# sourceMappingURL=exception.filter.d.ts.map