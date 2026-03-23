# CLAUDE.md

## Commands

```bash
npm start          # Run the MCP server
npm test           # Run all tests (vitest run)
```

## File Structure

```
src/
  slack-channel.ts        # MCP server (단일 파일)
  slack-channel.test.ts   # 테스트 (vitest)
package.json
tsconfig.json
.env                      # 환경변수 (git-ignored)
```

## Architecture

Single-file MCP server (`src/slack-channel.ts`) with co-located tests (`src/slack-channel.test.ts`).

- **Inbound**: `@slack/bolt` Socket Mode → `shouldProcessMessage` → `buildNotification` → MCP notification
- **Outbound**: `slack_reply` tool → `chat.postMessage`

## Environment Variables

`.env` (see `.env.example`):
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` — Socket Mode credentials
- `SLACK_ALLOWED_USERS` — comma-separated Slack user IDs
