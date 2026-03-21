# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Travel Journal App

## Project Overview

Full-stack MERN app for AI-enhanced travel journal entries with photos. The app is **not yet scaffolded** — both `server/` and `client/` need to be created first (see `CLAUDE_CODE_TUTOR.docx` Part 5).

## Architecture

- `client/` — React 18 + Vite (port 5173), Tailwind CSS
- `server/` — Node.js + Express REST API (port 5000)
- MongoDB Atlas — cloud database
- Cloudinary — image hosting
- Anthropic Claude API — six AI features (all server-side)
- Deployment — Vercel

## Key Commands

```bash
cd server && npm run dev     # start backend (port 5000)
cd client && npm run dev     # start frontend (port 5173)
cd client && npm run build   # production build
npm test                     # run all tests
npm run test:unit            # unit tests only
```

Deploy via `/deploy` skill.

## Code Style

- ES modules (`import`/`export`) throughout
- `async`/`await` over `.then()` chains
- Commit format: `feat:`, `fix:`, `chore:`, `test:`, `docs:`

## Testing Requirements

- All controllers: unit tests (mock the Anthropic SDK — never call the real API in CI)
- All API routes: integration tests
- Critical flows: E2E tests
- Coverage target: 80% lines, 75% branches

## Skills Available

- `/create-user-stories <feature>` — creates Trello cards
- `/run-tests`
- `/unit-test-on-deploy` — blocks deploy on failure
- `/create-release-notes <tag>`
- `/deploy` — Vercel push + GitHub Release
- `/check-coverage`

## Planned Directory Structure

```
server/
  src/
    config/anthropic.js       # Anthropic SDK singleton — import { anthropic } from here
    controllers/aiController.js
    middleware/rateLimit.js   # 10 req/min per user for all /api/ai/* routes
  tests/
    unit/
    integration/
  .env                        # ANTHROPIC_API_KEY, MONGODB_URI, JWT_SECRET, CLOUDINARY_*

client/
  src/
    api/axios.js              # Axios instance
    pages/                    # Home, EntryDetail, TripNarrative, Profile, SearchResults
    components/               # AIEntryEnhancer, DestinationBrief, ImageCarousel, MoodTimeline, etc.
    hooks/
```

## AI Integration

- **Fast tasks** (JSON extraction, streaming prose): `claude-3-5-haiku-20241022`
- **Vision / long-form synthesis**: `claude-3-5-sonnet-20241022`
- `ANTHROPIC_API_KEY` is **server-only** — never expose it to the React client

### The Six AI Endpoints

| # | Endpoint | Claude Capability |
|---|---|---|
| 1 | `POST /api/ai/enhance-entry` | Streaming prose rewrite |
| 2 | `POST /api/ai/location-insights` | JSON knowledge retrieval (cached in MongoDB) |
| 3 | `POST /api/ai/caption-photo` | Vision — Cloudinary URL input |
| 4 | `POST /api/ai/compile-trip` | Streaming long-form synthesis |
| 5 | `POST /api/ai/analyse-sentiment` | Batch JSON (Promise.all in groups of 5) |
| 6 | `POST /api/ai/nl-search` | JSON intent parsing → MongoDB query |

### Key SDK Patterns

**JSON mode** — `system: 'Return ONLY valid JSON. No markdown.'` then `JSON.parse(msg.content[0].text)`.

**Streaming** — `anthropic.messages.stream(...)`, emit `data: ${JSON.stringify({ chunk })}\n\n`, end with `data: [DONE]\n\n`.

**Vision** — `{ type: 'image', source: { type: 'url', url: cloudinaryUrl } }` as a content block.

**Batch** — process in groups of 5 with `Promise.all`; skip entries that already have the field cached.

**React consumer** — use `EventSource`; on `[DONE]` close it; append chunks to state incrementally.

## MongoDB Entry Schema (key fields)

```
body, location, date, author (ref User)
images[]:           { url, caption, altText }
locationInsights:   { etiquette, phrases[], currency, season, hiddenGem }
sentiment:          { score: "positive"|"neutral"|"negative", keywords: string[3] }
```

## Environment Variables

| Variable | Where |
|---|---|
| `ANTHROPIC_API_KEY` | `server/.env` + Vercel only (never CI/GitHub Secrets) |
| `MONGODB_URI` | `server/.env` + Vercel + GitHub Secrets |
| `JWT_SECRET` | `server/.env` + Vercel + GitHub Secrets |
| `CLOUDINARY_CLOUD_NAME` | `server/.env` + Vercel + GitHub Secrets |

## Hooks (`.claude/settings.local.json`)

- **PreToolUse `git push`** — blocks push if unit tests fail
- **PostToolUse `vercel --prod`** — creates GitHub Release automatically
- **Stop** — terminal bell when Claude finishes a task
