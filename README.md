# Пріоритети

Personal decision-training tool. Three prioritization frameworks score the same tasks, disagree, and surface the real question: which voice are you listening to?

## How it works

1. **Consequences x Deadline** — what breaks if you don't?
2. **Personal Importance** — does this align with who you want to be?
3. **Energy Match** — can you do this well right now?

When frameworks agree: green banner, high confidence.
When they disagree: red badge, each framework's pick shown. You choose and lock one as today's focus.

Daily close captures your choice, tracks alignment with frameworks over time, and builds a decision streak.

## Stack

- Single-file React + Tailwind (CDN, no build step)
- Vercel serverless functions
- Upstash Redis for cross-device sync
- Bearer token auth (PRIO_TOKEN env var)
- localStorage stale-while-revalidate cache

## API

- `GET/PUT /api/tasks` — state blob `{ version, tasks[], energyLevel, locked }`
- `GET/POST /api/history` — daily close entries, 90-day rolling window

## Development

```bash
npm install
npm test          # vitest: scoring + consensus engine
vercel dev        # local dev server
vercel deploy     # deploy to production
```

## Environment variables (Vercel)

- `UPSTASH_REDIS_REST_URL` — Redis endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Redis auth
- `PRIO_TOKEN` — API bearer token (optional, skip for open access)
