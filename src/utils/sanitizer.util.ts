const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'authorization',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'credential',
  'credentials',
  'private_key',
  'privateKey',
]

const DEFAULT_MASK_PATTERN = '[REDACTED]'
const DEFAULT_MAX_BODY_LENGTH = 2048

/**
 * Safely stringify an object, handling circular references
 */
export function safeStringify(obj: unknown, maxLength?: number): string {
  if (obj === undefined || obj === null) {
    return ''
  }

  try {
    const seen = new WeakSet()
    const result = JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]'
        }
        seen.add(value)
      }
      return value
    })

    if (maxLength && result.length > maxLength) {
      return result.substring(0, maxLength) + '...[TRUNCATED]'
    }

    return result
  } catch {
    return '[Unserializable]'
  }
}

/**
 * Mask sensitive fields in an object or array
 */
export function maskSensitiveData<T>(
  data: T,
  sensitiveFields: string[] = DEFAULT_SENSITIVE_FIELDS,
  maskPattern: string = DEFAULT_MASK_PATTERN
): T {
  if (!data || typeof data !== 'object') {
    return data
  }

  // Pre-compute lowercase sensitive fields as Set for O(1) lookup
  const sensitiveFieldsSet = new Set(sensitiveFields.map(f => f.toLowerCase()))

  function maskRecursive(obj: unknown, processed: WeakSet<object>): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj
    }

    // Handle circular references
    if (processed.has(obj)) {
      return '[Circular]'
    }
    processed.add(obj)

    // Handle arrays - create new array with masked items
    if (Array.isArray(obj)) {
      return obj.map(item => maskRecursive(item, processed))
    }

    // Handle objects - create new object to avoid mutating original
    const result: Record<string, unknown> = {}
    const source = obj as Record<string, unknown>
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const lowerKey = key.toLowerCase()
        
        // Check if key contains any sensitive field
        let isSensitive = false
        for (const field of sensitiveFieldsSet) {
          if (lowerKey.includes(field)) {
            isSensitive = true
            break
          }
        }

        if (isSensitive) {
          result[key] = maskPattern
        } else if (typeof source[key] === 'object' && source[key] !== null) {
          result[key] = maskRecursive(source[key], processed)
        } else {
          result[key] = source[key]
        }
      }
    }

    return result
  }

  return maskRecursive(data, new WeakSet()) as T
}

/**
 * Sanitize and truncate a payload for logging
 */
export function sanitizePayload(
  payload: unknown,
  options: {
    maxLength?: number
    sensitiveFields?: string[]
    maskPattern?: string
  } = {}
): string {
  const {
    maxLength = DEFAULT_MAX_BODY_LENGTH,
    sensitiveFields = DEFAULT_SENSITIVE_FIELDS,
    maskPattern = DEFAULT_MASK_PATTERN,
  } = options

  if (payload === undefined || payload === null) {
    return ''
  }

  // If already a string, try to parse and sanitize
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload)
      const masked = maskSensitiveData(parsed, sensitiveFields, maskPattern)
      return safeStringify(masked, maxLength)
    } catch {
      // Not valid JSON, just truncate
      if (payload.length > maxLength) {
        return payload.substring(0, maxLength) + '...[TRUNCATED]'
      }
      return payload
    }
  }

  // Object payload
  if (typeof payload === 'object') {
    const masked = maskSensitiveData(payload as Record<string, unknown>, sensitiveFields, maskPattern)
    return safeStringify(masked, maxLength)
  }

  return String(payload)
}

export { DEFAULT_SENSITIVE_FIELDS, DEFAULT_MASK_PATTERN, DEFAULT_MAX_BODY_LENGTH }
