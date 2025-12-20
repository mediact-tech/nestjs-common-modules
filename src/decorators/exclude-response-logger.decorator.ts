import { SetMetadata } from '@nestjs/common'

/**
 * Metadata key for excluding response logging
 */
export const EXCLUDE_RESPONSE_LOGGER_KEY = 'excludeResponseLogger'

/**
 * Decorator to exclude response logging for a specific route
 * 
 * @example
 * ```typescript
 * @Get('large-data')
 * @ExcludeResponseLogger()
 * getLargeData() {
 *   return { data: '...' }
 * }
 * ```
 */
export const ExcludeResponseLogger = () => SetMetadata(EXCLUDE_RESPONSE_LOGGER_KEY, true)
