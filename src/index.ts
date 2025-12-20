// Main exports
export { CustomLoggerModule } from "./custom-logger.module";
export { HttpModule } from "./custom-http.module";
export { CustomLogger } from "./custom-logger";

// Models
export { LogModel } from "./models/log.model";

// Interfaces
export {
  LoggerModuleOptions,
  LoggerModuleAsyncOptions,
} from "./interfaces/logger-options.interface";

// Constants
export {
  LOGGER_MODULE_OPTIONS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_SERVICE_NAME,
  DEFAULT_ENVIRONMENT,
} from "./constants/logger.constants";

// Middleware - correlation tracking (required for logger to work)
export {
  correlationMiddleware,
  getCorrelationId,
  getUserId,
  setUserId,
  getRequestContext,
  CORRELATION_ID_HEADER,
  RequestContext,
} from "./middleware/correlation.middleware";

// Filters
export {
  AllExceptionsFilter,
  ExceptionNotifyService,
} from "./filters/exception.filter";

// Interceptors
export { LoggingInterceptor } from "./interceptors/logging.interceptor";
export { CustomResponseInterceptor } from "./interceptors/response.interceptor";
export {
  CustomResponse,
  BussinessException,
  ResponseStatusCode,
} from "./interceptors/models/custom-response.model";

// Decorators
export { SwaggerApiResponse } from "./decorators/response-swagger-doc.decorator";
export { ExcludeResponseLogger, EXCLUDE_RESPONSE_LOGGER_KEY } from "./decorators/exclude-response-logger.decorator";

// Utilities
export {
  sanitizePayload,
  safeStringify,
  maskSensitiveData,
  DEFAULT_SENSITIVE_FIELDS,
  DEFAULT_MASK_PATTERN,
  DEFAULT_MAX_BODY_LENGTH,
} from "./utils/sanitizer.util";
