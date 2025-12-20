import { HttpException } from '@nestjs/common';
export declare class BussinessException extends HttpException {
    constructor(message?: string, code?: number);
}
export declare class ResponseStatusCode {
    static success: string;
    static bussinessException: string;
    static unknownException: string;
}
export declare class CustomResponse<T> {
    status: string;
    message?: string;
    data?: T;
    static success<T>(data: T): CustomResponse<T>;
}
//# sourceMappingURL=custom-response.model.d.ts.map