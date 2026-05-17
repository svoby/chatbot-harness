# Deployment Handoff

Operational checklist for handing this Next.js app to a deployment owner. The
deployment shape follows [MVP_ARCHITECTURE.md](MVP_ARCHITECTURE.md): GitHub is
the source of truth, Vercel is the preferred app host, provider credentials stay
server-side, and mock/no-key mode remains available.

## Scope

This document prepares the repo for deployment handoff. It does not grant
account access, create a Vercel project, deploy the app, add a database, or
change product retrieval.

Do not introduce:

- `NEXT_PUBLIC_*` provider or database secrets.
- Database, RAG, auth, Docker, queues, or agent framework infrastructure.
- Product retrieval or UI behavior changes.
- Package or lockfile changes unless a later deployment issue explicitly
  requires them.

## Vercel Project Setup

Use the Vercel dashboard or approved organization tooling:

1. Import the GitHub repository into Vercel.
2. Keep the framework preset as Next.js.
3. Keep install/build commands on the project defaults unless a concrete
   failure requires changing them:
   - Install command: `npm ci`
   - Build command: `npm run build`
4. Configure the production branch as `master`.
5. Enable GitHub pull request preview deployments.
6. Add only server-side environment variables in Vercel project settings.

No Vercel account IDs, project IDs, team IDs, or production URLs belong in the
repo unless a human explicitly provides them and asks for committed
documentation.

## Environment Variables

Local examples live in `.env.local.example`. Vercel values should be configured
per environment in the Vercel dashboard.

| Variable | Required | Scope | Value | Notes |
|---|---:|---|---|---|
| `LLM_MODE` | Yes | Server-side | `mock` or `real` | Missing or any value other than `real` behaves as `mock`. |
| `OPENAI_API_KEY` | Only when `LLM_MODE=real` | Server-side secret | OpenAI API key | Never expose through `NEXT_PUBLIC_*`. |

Recommended deployment values:

- Preview without provider credentials: `LLM_MODE=mock`; omit
  `OPENAI_API_KEY`.
- Preview with provider smoke testing: `LLM_MODE=real`; set
  `OPENAI_API_KEY`.
- Production demo with real model behavior: `LLM_MODE=real`; set
  `OPENAI_API_KEY`.
- Production demo without provider access: `LLM_MODE=mock`; omit
  `OPENAI_API_KEY`.

Mock mode is intentionally valid for preview deployments, production demos
without credentials, local development, and CI. It must continue to work with no
provider key.

## Preview Expectations

Every pull request should receive a Vercel preview URL after GitHub integration
is connected. Use previews to verify:

- The page loads.
- A chat request returns recommendations.
- Product names, prices, and attributes come from the catalog-backed tool.
- Debug mode, when enabled in the UI, reports `llmMode` matching the configured
  environment.

Preview deployments may run in `mock` mode when provider credentials are not
available. That is expected and should not block documentation-only or UI-only
changes.

## Production Expectations

Production deploys should be created from `master` only. Before sharing a
production URL:

1. Confirm the latest `master` deployment succeeded.
2. Confirm the intended environment mode:
   - `mock` for deterministic no-key demo behavior.
   - `real` only when `OPENAI_API_KEY` is configured server-side.
3. Run the smoke checks below against the production URL.
4. Record the production URL in a human-owned channel. Add it to the repo only
   if a human explicitly asks for that docs update.

## Smoke Checks

Run local checks from the repo root:

```bash
npm run lint
npm run build
LLM_MODE=mock npm run dev
```

With the dev server running, verify mock/no-key API behavior:

```bash
curl -sS http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"message":"I need fragrance-free SPF under 500 CZK","debug":true}'
```

Expected local result:

- HTTP 200.
- `recommendations` is present.
- `debug.llmMode` is `mock`.
- No `OPENAI_API_KEY` is required.

Run the same API smoke check against a Vercel preview or production URL:

```bash
curl -sS https://DEPLOYMENT_URL/api/chat \
  -H 'content-type: application/json' \
  -d '{"message":"I need fragrance-free SPF under 500 CZK","debug":true}'
```

Expected deployed result:

- HTTP 200.
- `recommendations` is present.
- `debug.llmMode` matches the Vercel `LLM_MODE` setting.
- Product facts are limited to returned catalog products.

If `LLM_MODE=real` is configured without `OPENAI_API_KEY`, the route should not
be considered ready for production. Either add the server-side key or switch the
environment back to `mock`.

## Handoff Checklist

Before handing the app to a deployment owner, confirm:

- Vercel project is connected to the GitHub repository.
- Production branch is `master`.
- Pull request preview deployments are enabled.
- Vercel install command remains `npm ci`.
- Vercel build command is `npm run build`.
- Server-side env vars are set for each Vercel environment.
- No provider or database secret uses a `NEXT_PUBLIC_*` name.
- Mock/no-key local mode has been smoke checked.
- Preview or production URL has passed the API smoke check.
- No package or lockfile changes were introduced for deployment readiness.
