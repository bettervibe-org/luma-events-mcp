# luma-events-mcp

MCP server exposing Luma Calendar operations as tools for AI assistants.

## Tech Stack
- TypeScript, ESM (`"type": "module"`), Node >=18, compiled with `tsc` to `dist/`.
- Biome for lint + format (`npm run check` / `check:fix`) — do not add ESLint or Prettier.
- Vitest for tests, lefthook for git hooks, semantic-release for publishing.
- Runtime deps: `@modelcontextprotocol/sdk`, `zod`.

## Layout
- `src/index.ts` — server entry; wires up `StdioServerTransport` and registers tools.
- `src/luma-client.ts` — thin `fetch()` wrapper: auth header, JSON, pagination, errors.
- `src/tools/<tool>.ts` — one file per MCP tool, with `*.test.ts` next to it.
- Credentials come from `.env` (see `.env.example`); dev loads it via `tsx --env-file=.env`, not `dotenv`.

## Workflow
- Dev: `npm run dev` (watch). Build: `npm run build`. Test: `npm test`.
- Full validation: `npm run validate` (lint + test + knip + docs check + build).
- Smoke test: `npm run smoke` (requires `LUMA_API_KEY` in `.env`).

## Smoke test
`npm run smoke` — deterministic SDK harness (`scripts/smoke.ts`). Spawns the built server over stdio via the MCP client SDK, verifies all tools are registered, and runs read-only operations against the real Luma API.

`.mcp.json` at the repo root registers the server (loads `.env` via `node --env-file`) so interactive Claude Code sessions pick it up automatically.
