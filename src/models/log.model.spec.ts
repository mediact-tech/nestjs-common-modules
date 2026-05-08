import { LogModel } from './log.model'

describe('LogModel.toReadAbleFormat', () => {
  it('joins populated fields with the documented format', () => {
    const log = new LogModel()
    log.method = 'POST'
    log.endpoint = '/api/test'
    log.userId = 'user-1234'
    log.correlationId = 'corr-12345'
    log.message = 'something happened'
    log.body = '{"a":1}'
    log.httpStatusCode = '200'
    log.statusCode = '0000'
    log.latencyMs = 42

    const out = log.toReadAbleFormat()

    expect(out).toContain('ENDPOINT: POST| /api/test')
    expect(out).toContain('USERID: user-1234')
    expect(out).toContain('RID: corr-12345')
    expect(out).toContain('MSG: something happened')
    expect(out).toContain('BODY: {"a":1}')
    expect(out).toContain('STATUS: 200,0000')
    expect(out).toContain('LATENCY: 42ms')
  })

  it('filters lines whose rendered length is <= 10 chars', () => {
    // STATUS line renders as "STATUS: ," when both codes are missing (length 9) → filtered
    const log = new LogModel()
    log.method = 'GET'
    log.endpoint = '/x'

    const out = log.toReadAbleFormat()
    expect(out).toContain('ENDPOINT: GET| /x')
    expect(out).not.toContain('STATUS:')
  })
})
