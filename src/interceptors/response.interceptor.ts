import { Injectable, NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { CustomResponse } from './models/custom-response.model'

@Injectable()
export class CustomResponseInterceptor<T>
  implements NestInterceptor<T, CustomResponse<T> | StreamableFile | Observable<any>>
{
  intercept(_: ExecutionContext, next: CallHandler): Observable<CustomResponse<T> | StreamableFile | Observable<any>> {
    return next.handle().pipe(
      map((data): CustomResponse<T> | StreamableFile => {
        if (data instanceof StreamableFile) return data
        return CustomResponse.success<T>(data)
      })
    )
  }
}
