import { DynamicModule } from '@nestjs/common';
import { LoggerModuleOptions, LoggerModuleAsyncOptions } from './interfaces/logger-options.interface';
export declare class CustomLoggerModule {
    static forRoot(options?: LoggerModuleOptions): DynamicModule;
    static forRootAsync(asyncOptions: LoggerModuleAsyncOptions): DynamicModule;
}
//# sourceMappingURL=custom-logger.module.d.ts.map