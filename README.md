# SpawnDock TMA Starter

This starter demonstrates how to build a Telegram Mini App with SpawnDock
local preview support.

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [@telegram-apps SDK](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk/2-x)
- [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI)

## Setup

Install dependencies with `pnpm install`.

If you are using SpawnDock, bootstrap the project with:

```bash
npx @spawn-dock/create --token <pairing-token> [project-dir]
```

## Scripts

- `pnpm run dev` starts Next.js and the SpawnDock tunnel together.
- `pnpm run dev:next` starts only the local Next.js server.
- `pnpm run dev:tunnel` starts only the SpawnDock tunnel client.
- `pnpm run agent:session` starts the SpawnDock AI runtime launcher inside the bootstrapped project.
- `pnpm run build` builds the starter for production.
- `pnpm run publish:github-pages` exports the app and deploys it to GitHub Pages.
- `pnpm run start` starts the production Next.js server.

## SpawnDock Flow

The starter expects a bootstrap step that writes `spawndock.config.json` and
`spawndock.dev-tunnel.json` before `pnpm run dev` is used. The template itself
already ships agent MCP configs and a local wrapper so the generated project is
ready to connect to `@spawn-dock/mcp` via `/mcp/sse`.

## Local Config

- `spawndock.config.json` contains preview/runtime data for the app.
- `spawndock.dev-tunnel.json` contains tunnel connection data.
- `opencode.json` is generated during bootstrap for OpenCode.
- `.mcp.json` is generated during bootstrap for Claude Code.
- `spawndock/mcp.mjs` resolves `mcpServerUrl` from `spawndock.config.json`.
- `public/tonconnect-manifest.json` is replaced during bootstrap with the
  correct preview URL.

## Notes

- The template still supports the regular Next.js build and start commands.
- The `mockTelegramEnv` development-only shim is still used by the app.
