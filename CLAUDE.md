# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 App Router + TypeScript. No database — all state from GitHub API + memory cache. `ssh2` for VPS operations. `@octokit/rest` for GitHub API.

## Commands

```bash
npm run dev      # Dev server port 7000
npm run build    # Production build (standalone output)
npx tsc --noEmit # Typecheck only
npm run lint     # ESLint
```

## Architecture

### Auth
`src/proxy.ts` — Next.js 16 proxy (replaces `middleware.ts`). Basic Auth on all routes except `/showcase` and `/api/showcase`. Credentials from `DASHBOARD_USER` / `DASHBOARD_PASS` env vars.

### Config (no DB — hardcoded)
- `src/config/projects.ts` — 6 `ProjectConfig` entries with repo, branch, domain, stack, containers, seedScripts, demoCredentials. **Edit here to add/remove projects.**
- `src/config/vps-domains.ts` — 6 `CertDomain` entries for SSL certs, plus `NETWORK_CONTAINERS` list for docker network fix.

### Libs
- `src/lib/github.ts` — Octokit wrapper. `triggerWorkflow()` → `findNewRun()` pattern (dispatch gives no run ID, must poll). `getRunWithJobs()` for step-level status.
- `src/lib/ssh-client.ts` — `runSshCommand()` for one-shot, `createSshStream()` for SSE-compatible streaming. All SSH ops use root password from env — timeout 120s for certbot.
- `src/lib/domain-health.ts` — HTTP + TLS cert check with 5-min in-memory cache. `invalidateCache(domain?)` after cert renewal.

### SSE Pattern
EventSource only supports GET. POST endpoints (`/api/vps/certbot`, `/api/vps/networks`, `/api/vps/seed`) trigger the action, then client opens a companion GET endpoint (`/api/vps/certbot-stream`, `/api/vps/networks-stream`, `/api/vps/seed-stream`) for the streaming output.

### Route structure
```
/api/deploy/[repo]          POST=trigger, GET=latest run
/api/runs/[runId]/stream    GET SSE — polls GitHub jobs every 5s
/api/domains/health         GET — parallel check all 6 domains
/api/status                 GET — all projects with active+latest run
/api/vps/certbot            POST — start cert action (use certbot-stream for SSE)
/api/vps/certbot-stream     GET SSE — certbot output via SSH
/api/vps/networks           POST — start network fix
/api/vps/networks-stream    GET SSE — network fix output
/api/vps/seed               POST — validates script whitelist
/api/vps/seed-stream        GET SSE — seed script output
/api/showcase               GET public — project list with demoCredentials
```

`[repo]` and `[runId]` cannot be siblings under `/api/deploy/` (Next.js slug conflict) — that's why stream is at `/api/runs/`.

### Route groups
- `(protected)/` — `layout.tsx` wraps dashboard and maintenance pages with Sidebar + Header
- `(public)/` — showcase page, no auth

### Deployment
- Docker multi-stage standalone build, port 7000
- Container connects to `webphoto_backend` Docker network (shared with all VPS projects) — nginx proxies by container name
- Nginx conf: `infra/nginx/conf.d/deploy-dashboard.bhquan.store.conf`
- CI/CD: `.github/workflows/deploy.yml` — does `git pull` + `docker build` on VPS (not on runner)

## Adding a New Project

1. Add entry to `PROJECTS` array in `src/config/projects.ts`
2. Add cert domain to `VPS_DOMAINS` in `src/config/vps-domains.ts`
3. Add containers to `NETWORK_CONTAINERS` in `vps-domains.ts`
4. If project has seed scripts, set `seedScripts` + `containerForSeed`

## Environment Variables

```
GITHUB_TOKEN      # PAT with repo+actions scope
GITHUB_OWNER      # e.g. BHQUAN97
VPS_HOST / VPS_PORT / VPS_USER / VPS_PASSWORD
CERTBOT_EMAIL
DASHBOARD_USER / DASHBOARD_PASS   # Basic Auth
PORT=7000
```
