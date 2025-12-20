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
exports.HttpModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const custom_logger_1 = require("./custom-logger");
const correlation_middleware_1 = require("./middleware/correlation.middleware");
let HttpModule = class HttpModule extends axios_1.HttpModule {
    constructor(httpService, customLogger) {
        super();
        this.httpService = httpService;
        this.customLogger = customLogger;
    }
    onModuleInit() {
        const { axiosRef: axios } = this.httpService;
        axios.interceptors.request.use((config) => {
            return this.onRequest(config);
        }, (err) => {
            throw err;
        });
        axios.interceptors.response.use((res) => {
            return this.onResponse(res);
        }, (err) => {
            this.onResponse(err.response);
            throw err;
        });
    }
    onRequest(config) {
        config.headers['correlationId'] = (0, correlation_middleware_1.getCorrelationId)();
        return config;
    }
    onResponse(res) {
        this.customLogger.logAxiosHttpResponse(res);
        return res;
    }
};
exports.HttpModule = HttpModule;
exports.HttpModule = HttpModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [axios_1.HttpModule],
        providers: [custom_logger_1.CustomLogger],
        exports: [axios_1.HttpModule],
    }),
    __metadata("design:paramtypes", [axios_1.HttpService, custom_logger_1.CustomLogger])
], HttpModule);
//# sourceMappingURL=custom-http.module.js.map