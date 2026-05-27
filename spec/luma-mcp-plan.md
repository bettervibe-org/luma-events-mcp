# Plan: `luma-mcp` — Luma Calendar MCP Server

## Context

Dominik subscribed to Luma Plus to get API access. No quality MCP server exists for the Luma Calendar API (the existing ones are Python, abandoned, or auto-generated slop). Building one serves double duty: operational tool for bettervibe workshops (replacing manual CSV exports for guest/invoice data) and marketing channel (first quality Luma MCP server, published under the bettervibe-org GitHub org).

The implementation follows the `caldav-mcp` reference repo exactly — same architecture, tooling, and conventions.

## Architecture

```
luma-mcp/                          # New repo: github.com/bettervibe-org/luma-mcp
├── src/
│   ├── index.ts                   # Entry point: create client → test connection → register tools → stdio
│   ├── index.test.ts
│   ├── luma-client.ts             # Thin fetch() wrapper: auth header, JSON, pagination, errors
│   ├── luma-client.test.ts
│   └── tools/                     # One file + one test per tool
│       ├── get-calendar.ts        ─┐
│       ├── list-events.ts         │ Phase 1: read-only
│       ├── get-event.ts           │
│       ├── list-guests.ts         │
│       ├── get-guest.ts           │
│       ├── list-ticket-types.ts   ─┘
│       ├── create-event.ts        ─┐
│       ├── update-event.ts        │ Phase 2: write ops
│       ├── add-guests.ts          │
│       ├── update-guest-status.ts │
│       ├── send-invites.ts        ─┘
│       ├── create-ticket-type.ts  ─┐
│       ├── list-coupons.ts        │ Phase 3: extended
│       └── create-coupon.ts       ─┘
├── scripts/
│   ├── gen-tool-docs.ts           # Auto-generates README tool docs
│   └── smoke.ts                   # SDK-level smoke test
├── .github/workflows/
│   ├── release.yml                # lint → test → build → smoke → semantic-release
│   ├── publish-mcp-registry.yml
│   ├── claude.yml
│   └── claude-code-review.yml
└── [config files]                 # package.json, tsconfig, biome, vitest, etc.
```

## Key design decisions

**No external HTTP client.** Native `fetch()` (Node 18+). A thin `LumaClient` class (~80 LOC) handles auth header, base URL, JSON parsing, error wrapping, and cursor-based pagination. Replaces the role `ts-caldav` plays in caldav-mcp.

**`LUMA_BASE_URL` env var override.** Defaults to `https://public-api.luma.com`. Allows CI smoke tests to point at a local mock server without a real API key.

**Pagination: dual mode.** Tools expose optional `pagination_limit` / `pagination_cursor` inputs. When omitted, auto-paginate and return all results. When provided, return one page with `next_cursor`.

**Tool pattern (identical to caldav-mcp):** Each tool exports a `*Definition` (name, description, Zod inputSchema, returns) and a `register*` function taking `(client: LumaClient, server: McpServer)`.

## Luma API reference

- **Base URL**: `https://public-api.luma.com`
- **Auth**: `x-luma-api-key` header
- **Rate limits**: 200 req/min (calendar key), 500 req/min (org key)
- **Pagination**: Cursor-based (`pagination_cursor`, `pagination_limit`; response has `has_more` + `next_cursor`)
- **IDs**: Prefixed strings — `evt-` (events), `gst-` (guests), `ett-` (ticket types)
- **Dates**: ISO 8601 UTC
- **Docs**: https://docs.luma.com/reference

## Implementation order

### Step 1: Scaffolding

Create the repo and all config files, adapted from caldav-mcp:

| File | Notes |
|------|-------|
| `package.json` | name: `luma-mcp`, bin: `luma-mcp`, deps: `@modelcontextprotocol/sdk`, `zod` |
| `tsconfig.json` | Verbatim copy from caldav-mcp |
| `biome.json` | Verbatim copy |
| `vitest.config.ts` | Verbatim copy |
| `.releaserc.json` | Verbatim copy |
| `commitlint.config.js` | Verbatim copy |
| `knip.json` | Verbatim copy, adjust ignored deps |
| `lefthook.yml` | Verbatim copy |
| `.npmrc` | Verbatim copy |
| `.gitignore` | Verbatim copy |
| `.env.example` | Just `LUMA_API_KEY` |
| `.mcp.json` | Local dev config pointing at `dist/index.js` |
| `server.json` | MCP registry descriptor |
| `LICENSE` | MIT |
| `.github/workflows/*.yml` | 4 workflows adapted from caldav-mcp |

### Step 2: LumaClient

`src/luma-client.ts` (~80 LOC):
- `constructor(apiKey: string, baseUrl?: string)` — baseUrl defaults to env var or `https://public-api.luma.com`
- `request<T>(method, path, body?)` — sets `x-luma-api-key` header, parses JSON, throws `LumaApiError` on non-2xx
- `paginate<T>(path, params?)` — handles `pagination_cursor` / `has_more` / `next_cursor` loop
- `testConnection()` — calls `GET /v1/calendar/get`, fails fast on bad API key

`src/luma-client.test.ts`:
- Mock `fetch` with `vi.stubGlobal`
- Test auth header, error handling, pagination cursor loop

### Step 3: Phase 1 tools (read-only)

| Tool | Endpoint | Key inputs |
|------|----------|------------|
| `get-calendar` | `GET /v1/calendar/get` | None |
| `list-events` | `GET /v1/calendar/list-events` | `after?`, `before?`, pagination params |
| `get-event` | `GET /v1/event/get` | `event_id` |
| `list-guests` | `GET /v1/event/get-guests` | `event_id`, `approval_status?`, sort/pagination |
| `get-guest` | `GET /v1/event/get-guest` | `event_id` + (`guest_id` or `email`) |
| `list-ticket-types` | `GET /v1/event/ticket-types/list` | `event_id` |

Each tool: one `.ts` file + one `.test.ts` file, following the caldav-mcp pattern.

### Step 4: Server entry point

`src/index.ts` (~40 LOC):
1. Create `LumaClient` from `LUMA_API_KEY` env var
2. Call `testConnection()` — exit on failure
3. Register all Phase 1 tools
4. Connect `StdioServerTransport`

`src/index.test.ts`: mock all deps, verify silent bootstrap.

### Step 5: Scripts & docs

- `scripts/gen-tool-docs.ts` — imports all `*Definition` objects, renders markdown between `<!-- TOOLS:START -->` / `<!-- TOOLS:END -->`
- `scripts/smoke.ts` — spawns server via `StdioClientTransport`, calls tools against real or mock API
- `README.md` — badges, features, setup config, auto-generated tool docs, license
- `CLAUDE.md` — tech stack, layout, workflow instructions

### Step 6: Phase 2 tools (write operations)

| Tool | Endpoint | Key inputs |
|------|----------|------------|
| `create-event` | `POST /v1/event/create` | `name`, `start_at`, `timezone` (required); many optional |
| `update-event` | `POST /v1/event/update` | `event_id` (required); all fields optional |
| `add-guests` | `POST /v1/event/add-guests` | `event_id`, `guests[]` with email + optional ticket |
| `update-guest-status` | `POST /v1/event/update-guest-status` | `event_id`, guest identifier, `status` |
| `send-invites` | `POST /v1/event/send-invites` | `event_id`, `guests[]`, optional `message` |

### Step 7: Phase 3 tools (extended)

| Tool | Endpoint | Key inputs |
|------|----------|------------|
| `create-ticket-type` | `POST /v1/event/ticket-types/create` | `event_id`, `name`, `type` (free/paid) |
| `list-coupons` | `GET /v1/event/coupons` | `event_id` |
| `create-coupon` | `POST /v1/event/create-coupon` | `code`, `discount` (percent or amount) |

## Publishing

- **npm**: `npx luma-mcp` — semantic-release on merge to main
- **MCP Registry**: auto-publish via workflow on GitHub release
- **Repo**: `github.com/bettervibe-org/luma-mcp` (public, MIT)

## Verification

1. `npm run validate` — lint + test + knip + docs check + build
2. `npm run smoke` — spawns server, calls each tool against mock or real Luma API
3. Manual: add to Claude Code via `.mcp.json`, run `get-calendar` and `list-events` against real API key
4. Integration: configure in `workshops/.claude/settings.local.json`, verify guest data matches CSV export
