export class LogModel {
  correlationId?: string
  method?: string
  endpoint?: string
  userId?: string
  body?: string
  param?: string
  message?: string
  response?: string
  errorStack?: string
  statusCode?: string
  httpStatusCode?: string
  header?: string
  latencyMs?: number

  toReadAbleFormat() {
    return [
      `ENDPOINT: ${this.method}| ${this.endpoint}`,
      `USERID: ${this.userId}`,
      `RID: ${this.correlationId}`,
      `MSG: ${this.message}`,
      `BODY: ${this.body}`,
      `STATUS: ${[this.httpStatusCode, this.statusCode].join(',')}`,
      `LATENCY: ${this.latencyMs}ms`,
    ]
      .filter((e) => e?.length > 10)
      .join('\n')
  }
}
