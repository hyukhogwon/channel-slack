# CLAUDE.md

## Commands

```bash
npm start          # Run the MCP server
npm test           # Run all tests (vitest run)
```

## Architecture

Single-file MCP server (`slack-channel.ts`) with co-located tests (`slack-channel.test.ts`).

- **Inbound**: `@slack/bolt` Socket Mode → `shouldProcessMessage` → `buildNotification` → MCP notification
- **Outbound**: `slack_reply` tool → `chat.postMessage`

## Environment Variables

`.env` (see `.env.example`):
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` — Socket Mode credentials
- `SLACK_ALLOWED_USERS` — comma-separated Slack user IDs
