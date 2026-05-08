import { HttpException } from '@nestjs/common'
import { BussinessException, CustomResponse, ResponseStatusCode } from './custom-response.model'

describe('CustomResponse.success', () => {
  it('builds a success response with status 0000 and data', () => {
    const res = CustomResponse.success({ id: 1 })
    expect(res).toBeInstanceOf(CustomResponse)
    expect(res.status).toBe(ResponseStatusCode.success)
    expect(res.message).toBe('Success')
    expect(res.data).toEqual({ id: 1 })
  })

  it('preserves null/undefined data', () => {
    expect(CustomResponse.success(null).data).toBeNull()
    expect(CustomResponse.success(undefined as any).data).toBeUndefined()
  })
})

describe('BussinessException', () => {
  it('extends HttpException and carries status code', () => {
    const ex = new BussinessException('biz', 4001)
    expect(ex).toBeInstanceOf(HttpException)
    expect(ex.message).toBe('biz')
    expect(ex.getStatus()).toBe(4001)
  })
})

describe('ResponseStatusCode', () => {
  it('has documented codes', () => {
    expect(ResponseStatusCode.success).toBe('0000')
    expect(ResponseStatusCode.bussinessException).toBe('8999')
    expect(ResponseStatusCode.unknownException).toBe('9999')
  })
})
