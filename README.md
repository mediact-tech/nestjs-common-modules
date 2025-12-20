# @anthropic/nestjs-custom-logger

A strict, production-ready logging module for NestJS applications with Fastify, built on [Pino](https://getpino.io/).

**Designed for internal team use** - enforces consistent logging patterns with minimal configuration.

## Features

- **NestJS LoggerService interface** - Drop-in replacement for NestJS default logger
- **Built-in correlation middleware** - Automatic request tracking via AsyncLocalStorage (required)
- **Sensitive data masking** - Automatically masks passwords, tokens, and PII
- **Payload truncation** - Prevents log bloat from large request/response bodies
- **Child loggers** - Scoped loggers with inherited context
- **Structured logging** - JSON output with correlation IDs and metadata
- **Multiple log levels** - `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- **Pretty printing** - Human-readable output for local development
- **Safe serialization** - Handles circular references gracefully
- **Exception filter** - Global exception handling with logging
- **Response interceptors** - Automatic response wrapping and logging
- **Swagger decorators** - API documentation helpers

## Installation

```bash
npm install @anthropic/nestjs-custom-logger
# or
yarn add @anthropic/nestjs-custom-logger
```

### Peer Dependencies

Make sure you have these installed:

```bash
npm install @nestjs/common @nestjs/core @nestjs/swagger fastify pino pino-pretty
```

## Quick Start

### 1. Import the module

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CustomLoggerModule } from '@anthropic/nestjs-custom-logger'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CustomLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        serviceName: config.get('APP_NAME') || 'my-service',
        logLevel: config.get('LOG_LEVEL') || 'info',
        environment: config.get('NODE_ENV') || 'production',
      }),
    }),
  ],
})
export class AppModule {}
```

### 2. Setup main.ts (REQUIRED)

**You MUST register the correlation middleware for the logger to work correctly:**

```typescript
// main.ts
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import {
  CustomLogger,
  correlationMiddleware,
  CustomResponseInterceptor,
  AllExceptionsFilter,
} from '@anthropic/nestjs-custom-logger'
import { HttpAdapterHost } from '@nestjs/core'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  )

  const httpAdapter = app.get(HttpAdapterHost)
  const logger = app.get(CustomLogger)

  // Use as NestJS application logger
  app.useLogger(logger)

  // Global interceptors and filters
  app.useGlobalInterceptors(new CustomResponseInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter, logger))

  // REQUIRED: Register correlation middleware for request tracking
  await app.register(correlationMiddleware)

  await app.listen(3000)
}
```

### 3. Use the logger

```typescript
import { Injectable } from '@nestjs/common'
import { CustomLogger } from '@anthropic/nestjs-custom-logger'

@Injectable()
export class MyService {
  constructor(private readonly logger: CustomLogger) {}

  doSomething() {
    this.logger.info('Processing request', { orderId: '123' })
    this.logger.debug('Debug info', { details: { foo: 'bar' } })
    this.logger.warn('Something unusual happened')
    this.logger.error(new Error('Something went wrong'))
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serviceName` | `string` | `'app'` | Service name in log metadata |
| `logLevel` | `Level` | `'info'` | Minimum log level |
| `environment` | `string` | `'production'` | Environment name |
| `prettyPrint` | `boolean` | `true` when local | Enable pino-pretty |
| `maxBodyLength` | `number` | `2048` | Max body length before truncation |
| `sensitiveFields` | `string[]` | See below | Fields to mask |
| `maskPattern` | `string` | `'[REDACTED]'` | Replacement for sensitive data |
| `baseMetadata` | `object` | `{}` | Additional base log metadata |
| `redactPaths` | `string[]` | `undefined` | Pino redaction paths |

### Default Sensitive Fields

```typescript
[
  'password', 'token', 'secret', 'authorization',
  'apiKey', 'api_key', 'accessToken', 'access_token',
  'refreshToken', 'refresh_token', 'credential',
  'credentials', 'private_key', 'privateKey'
]
```

## Child Loggers

Create scoped loggers for specific modules:

```typescript
@Injectable()
export class PaymentService {
  private readonly logger: CustomLogger

  constructor(parentLogger: CustomLogger) {
    this.logger = parentLogger.child('PaymentService', { module: 'payments' })
  }

  processPayment() {
    this.logger.info('Processing payment') // Logs with scope: 'PaymentService'
  }
}
```

## Setting User ID

Use `setUserId` in your authentication guard:

```typescript
import { setUserId } from '@anthropic/nestjs-custom-logger'

// In your JWT guard after verifying the token:
setUserId(payload.userId)
```

## Swagger Documentation

```typescript
import { SwaggerApiResponse } from '@anthropic/nestjs-custom-logger'

@Get()
@SwaggerApiResponse(UserDto)
getUser() { ... }

@Get('list')
@SwaggerApiResponse(UserDto, 'array')
getUsers() { ... }
```

## Exception Notifications

To receive exception notifications, implement the `ExceptionNotifyService` interface:

```typescript
import { ExceptionNotifyService } from '@anthropic/nestjs-custom-logger'

@Injectable()
export class NotifyService implements ExceptionNotifyService {
  sendNotiIgnoreError(message: string): void {
    // Send to Slack, Discord, etc.
  }
}

// In main.ts:
const notifyService = app.get(NotifyService)
app.useGlobalFilters(new AllExceptionsFilter(httpAdapter, logger, notifyService))
```

## API Reference

### CustomLogger Methods

| Method | Description |
|--------|-------------|
| `log(message, meta?)` | Alias for `info()` |
| `info(message, meta?)` | Log at info level |
| `debug(message, meta?)` | Log at debug level |
| `warn(message, meta?)` | Log at warn level |
| `error(messageOrError, meta?)` | Log error with stack trace |
| `fatal(messageOrError, meta?)` | Log critical error |
| `verbose(message, meta?)` | Log at trace level |
| `child(scope, extraMeta?)` | Create scoped child logger |
| `logApiRequestResponse(...)` | Log Fastify request/response |
| `logAxiosHttpResponse(...)` | Log Axios HTTP response |

### Exports

```typescript
// Core
export { CustomLoggerModule } from './custom-logger.module'
export { CustomLogger } from './custom-logger'
export { LogModel } from './models/log.model'

// Middleware
export { correlationMiddleware, getCorrelationId, getUserId, setUserId, getRequestContext, CORRELATION_ID_HEADER } from './middleware/correlation.middleware'

// Filters & Interceptors
export { AllExceptionsFilter, ExceptionNotifyService } from './filters/exception.filter'
export { LoggingInterceptor } from './interceptors/logging.interceptor'
export { CustomResponseInterceptor } from './interceptors/response.interceptor'
export { CustomResponse, BussinessException, ResponseStatusCode } from './interceptors/models/custom-response.model'

// Decorators
export { SwaggerApiResponse } from './decorators/response-swagger-doc.decorator'

// Utilities
export { sanitizePayload, safeStringify, maskSensitiveData } from './utils/sanitizer.util'
```

## License

MIT
