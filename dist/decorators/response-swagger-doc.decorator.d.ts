import { Type } from '@nestjs/common';
type SwaggerApiResponseType = 'array' | 'object';
export declare const SwaggerApiResponse: <TModel extends Type<unknown>>(model?: TModel, type?: SwaggerApiResponseType) => <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export {};
//# sourceMappingURL=response-swagger-doc.decorator.d.ts.map