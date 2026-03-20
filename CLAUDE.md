# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An MCP (Model Context Protocol) server that bridges Slack DMs to Claude Code via Socket Mode. Incoming Slack messages are forwarded as MCP notifications; Claude replies via the `slack_reply` tool. Only messages from allowlisted user IDs are processed.

## Commands

```bash
npm start          # Run the MCP server (npx tsx slack-channel.ts)
npm test           # Run all tests (vitest run)
npx vitest run slack-channel.test.ts  # Run single test file
```

## Architecture

Single-file MCP server (`slack-channel.ts`) with co-located tests (`slack-channel.test.ts`).

- **Inbound**: `@slack/bolt` Socket Mode listener → `shouldProcessMessage` (allowlist filter) → `buildNotification` → MCP notification to Claude Code
- **Outbound**: Claude Code calls `slack_reply` tool → `chat.postMessage` via Bolt client
- Pure helper functions (`validateEnv`, `parseAllowlist`, `shouldProcessMessage`, `buildNotification`) are exported and unit-tested independently; the `if (isMain)` block handles server bootstrap and is not tested directly.

## Environment Variables

Defined in `.env` (see `.env.example`):
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` — required, Socket Mode credentials
- `SLACK_ALLOWED_USERS` — comma-separated Slack user IDs; empty = all messages dropped

## MCP Integration

`.mcp.json` registers this as the `slack` MCP server. Claude Code launches it as a subprocess via `npx tsx ./slack-channel.ts`.
