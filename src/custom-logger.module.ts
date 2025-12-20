import { DynamicModule, Global, Module, Provider } from '@nestjs/common'
import { CustomLogger } from './custom-logger'
import { LoggerModuleOptions, LoggerModuleAsyncOptions } from './interfaces/logger-options.interface'
import { LOGGER_MODULE_OPTIONS } from './constants/logger.constants'

@Global()
@Module({})
export class CustomLoggerModule {
  /**
   * Register the logger module with static options
   *
   * @example
   * ```typescript
   * CustomLoggerModule.forRoot({
   *   serviceName: 'my-service',
   *   logLevel: 'debug',
   *   environment: 'local',
   * })
   * ```
   */
  static forRoot(options: LoggerModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: LOGGER_MODULE_OPTIONS,
      useValue: options,
    }

    return {
      module: CustomLoggerModule,
      providers: [optionsProvider, CustomLogger],
      exports: [CustomLogger, LOGGER_MODULE_OPTIONS],
      global: true,
    }
  }

  /**
   * Register the logger module with async/dynamic options
   *
   * @example
   * ```typescript
   * CustomLoggerModule.forRootAsync({
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     serviceName: config.get('APP_NAME'),
   *     logLevel: config.get('LOG_LEVEL'),
   *     environment: config.get('NODE_ENV'),
   *   }),
   * })
   * ```
   */
  static forRootAsync(asyncOptions: LoggerModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: LOGGER_MODULE_OPTIONS,
      useFactory: asyncOptions.useFactory,
      inject: asyncOptions.inject || [],
    }

    return {
      module: CustomLoggerModule,
      providers: [optionsProvider, CustomLogger],
      exports: [CustomLogger, LOGGER_MODULE_OPTIONS],
      global: true,
    }
  }
}
