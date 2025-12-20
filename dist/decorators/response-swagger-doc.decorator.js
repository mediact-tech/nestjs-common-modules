"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwaggerApiResponse = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const custom_response_model_1 = require("../interceptors/models/custom-response.model");
const SwaggerApiResponse = (model, type = 'object') => {
    const properties = { data: {} };
    if (model && type === 'array') {
        properties.data = {
            type: 'array',
            items: {
                $ref: (0, swagger_1.getSchemaPath)(model),
            },
        };
    }
    if (model && type === 'object') {
        properties.data = {
            $ref: (0, swagger_1.getSchemaPath)(model),
        };
    }
    return (0, common_1.applyDecorators)(model ? (0, swagger_1.ApiExtraModels)(custom_response_model_1.CustomResponse, model) : (0, swagger_1.ApiExtraModels)(custom_response_model_1.CustomResponse), (0, swagger_1.ApiResponse)({
        status: 200,
        schema: {
            allOf: [
                {
                    $ref: (0, swagger_1.getSchemaPath)(custom_response_model_1.CustomResponse),
                },
                {
                    properties,
                },
            ],
        },
    }));
};
exports.SwaggerApiResponse = SwaggerApiResponse;
//# sourceMappingURL=response-swagger-doc.decorator.js.map