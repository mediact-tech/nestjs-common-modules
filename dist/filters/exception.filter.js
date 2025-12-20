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
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const custom_logger_1 = require("../custom-logger");
const custom_response_model_1 = require("../interceptors/models/custom-response.model");
const class_validator_1 = require("class-validator");
let AllExceptionsFilter = class AllExceptionsFilter {
    constructor(httpAdapterHost, customLogger, notifyService) {
        this.httpAdapterHost = httpAdapterHost;
        this.customLogger = customLogger;
        this.notifyService = notifyService;
    }
    catch(exception, host) {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const responseBody = new custom_response_model_1.CustomResponse();
        responseBody.message = exception?.message;
        responseBody.status = custom_response_model_1.ResponseStatusCode.unknownException;
        let httpStatus = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        if (exception instanceof custom_response_model_1.BussinessException) {
            httpStatus = common_1.HttpStatus.UNPROCESSABLE_ENTITY;
            responseBody.status = exception.getStatus()?.toString() ?? custom_response_model_1.ResponseStatusCode.bussinessException;
        }
        else if (exception instanceof common_1.HttpException) {
            httpStatus = exception.getStatus();
        }
        if (exception instanceof common_1.BadRequestException) {
            exception.message = exception.getResponse()['message'];
            responseBody.message =
                (0, class_validator_1.isArray)(exception?.message) && exception?.message.length > 0
                    ? exception?.message[0]
                    : exception?.message;
        }
        const log = this.customLogger.logApiRequestResponse(request, responseBody.status, httpStatus, responseBody);
        const errLog = this.customLogger.error(exception);
        if (log && errLog && errLog.message)
            log.message = errLog.message;
        if (log && this.notifyService) {
            this.notifyService.sendNotiIgnoreError(log.toReadAbleFormat());
        }
        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [core_1.HttpAdapterHost,
        custom_logger_1.CustomLogger, Object])
], AllExceptionsFilter);
//# sourceMappingURL=exception.filter.js.map