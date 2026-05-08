import { CallHandler, ExecutionContext, StreamableFile } from '@nestjs/common'
import { lastValueFrom, of } from 'rxjs'
import { CustomResponseInterceptor } from './response.interceptor'
import { CustomResponse, ResponseStatusCode } from './models/custom-response.model'

function run<T>(data: unknown) {
  const interceptor = new CustomResponseInterceptor<T>()
  const ctx = {} as ExecutionContext
  const next: CallHandler = { handle: () => of(data) } as any
  return lastValueFrom(interceptor.intercept(ctx, next))
}

describe('CustomResponseInterceptor', () => {
  it('wraps plain data in CustomResponse.success', async () => {
    const result = await run({ id: 1 })
    expect(result).toBeInstanceOf(CustomResponse)
    expect((result as CustomResponse<any>).status).toBe(ResponseStatusCode.success)
    expect((result as CustomResponse<any>).data).toEqual({ id: 1 })
  })

  it('passes StreamableFile through untouched', async () => {
    const file = new StreamableFile(Buffer.from('hello'))
    const result = await run(file)
    expect(result).toBe(file)
  })

  it('wraps null data', async () => {
    const result = await run(null)
    expect(result).toBeInstanceOf(CustomResponse)
    expect((result as CustomResponse<any>).data).toBeNull()
  })
})
