"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CustomLoggerModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLoggerModule = void 0;
const common_1 = require("@nestjs/common");
const custom_logger_1 = require("./custom-logger");
const logger_constants_1 = require("./constants/logger.constants");
let CustomLoggerModule = CustomLoggerModule_1 = class CustomLoggerModule {
    static forRoot(options = {}) {
        const optionsProvider = {
            provide: logger_constants_1.LOGGER_MODULE_OPTIONS,
            useValue: options,
        };
        return {
            module: CustomLoggerModule_1,
            providers: [optionsProvider, custom_logger_1.CustomLogger],
            exports: [custom_logger_1.CustomLogger, logger_constants_1.LOGGER_MODULE_OPTIONS],
            global: true,
        };
    }
    static forRootAsync(asyncOptions) {
        const optionsProvider = {
            provide: logger_constants_1.LOGGER_MODULE_OPTIONS,
            useFactory: asyncOptions.useFactory,
            inject: asyncOptions.inject || [],
        };
        return {
            module: CustomLoggerModule_1,
            providers: [optionsProvider, custom_logger_1.CustomLogger],
            exports: [custom_logger_1.CustomLogger, logger_constants_1.LOGGER_MODULE_OPTIONS],
            global: true,
        };
    }
};
exports.CustomLoggerModule = CustomLoggerModule;
exports.CustomLoggerModule = CustomLoggerModule = CustomLoggerModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], CustomLoggerModule);
//# sourceMappingURL=custom-logger.module.js.map