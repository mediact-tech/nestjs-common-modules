import { NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CustomResponse } from './models/custom-response.model';
export declare class CustomResponseInterceptor<T> implements NestInterceptor<T, CustomResponse<T> | StreamableFile | Observable<any>> {
    intercept(_: ExecutionContext, next: CallHandler): Observable<CustomResponse<T> | StreamableFile | Observable<any>>;
}
//# sourceMappingURL=response.interceptor.d.ts.map