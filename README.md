# channel-slack

Slack DM으로 Claude Code와 대화할 수 있는 MCP 채널 서버입니다.
Slack에서 메시지를 보내면 Claude Code가 읽고, Claude Code가 Slack으로 답장합니다.

---

## 준비물

- **Node.js** 18 이상
- **Slack 워크스페이스** (관리자 권한 또는 앱 설치 권한)
- **Claude Code** CLI

---

## 1단계: Slack 앱 만들기

1. https://api.slack.com/apps 에 접속하여 **Create New App** → **From scratch** 선택
2. 앱 이름(예: `Claude`)과 워크스페이스를 선택하고 생성

### Socket Mode 켜기

1. 왼쪽 메뉴 **Socket Mode** 클릭
2. **Enable Socket Mode** 토글 ON
3. 토큰 이름(예: `claude-socket`)을 입력하고 **Generate**
4. 생성된 `xapp-...` 토큰을 복사해 둡니다 → 이것이 **SLACK_APP_TOKEN** 입니다

### Bot Token 발급

1. 왼쪽 메뉴 **OAuth & Permissions** 클릭
2. **Bot Token Scopes** 섹션에서 아래 권한을 추가합니다:
   - `chat:write` — 메시지 보내기
   - `im:history` — DM 읽기
   - `im:read` — DM 목록 읽기
3. 페이지 상단 **Install to Workspace** 클릭 → 권한 허용
4. 생성된 `xoxb-...` 토큰을 복사해 둡니다 → 이것이 **SLACK_BOT_TOKEN** 입니다

### Event Subscriptions 설정

1. 왼쪽 메뉴 **Event Subscriptions** 클릭
2. **Enable Events** 토글 ON
3. **Subscribe to bot events** 섹션에서 `message.im` 추가
4. **Save Changes** 클릭

### App Home 설정

1. 왼쪽 메뉴 **App Home** 클릭
2. **Messages Tab** 토글 ON (봇에게 DM을 보낼 수 있게 됩니다)

---

## 2단계: 내 Slack User ID 확인

Claude Code에 메시지를 보낼 수 있는 사용자를 제한하기 위해 본인의 User ID가 필요합니다.

1. Slack에서 본인 프로필 클릭
2. **⋯** (더보기) → **Copy member ID** 클릭
3. `U`로 시작하는 ID가 복사됩니다 (예: `U01ABC2DEF3`)

---

## 3단계: 설치 및 설정

```bash
# 저장소 클론
git clone https://github.com/hyukhogwon/channel-slack.git
cd channel-slack

# 의존성 설치
npm install

# 환경변수 파일 생성
cp .env.example .env
```

`.env` 파일을 열어 아래 값을 채워 넣습니다:

```env
SLACK_BOT_TOKEN=xoxb-여기에-봇-토큰-붙여넣기
SLACK_APP_TOKEN=xapp-여기에-앱-토큰-붙여넣기
SLACK_ALLOWED_USERS=U01ABC2DEF3
```

여러 명이 사용하려면 쉼표로 구분합니다:

```env
SLACK_ALLOWED_USERS=U01ABC2DEF3,U04XYZ5GHI6
```

---

## 4단계: Claude Code에 연결

프로젝트 루트에 `.mcp.json` 파일을 만듭니다:

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["tsx", "./src/slack-channel.ts"],
      "cwd": "/channel-slack 경로"
    }
  }
}
```

Claude Code를 실행하면 자동으로 Slack 채널 서버가 함께 시작됩니다.

---

## 사용 방법

1. Slack에서 만든 봇 앱에 DM을 보냅니다
2. Claude Code가 메시지를 수신하고 처리합니다
3. Claude Code가 Slack DM으로 답장합니다

---

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 메시지를 보내도 반응 없음 | `SLACK_ALLOWED_USERS`에 내 ID가 없음 | `.env`에 User ID 추가 |
| `Missing required env` 에러 | 토큰이 설정되지 않음 | `.env` 파일 확인 |
| `socket hang up` 에러 | Socket Mode가 꺼져 있음 | Slack 앱 설정에서 Socket Mode ON |
| 봇에게 DM을 보낼 수 없음 | App Home Messages Tab이 꺼져 있음 | App Home 설정에서 Messages Tab ON |
