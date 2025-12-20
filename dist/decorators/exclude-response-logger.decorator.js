"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcludeResponseLogger = exports.EXCLUDE_RESPONSE_LOGGER_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.EXCLUDE_RESPONSE_LOGGER_KEY = 'excludeResponseLogger';
const ExcludeResponseLogger = () => (0, common_1.SetMetadata)(exports.EXCLUDE_RESPONSE_LOGGER_KEY, true);
exports.ExcludeResponseLogger = ExcludeResponseLogger;
//# sourceMappingURL=exclude-response-logger.decorator.js.map