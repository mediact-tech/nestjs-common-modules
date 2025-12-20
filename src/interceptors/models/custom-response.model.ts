import { HttpException } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class BussinessException extends HttpException {
  constructor(message?: string, code?: number) {
    super(message, code)
  }
}

export class ResponseStatusCode {
  static success = '0000'
  static bussinessException = '8999'
  static unknownException = '9999'
}

export class CustomResponse<T> {
  @ApiProperty() status: string
  @ApiProperty() message?: string
  @ApiProperty() data?: T

  static success<T>(data: T): CustomResponse<T> {
    const customResponse = new CustomResponse<T>()
    customResponse.status = ResponseStatusCode.success
    customResponse.message = 'Success'
    customResponse.data = data
    return customResponse
  }
}
