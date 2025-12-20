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
exports.CustomResponse = exports.ResponseStatusCode = exports.BussinessException = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
class BussinessException extends common_1.HttpException {
    constructor(message, code) {
        super(message, code);
    }
}
exports.BussinessException = BussinessException;
class ResponseStatusCode {
}
exports.ResponseStatusCode = ResponseStatusCode;
ResponseStatusCode.success = '0000';
ResponseStatusCode.bussinessException = '8999';
ResponseStatusCode.unknownException = '9999';
class CustomResponse {
    static success(data) {
        const customResponse = new CustomResponse();
        customResponse.status = ResponseStatusCode.success;
        customResponse.message = 'Success';
        customResponse.data = data;
        return customResponse;
    }
}
exports.CustomResponse = CustomResponse;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomResponse.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], CustomResponse.prototype, "data", void 0);
//# sourceMappingURL=custom-response.model.js.map