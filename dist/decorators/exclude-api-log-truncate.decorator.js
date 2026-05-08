"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcludeApiLogTruncate = exports.EXCLUDE_API_LOG_TRUNCATE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.EXCLUDE_API_LOG_TRUNCATE_KEY = 'excludeApiLogTruncate';
const ExcludeApiLogTruncate = () => (0, common_1.SetMetadata)(exports.EXCLUDE_API_LOG_TRUNCATE_KEY, true);
exports.ExcludeApiLogTruncate = ExcludeApiLogTruncate;
//# sourceMappingURL=exclude-api-log-truncate.decorator.js.map