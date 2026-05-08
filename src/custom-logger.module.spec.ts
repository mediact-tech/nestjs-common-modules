import { ValueProvider, FactoryProvider } from '@nestjs/common'
import { CustomLoggerModule } from './custom-logger.module'
import { CustomLogger } from './custom-logger'
import { LOGGER_MODULE_OPTIONS } from './constants/logger.constants'

describe('CustomLoggerModule', () => {
  describe('forRoot', () => {
    it('returns a DynamicModule with options as ValueProvider and CustomLogger', () => {
      const options = { serviceName: 'svc-A', logLevel: 'debug' as const, maxBodyLength: 999 }
      const dyn = CustomLoggerModule.forRoot(options)

      expect(dyn.module).toBe(CustomLoggerModule)
      expect(dyn.global).toBe(true)
      expect(dyn.exports).toEqual([CustomLogger, LOGGER_MODULE_OPTIONS])

      const optionsProvider = (dyn.providers as ValueProvider[]).find(
        (p) => p.provide === LOGGER_MODULE_OPTIONS
      )!
      expect(optionsProvider.useValue).toEqual(options)
      expect(dyn.providers).toContain(CustomLogger)
    })

    it('works with no arguments (default empty options)', () => {
      const dyn = CustomLoggerModule.forRoot()
      const optionsProvider = (dyn.providers as ValueProvider[]).find(
        (p) => p.provide === LOGGER_MODULE_OPTIONS
      )!
      expect(optionsProvider.useValue).toEqual({})
    })
  })

  describe('forRootAsync', () => {
    it('returns a DynamicModule with FactoryProvider for options', () => {
      const useFactory = jest.fn().mockReturnValue({ serviceName: 'svc' })
      class Dep {}

      const dyn = CustomLoggerModule.forRootAsync({ useFactory, inject: [Dep] })

      const provider = (dyn.providers as FactoryProvider[]).find(
        (p) => p.provide === LOGGER_MODULE_OPTIONS
      )!
      expect(provider.useFactory).toBe(useFactory)
      expect(provider.inject).toEqual([Dep])
      expect(dyn.exports).toEqual([CustomLogger, LOGGER_MODULE_OPTIONS])
      expect(dyn.global).toBe(true)
    })

    it('defaults inject to [] when not provided', () => {
      const dyn = CustomLoggerModule.forRootAsync({ useFactory: () => ({}) })
      const provider = (dyn.providers as FactoryProvider[]).find(
        (p) => p.provide === LOGGER_MODULE_OPTIONS
      )!
      expect(provider.inject).toEqual([])
    })
  })
})
