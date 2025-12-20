declare const DEFAULT_SENSITIVE_FIELDS: string[];
declare const DEFAULT_MASK_PATTERN = "[REDACTED]";
declare const DEFAULT_MAX_BODY_LENGTH = 2048;
export declare function safeStringify(obj: unknown, maxLength?: number): string;
export declare function maskSensitiveData<T>(data: T, sensitiveFields?: string[], maskPattern?: string): T;
export declare function sanitizePayload(payload: unknown, options?: {
    maxLength?: number;
    sensitiveFields?: string[];
    maskPattern?: string;
}): string;
export { DEFAULT_SENSITIVE_FIELDS, DEFAULT_MASK_PATTERN, DEFAULT_MAX_BODY_LENGTH };
//# sourceMappingURL=sanitizer.util.d.ts.map