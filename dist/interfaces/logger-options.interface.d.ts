import { Level } from 'pino';
export interface LoggerModuleOptions {
    serviceName?: string;
    logLevel?: Level;
    environment?: string;
    prettyPrint?: boolean;
    maxBodyLength?: number;
    sensitiveFields?: string[];
    maskPattern?: string;
    baseMetadata?: Record<string, unknown>;
    redactPaths?: string[];
}
export interface LoggerModuleAsyncOptions {
    useFactory: (...args: any[]) => Promise<LoggerModuleOptions> | LoggerModuleOptions;
    inject?: any[];
}
//# sourceMappingURL=logger-options.interface.d.ts.map