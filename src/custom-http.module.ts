import { HttpModule as AxiosHttpModule, HttpService } from '@nestjs/axios'
import { Global, Module, OnModuleInit } from '@nestjs/common'
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { CustomLogger } from './custom-logger'
import { CORRELATION_ID_HEADER, getCorrelationId } from './middleware/correlation.middleware'

@Global()
@Module({
  imports: [AxiosHttpModule],
  exports: [AxiosHttpModule],
})
export class HttpModule extends AxiosHttpModule implements OnModuleInit {
  constructor(private httpService: HttpService, private customLogger: CustomLogger) {
    super()
  }

  onModuleInit(): any {
    const { axiosRef: axios } = this.httpService

    axios.interceptors.request.use(
      (config) => {
        return this.onRequest(config)
      },
      (err) => {
        throw err
      }
    )
    axios.interceptors.response.use(
      (res) => {
        return this.onResponse(res)
      },
      (err: AxiosError) => {
        this.onResponse(err.response)
        throw err
      }
    )
  }

  private onRequest(config: InternalAxiosRequestConfig<any>) {
    const correlationId = getCorrelationId()
    if (correlationId) {
      config.headers[CORRELATION_ID_HEADER] = correlationId
    }
    return config
  }

  private onResponse(res: AxiosResponse<any, any>) {
    this.customLogger.logAxiosHttpResponse(res)
    return res
  }
}
