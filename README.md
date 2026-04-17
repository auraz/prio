# Priorities / Пріоритети

How do I prioritize P0 tasks across work and not-work? Three frameworks score the same tasks, disagree, and show which voice I'm following.

**About:** https://prio.kryklia.com/pr

## How it works

1. **Consequences x Deadline** ... what breaks if you don't? (1-9)
2. **Personal Importance x Impact Scope** ... does this align with who you want to be? (1-9)
3. **Energy Match** ... can you do this well right now? (2-4)

When frameworks agree: consensus banner, high confidence, lock as today's focus.
When they disagree: conflict state shows each framework's pick. You choose.

Daily close captures your choice, tracks alignment over time, and builds a decision streak. Morning retrospective asks: was yesterday's choice right?

## Design

Brutalist, typography-driven. Light theme on warm paper. No gradients, no shadows, no rounded corners, no emoji.

- **Display font**: Brygada 1918 (Ukrainian-Polish historical serif, 1918)
- **Body font**: Arsenal (Ukrainian-designed sans-serif)
- **Palette**: OKLCH warm neutrals, single red accent for urgency

References: government documents, newspaper ledgers, field notes, gov.uk.

## Stack

- Single-file React 18 + Tailwind CDN (no build step, Babel in browser)
- Vercel serverless functions
- Upstash Redis for cross-device sync
- Bearer token auth (PRIO_TOKEN env var)
- localStorage stale-while-revalidate cache
- PWA manifest for home screen install
- UK/EN language toggle (React Context i18n)

## API

- `GET/PUT /api/tasks` ... state blob `{ version, tasks[], energyLevel, locked }`
- `GET/POST /api/history` ... daily close entries, 90-day rolling window

## Testing

```bash
npm test    # 38 tests: scoring engine + UI components (vitest + testing-library)
```

- `lib/scoring.test.js` ... 17 tests: scoring formulas, consensus/conflict detection, tie-breaking
- `lib/ui.test.jsx` ... 21 tests: EnergyToggle, HeroBanner (3 states), MorningRetro, DailyClose, full PriorityMatrix integration (add/delete/consensus)

## Development

```bash
npm install
npm test          # vitest: scoring + UI tests
vercel dev        # local dev server
vercel deploy     # deploy to production
```

## Environment variables (Vercel)

- `UPSTASH_REDIS_REST_URL` ... Redis endpoint
- `UPSTASH_REDIS_REST_TOKEN` ... Redis auth
- `PRIO_TOKEN` ... API bearer token (optional, skip for open access)
