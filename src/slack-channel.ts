#!/usr/bin/env npx tsx

import 'dotenv/config'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { App } from '@slack/bolt'

export function validateEnv(env: Record<string, string | undefined>): void {
  if (!env.SLACK_BOT_TOKEN) throw new Error('Missing required env: SLACK_BOT_TOKEN')
  if (!env.SLACK_APP_TOKEN) throw new Error('Missing required env: SLACK_APP_TOKEN')
}

export function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set()
  return new Set(raw.split(',').map(s => s.trim()).filter(Boolean))
}

export interface SlackMessage {
  user?: string
  text?: string
  channel?: string
  ts?: string
  thread_ts?: string
  subtype?: string
  bot_id?: string
}

export function shouldProcessMessage(msg: SlackMessage, allowed: Set<string>): boolean {
  if (msg.subtype) return false
  if (msg.bot_id) return false
  if (!msg.user || !allowed.has(msg.user)) return false
  return true
}

export function buildNotification(msg: SlackMessage) {
  return {
    method: 'notifications/claude/channel' as const,
    params: {
      content: msg.text ?? '',
      meta: {
        user: msg.user!,
        channel_id: msg.channel!,
        thread_ts: msg.thread_ts ?? msg.ts!,
      },
    },
  }
}

// --- Server entry point (skipped when imported by tests) ---

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*\//, ''))

if (isMain) {
  try {
    validateEnv(process.env)
  } catch (err) {
    console.error(`[slack-channel] ${(err as Error).message}`)
    process.exit(1)
  }

  const allowed = parseAllowlist(process.env.SLACK_ALLOWED_USERS)
  if (allowed.size === 0) {
    console.error('[slack-channel] WARNING: SLACK_ALLOWED_USERS is empty, all messages will be dropped')
  }

  const mcp = new Server(
    { name: 'slack', version: '0.0.1' },
    {
      capabilities: {
        experimental: { 'claude/channel': {} },
        tools: {},
      },
      instructions:
        'Messages from Slack arrive as <channel source="slack" user="..." channel_id="..." thread_ts="...">.\n' +
        'Reply using the slack_reply tool. Always pass channel_id from the tag.\n' +
        'Pass thread_ts to reply in the same thread. Respond in the same language as the message.',
    },
  )

  const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
  })

  mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'slack_reply',
        description: 'Send a reply message to Slack DM',
        inputSchema: {
          type: 'object' as const,
          properties: {
            channel_id: { type: 'string', description: 'Slack channel/DM ID from meta' },
            text: { type: 'string', description: 'Message to send' },
            thread_ts: { type: 'string', description: 'Optional. Reply in thread' },
          },
          required: ['channel_id', 'text'],
        },
      },
    ],
  }))

  mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name === 'slack_reply') {
      const { channel_id, text, thread_ts } = req.params.arguments as {
        channel_id: string
        text: string
        thread_ts?: string
      }
      await slackApp.client.chat.postMessage({ channel: channel_id, text, thread_ts })
      return { content: [{ type: 'text' as const, text: 'sent' }] }
    }
    throw new Error(`unknown tool: ${req.params.name}`)
  })

  slackApp.message(async ({ message }) => {
    const msg = message as SlackMessage
    console.error('[slack-channel] received message:', JSON.stringify(msg))
    if (!shouldProcessMessage(msg, allowed)) {
      console.error('[slack-channel] message dropped by filter (user=%s, subtype=%s, bot_id=%s)', msg.user, msg.subtype, msg.bot_id)
      return
    }
    try {
      await mcp.notification(buildNotification(msg))
      console.error('[slack-channel] notification sent for message from %s', msg.user)
    } catch (err) {
      console.error('[slack-channel] notification error:', err)
    }
  })

  await mcp.connect(new StdioServerTransport())
  await slackApp.start()
  console.error('[slack-channel] connected to Slack (Socket Mode)')
}
