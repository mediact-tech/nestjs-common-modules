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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const operators_1 = require("rxjs/operators");
const custom_logger_1 = require("../custom-logger");
const exclude_response_logger_decorator_1 = require("../decorators/exclude-response-logger.decorator");
let LoggingInterceptor = class LoggingInterceptor {
    constructor(customLogger, reflector) {
        this.customLogger = customLogger;
        this.reflector = reflector;
    }
    intercept(context, next) {
        const excludeResponseLogger = this.reflector.getAllAndOverride(exclude_response_logger_decorator_1.EXCLUDE_RESPONSE_LOGGER_KEY, [context.getHandler(), context.getClass()]);
        const http = context.switchToHttp();
        const request = http.getRequest();
        const response = http.getResponse();
        return next
            .handle()
            .pipe((0, operators_1.tap)((data) => this.customLogger.logApiRequestResponse(request, data.status, response.statusCode, excludeResponseLogger ? undefined : data)));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [custom_logger_1.CustomLogger,
        core_1.Reflector])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map