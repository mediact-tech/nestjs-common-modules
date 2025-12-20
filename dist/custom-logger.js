"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CustomLogger_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLogger = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const log_model_1 = require("./models/log.model");
const pino_1 = __importDefault(require("pino"));
const logger_constants_1 = require("./constants/logger.constants");
const sanitizer_util_1 = require("./utils/sanitizer.util");
const correlation_middleware_1 = require("./middleware/correlation.middleware");
let CustomLogger = CustomLogger_1 = class CustomLogger {
    constructor(options, parentLogger, scope) {
        const opts = options || {};
        const serviceName = opts.serviceName || logger_constants_1.DEFAULT_SERVICE_NAME;
        const logLevel = opts.logLevel || logger_constants_1.DEFAULT_LOG_LEVEL;
        const environment = opts.environment || logger_constants_1.DEFAULT_ENVIRONMENT;
        const prettyPrint = opts.prettyPrint ?? environment === 'local';
        this.options = {
            maxBodyLength: opts.maxBodyLength ?? 2048,
            sensitiveFields: opts.sensitiveFields ?? [
                'password', 'token', 'secret', 'authorization', 'apiKey', 'api_key',
                'accessToken', 'access_token', 'refreshToken', 'refresh_token',
                'credential', 'credentials', 'private_key', 'privateKey',
            ],
            maskPattern: opts.maskPattern ?? '[REDACTED]',
        };
        this.scope = scope;
        if (parentLogger) {
            this.logger = parentLogger.child({ scope });
        }
        else {
            this.logger = (0, pino_1.default)({
                level: logLevel,
                timestamp: pino_1.default.stdTimeFunctions.isoTime,
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
            });
        }
    }
    child(scope, extraMeta) {
        const childPino = this.logger.child({ scope, ...extraMeta });
        const childLogger = Object.create(CustomLogger_1.prototype);
        Object.assign(childLogger, {
            logger: childPino,
            options: this.options,
            scope,
        });
        return childLogger;
    }
    getContext() {
        return (0, correlation_middleware_1._getLoggerContext)();
    }
    sanitize(payload) {
        return (0, sanitizer_util_1.sanitizePayload)(payload, {
            maxLength: this.options.maxBodyLength,
            sensitiveFields: this.options.sensitiveFields,
            maskPattern: this.options.maskPattern,
        });
    }
    logApiRequestResponse(request, statusCode, httpStatusCode, data) {
        if (request.url.includes('health-check'))
            return new log_model_1.LogModel();
        const ctx = this.getContext();
        const logInfo = (0, class_transformer_1.plainToInstance)(log_model_1.LogModel, {
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
        });
        this.logger.info(logInfo, 'api-log');
        return logInfo;
    }
    logAxiosHttpResponse(res) {
        const ctx = this.getContext();
        const logInfo = (0, class_transformer_1.plainToInstance)(log_model_1.LogModel, {
            correlationId: res?.config?.headers?.[correlation_middleware_1.CORRELATION_ID_HEADER] ?? ctx.correlationId,
            endpoint: res?.config?.url,
            method: res?.config?.method?.toUpperCase(),
            body: this.sanitize(res?.config?.data),
            param: this.sanitize(res?.config?.params),
            userId: ctx.userId,
            response: this.sanitize(res?.data),
            httpStatusCode: res?.status,
            header: this.sanitize(res?.config?.headers),
        });
        this.logger.info(logInfo, 'axios-http');
        return logInfo;
    }
    log(message, meta) {
        this.info(message, meta);
    }
    info(message, meta) {
        const ctx = this.getContext();
        const logInfo = {
            correlationId: ctx.correlationId,
            userId: ctx.userId,
            scope: this.scope,
            ...meta,
        };
        this.logger.info(logInfo, message);
    }
    debug(message, meta) {
        const ctx = this.getContext();
        const logInfo = {
            correlationId: ctx.correlationId,
            userId: ctx.userId,
            scope: this.scope,
            ...meta,
        };
        this.logger.debug(logInfo, message);
    }
    warn(message, meta) {
        const ctx = this.getContext();
        const logInfo = {
            correlationId: ctx.correlationId,
            userId: ctx.userId,
            scope: this.scope,
            ...meta,
        };
        this.logger.warn(logInfo, message);
    }
    error(messageOrError, meta) {
        const ctx = this.getContext();
        const isError = messageOrError instanceof Error;
        const logInfo = (0, class_transformer_1.plainToInstance)(log_model_1.LogModel, {
            correlationId: ctx.correlationId,
            userId: ctx.userId,
            scope: this.scope,
            message: isError ? messageOrError.message : messageOrError,
            errorStack: isError ? messageOrError.stack : undefined,
            ...meta,
        });
        this.logger.error(logInfo, isError ? 'error' : messageOrError);
        return logInfo;
    }
    fatal(messageOrError, meta) {
        const ctx = this.getContext();
        const isError = messageOrError instanceof Error;
        const logInfo = (0, class_transformer_1.plainToInstance)(log_model_1.LogModel, {
            correlationId: ctx.correlationId,
            userId: ctx.userId,
            scope: this.scope,
            message: isError ? messageOrError.message : messageOrError,
            errorStack: isError ? messageOrError.stack : undefined,
            ...meta,
        });
        this.logger.fatal(logInfo, isError ? 'fatal' : messageOrError);
        return logInfo;
    }
    verbose(message, meta) {
        const ctx = this.getContext();
        const logInfo = {
            correlationId: ctx.correlationId,
            userId: ctx.userId,
            scope: this.scope,
            ...meta,
        };
        this.logger.trace(logInfo, message);
    }
};
exports.CustomLogger = CustomLogger;
exports.CustomLogger = CustomLogger = CustomLogger_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(logger_constants_1.LOGGER_MODULE_OPTIONS)),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, Object, String])
], CustomLogger);
//# sourceMappingURL=custom-logger.js.map