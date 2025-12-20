import { FastifyInstance } from 'fastify';
export interface RequestContext {
    correlationId: string;
    userId?: string;
}
export declare function getCorrelationId(): string | undefined;
export declare function getUserId(): string | undefined;
export declare function setUserId(userId: string): void;
export declare function getRequestContext(): RequestContext | undefined;
export declare const CORRELATION_ID_HEADER = "x-correlation-id";
export declare const correlationMiddleware: (fastify: FastifyInstance) => void;
export declare function _getLoggerContext(): {
    correlationId?: string;
    userId?: string;
};
//# sourceMappingURL=correlation.middleware.d.ts.map