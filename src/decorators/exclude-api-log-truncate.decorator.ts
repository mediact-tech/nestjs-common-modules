import { SetMetadata } from '@nestjs/common'

/**
 * Metadata key for excluding API log truncation
 */
export const EXCLUDE_API_LOG_TRUNCATE_KEY = 'excludeApiLogTruncate'

/**
 * Decorator to disable body/response truncation in API logs for a specific route
 *
 * @example
 * ```typescript
 * @Get('full-payload')
 * @ExcludeApiLogTruncate()
 * getFullPayload() {
 *   return { data: '...' }
 * }
 * ```
 */
export const ExcludeApiLogTruncate = () => SetMetadata(EXCLUDE_API_LOG_TRUNCATE_KEY, true)
