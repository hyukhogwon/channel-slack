import { describe, test, expect } from 'vitest'
import {
  validateEnv,
  parseAllowlist,
  shouldProcessMessage,
  buildNotification,
} from './slack-channel'

describe('validateEnv', () => {
  test('SLACK_BOT_TOKEN과 SLACK_APP_TOKEN이 있으면 통과', () => {
    const env = {
      SLACK_BOT_TOKEN: 'xoxb-test',
      SLACK_APP_TOKEN: 'xapp-test',
    }
    expect(() => validateEnv(env)).not.toThrow()
  })

  test('SLACK_BOT_TOKEN 누락 시 에러', () => {
    const env = { SLACK_APP_TOKEN: 'xapp-test' }
    expect(() => validateEnv(env)).toThrow('SLACK_BOT_TOKEN')
  })

  test('SLACK_APP_TOKEN 누락 시 에러', () => {
    const env = { SLACK_BOT_TOKEN: 'xoxb-test' }
    expect(() => validateEnv(env)).toThrow('SLACK_APP_TOKEN')
  })
})

describe('parseAllowlist', () => {
  test('쉼표 구분 파싱', () => {
    expect(parseAllowlist('U123,U456')).toEqual(new Set(['U123', 'U456']))
  })

  test('공백 포함 시 trim', () => {
    expect(parseAllowlist('U123, U456')).toEqual(new Set(['U123', 'U456']))
  })

  test('빈 항목 무시', () => {
    expect(parseAllowlist('U123,,U456')).toEqual(new Set(['U123', 'U456']))
  })

  test('undefined 시 빈 Set', () => {
    expect(parseAllowlist(undefined)).toEqual(new Set())
  })

  test('빈 문자열 시 빈 Set', () => {
    expect(parseAllowlist('')).toEqual(new Set())
  })
})

describe('shouldProcessMessage', () => {
  const allowed = new Set(['U123'])

  test('일반 사용자 메시지는 처리', () => {
    const msg = { user: 'U123', text: 'hello' }
    expect(shouldProcessMessage(msg, allowed)).toBe(true)
  })

  test('subtype 있으면 drop', () => {
    const msg = { user: 'U123', text: 'hello', subtype: 'bot_message' }
    expect(shouldProcessMessage(msg, allowed)).toBe(false)
  })

  test('bot_id 있으면 drop', () => {
    const msg = { user: 'U123', text: 'hello', bot_id: 'B123' }
    expect(shouldProcessMessage(msg, allowed)).toBe(false)
  })

  test('allowlist에 없는 user는 drop', () => {
    const msg = { user: 'U999', text: 'hello' }
    expect(shouldProcessMessage(msg, allowed)).toBe(false)
  })

  test('빈 allowlist면 모든 메시지 drop', () => {
    const empty = new Set<string>()
    const msg = { user: 'U123', text: 'hello' }
    expect(shouldProcessMessage(msg, empty)).toBe(false)
  })
})

describe('buildNotification', () => {
  test('일반 메시지 변환', () => {
    const msg = { user: 'U123', text: 'hello', channel: 'D456', ts: '1234.5678' }
    const result = buildNotification(msg)
    expect(result).toEqual({
      method: 'notifications/claude/channel',
      params: {
        content: 'hello',
        meta: { user: 'U123', channel_id: 'D456', thread_ts: '1234.5678' },
      },
    })
  })

  test('스레드 메시지는 thread_ts 사용', () => {
    const msg = { user: 'U123', text: 'reply', channel: 'D456', ts: '1234.9999', thread_ts: '1234.5678' }
    const result = buildNotification(msg)
    expect(result.params.meta.thread_ts).toBe('1234.5678')
  })

  test('meta에 source를 포함하지 않음 (Claude Code가 자동 설정)', () => {
    const msg = { user: 'U123', text: 'hello', channel: 'D456', ts: '1234.5678' }
    const result = buildNotification(msg)
    expect(result.params.meta).not.toHaveProperty('source')
  })
})
