import 'reflect-metadata'
import { DECORATORS } from '@nestjs/swagger/dist/constants'
import { SwaggerApiResponse } from './response-swagger-doc.decorator'

class UserDto {
  id: string
}

function applyTo(decorator: MethodDecorator) {
  class Ctrl {
    handler() {}
  }
  decorator(Ctrl.prototype, 'handler', Object.getOwnPropertyDescriptor(Ctrl.prototype, 'handler')!)
  return Ctrl
}

describe('SwaggerApiResponse', () => {
  it('registers ApiResponse metadata wrapping data with $ref to model (default object)', () => {
    const Ctrl = applyTo(SwaggerApiResponse(UserDto))
    const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, Ctrl.prototype.handler)

    expect(responses).toBeDefined()
    const r200 = responses[200]
    expect(r200.schema.allOf).toHaveLength(2)
    expect(r200.schema.allOf[1].properties.data.$ref).toContain('UserDto')
  })

  it('renders array schema when type=array', () => {
    const Ctrl = applyTo(SwaggerApiResponse(UserDto, 'array'))
    const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, Ctrl.prototype.handler)

    const dataSchema = responses[200].schema.allOf[1].properties.data
    expect(dataSchema.type).toBe('array')
    expect(dataSchema.items.$ref).toContain('UserDto')
  })

  it('omits model ref when no model is provided', () => {
    const Ctrl = applyTo(SwaggerApiResponse())
    const responses = Reflect.getMetadata(DECORATORS.API_RESPONSE, Ctrl.prototype.handler)

    expect(responses[200].schema.allOf[1].properties.data).toEqual({})
    expect(responses[200].schema.allOf[0].$ref).toContain('CustomResponse')
  })

})
