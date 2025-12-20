import { Level } from 'pino'

/**
 * Configuration options for CustomLogger module
 */
export interface LoggerModuleOptions {
  /**
   * Application/service name used in log base metadata
   * @default 'app'
   */
  serviceName?: string

  /**
   * Log level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
   * @default 'info'
   */
  logLevel?: Level

  /**
   * Environment name (e.g., 'local', 'development', 'staging', 'production')
   * When set to 'local', pino-pretty transport is enabled
   * @default 'production'
   */
  environment?: string

  /**
   * Enable pretty printing for local development
   * @default true when environment is 'local'
   */
  prettyPrint?: boolean

  /**
   * Maximum length for request/response body in logs (in characters)
   * Bodies exceeding this limit will be truncated
   * @default 2048
   */
  maxBodyLength?: number

  /**
   * List of field names to mask in logs (e.g., passwords, tokens)
   * Values will be replaced with '[REDACTED]'
   * @default ['password', 'token', 'secret', 'authorization', 'apiKey', 'api_key', 'accessToken', 'refreshToken']
   */
  sensitiveFields?: string[]

  /**
   * Mask pattern to use for sensitive fields
   * @default '[REDACTED]'
   */
  maskPattern?: string

  /**
   * Additional base metadata to include in all logs
   */
  baseMetadata?: Record<string, unknown>

  /**
   * Custom redaction paths for pino (advanced)
   * @see https://getpino.io/#/docs/redaction
   */
  redactPaths?: string[]
}

/**
 * Async options factory for dynamic configuration
 */
export interface LoggerModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<LoggerModuleOptions> | LoggerModuleOptions
  inject?: any[]
}
