# Travel Journal App — Complete Claude Code Guide
### Build a Full-Stack MERN App with AI, Skills, Agents, Hooks, and MCP
*March 2026*

---

## Table of Contents

1. [What You Will Build](#1-what-you-will-build)
2. [Prerequisites](#2-prerequisites)
3. [Environment Setup](#3-environment-setup)
4. [Create All Skills First](#4-create-all-skills-first)
5. [Trello MCP Setup + Populate Backlog](#5-trello-mcp-setup)
6. [Configure Hooks](#6-configure-hooks)
7. [UI Prototype with Pencil MCP](#7-ui-prototype-with-pencil-mcp)
8. [Scaffold the Backend](#8-scaffold-the-backend)
9. [Scaffold the Frontend](#9-scaffold-the-frontend)
10. [Write the Comprehensive Test Suite](#10-write-the-comprehensive-test-suite)
11. [GitHub Actions CI/CD](#11-github-actions-cicd)
12. [The Feature Creation Workflow](#12-the-feature-creation-workflow)
13. [The Six AI Features](#13-the-six-ai-features)
14. [Push to GitHub](#14-push-to-github)
15. [Deploy to Vercel](#15-deploy-to-vercel)
16. [Release Tags and Notes](#16-release-tags-and-notes)
17. [Skills Deep Dive](#17-skills-deep-dive)
18. [Agents Deep Dive](#18-agents-deep-dive)
19. [Hooks Deep Dive](#19-hooks-deep-dive)
20. [Appendices](#20-appendices)

---

## 1. What You Will Build

A full-stack Travel Journal app where users register, log in, create journal entries with photos, and get AI-powered insights about their destinations.

### Core Features

| Feature | Description |
|---------|-------------|
| Auth | JWT register, login, logout with profile picture |
| Journal Entries | Create, view, delete entries with title, location, date, body |
| Photo Upload | Up to 3 photos per entry via Cloudinary |
| Image Carousel | Viewer per entry |
| Search | Find entries by title, location, or date |
| Protected Routes | Author-only actions |
| **6 AI Features** | Claude-powered enhancements (see Part 13) |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite (port 5173) + Tailwind CSS |
| Backend | Node.js + Express REST API (port 5000) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| Images | Cloudinary |
| AI | Anthropic Claude API (server-side only) |
| Unit Testing | Vitest + React Testing Library |
| Integration | Supertest + mongodb-memory-server |
| E2E | Playwright |
| CI/CD | GitHub Actions |
| Deployment | Vercel |

### Claude Code Features You Will Learn

| Feature | Used In | What It Does |
|---------|---------|-------------|
| Skills | Throughout | Custom slash commands for repetitive tasks |
| Agents | Part 18 | Autonomous sub-processes with scoped tools |
| Hooks | Part 19 | Auto-run shell commands on Claude Code events |
| MCP — Trello | Parts 5, 12 | Create and manage user stories from the terminal |
| MCP — Pencil | Part 7 | Generate UI prototypes with a single prompt |

---

## 2. Prerequisites

Before starting, verify you have everything installed:

```bash
node --version          # must be 18+
git --version
gh auth login           # GitHub CLI authenticated
vercel --version        # npm install -g vercel
```

You also need accounts on:
- **GitHub** — repository created
- **MongoDB Atlas** — free tier cluster URI ready
- **Cloudinary** — free tier API key and secret ready
- **Trello** — empty board named "Travel Journal App"
- **Vercel** — account created

Install Claude Code:
```bash
npm install -g @anthropic-ai/claude-code
claude --version
claude auth login
```

---

## 3. Environment Setup

### Step 1 — Initialise the Repository

```bash
cd Travel-App
git init
mkdir -p .claude/commands .claude/agents .github/workflows
```

Create `.gitignore` at the project root:
```
node_modules/
.env
dist/
.vercel/
.claude/activity.log
```

### Step 2 — Create CLAUDE.md

`CLAUDE.md` is the most important file in a Claude Code project. It gives Claude context about your project, commands, and expectations. Claude reads it automatically every session.

Create it at the project root:

```markdown
# Travel Journal App

## Project Overview
Full-stack MERN app for AI-enhanced travel journal entries with photos.

## Architecture
- client/ — React 18 + Vite (port 5173), Tailwind CSS
- server/ — Node.js + Express REST API (port 5000)
- MongoDB Atlas — cloud database
- Cloudinary — image hosting
- Anthropic Claude API — six AI features (server-side only)

## Key Commands
- Start backend:  cd server && npm run dev
- Start frontend: cd client && npm run dev
- Run all tests:  npm test
- Run unit tests: npm run test:unit
- Build:          cd client && npm run build
- Deploy:         /deploy

## Code Style
- ES modules (import/export) throughout
- async/await over .then() chains
- Commit format: feat:, fix:, chore:, test:, docs:

## Testing Requirements
- All controllers: unit tests (mock Anthropic SDK — never call real API in CI)
- All API routes: integration tests
- Critical flows: E2E tests
- Coverage target: 80% lines, 75% branches

## Skills Available
- /create-user-stories <feature>
- /run-tests
- /unit-test-on-deploy
- /create-release-notes <tag>
- /deploy
- /check-coverage
- /scaffold-server
- /scaffold-client
```

### Step 3 — Configure Permissions

Create `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(npx *)",
      "Bash(vercel *)",
      "Bash(gh *)"
    ]
  }
}
```

### Step 4 — Open Claude Code

```bash
claude
```

Claude reads `CLAUDE.md` automatically. Type `/help` to see available skills.

---

## 4. Create All Skills First

> **Why first?** Skills automate everything that follows — scaffolding, testing, deployment. Create them once here and every subsequent step becomes a single command.

Skills are Markdown files in `.claude/commands/`. The exact format:

```markdown
---
description: One-line summary shown in /help
allowed-tools: Bash, Read, Write, Grep
argument-hint: <placeholder shown in CLI>
---

You are a [role]. When invoked with $ARGUMENTS, you must:
1. [Explicit step with exact commands]
2. [Step two]

Always output:
## Result
[structured output]
```

### Skill 1 — `/scaffold-server`

Create `.claude/commands/scaffold-server.md`:

```markdown
---
description: Scaffold the complete Express backend with all models, controllers, routes, and config
allowed-tools: Bash, Write
---

You are a backend engineer. Create the full server/ directory structure for a MERN Travel Journal app:

1. Run: cd server && npm init -y
2. Run: npm install express mongoose dotenv cors bcryptjs jsonwebtoken multer cloudinary multer-storage-cloudinary @anthropic-ai/sdk
3. Run: npm install -D vitest supertest mongodb-memory-server nodemon @vitest/coverage-v8

4. Add to server/package.json scripts:
   "dev": "nodemon src/index.js"
   "start": "node src/index.js"
   "test": "vitest run"
   "test:unit": "vitest run --testPathPattern=unit"
   "test:coverage": "vitest run --coverage"

5. Create all files in this structure:
   server/src/
     config/db.js           — mongoose connect
     config/cloudinary.js   — cloudinary v2 config
     config/anthropic.js    — Anthropic SDK singleton: export { anthropic }
     models/User.js         — name, email, password, profilePic, timestamps
     models/Entry.js        — title, location, date, body, images[], author ref,
                              locationInsights{}, sentiment{}, timestamps,
                              $text index on title+location+body
     controllers/authController.js    — register, login
     controllers/entryController.js   — getEntries, createEntry, deleteEntry, searchEntries
     controllers/aiController.js      — enhanceEntry, locationInsights, captionPhoto,
                                        compileTrip, analyseSentiment, nlSearch
     routes/authRoutes.js
     routes/entryRoutes.js
     routes/aiRoutes.js
     middleware/authMiddleware.js      — JWT protect middleware
     middleware/rateLimit.js           — 10 req/min per user for /api/ai/* routes
     index.js
   server/tests/
     unit/
     integration/
   server/.env.example    — ANTHROPIC_API_KEY, MONGODB_URI, JWT_SECRET, CLOUDINARY_*

Output: ## Server scaffolded successfully — list all files created
```

### Skill 2 — `/scaffold-client`

Create `.claude/commands/scaffold-client.md`:

```markdown
---
description: Scaffold the complete React + Vite + Tailwind frontend with all pages and components
allowed-tools: Bash, Write
---

You are a frontend engineer. Scaffold the full client/ directory for a MERN Travel Journal app:

1. Run: npm create vite@latest client -- --template react
2. Run: cd client && npm install react-router-dom axios react-toastify
3. Run: npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/ui tailwindcss @tailwindcss/vite

4. Configure Tailwind in vite.config.js
5. Add to client/package.json scripts:
   "test": "vitest"
   "test:unit": "vitest run"
   "test:coverage": "vitest run --coverage"

6. Create all files in this structure:
   client/src/
     api/axios.js           — Axios instance with baseURL + auth header interceptor
     context/AuthContext.jsx
     components/
       Navbar.jsx
       EntryCard.jsx
       ImageCarousel.jsx
       ProtectedRoute.jsx
       AIEntryEnhancer.jsx
       DestinationBrief.jsx
       MoodTimeline.jsx
     pages/
       Login.jsx
       Register.jsx
       Home.jsx
       EntryDetail.jsx
       CreateEntry.jsx
       TripNarrative.jsx
       Profile.jsx
       SearchResults.jsx
     hooks/
       useSSE.js            — EventSource hook: append chunks, close on [DONE]
   client/src/App.jsx       — BrowserRouter + all routes

Output: ## Client scaffolded successfully — list all files created
```

### Skill 3 — `/create-user-stories`

Create `.claude/commands/create-user-stories.md`:

```markdown
---
description: Generate Gherkin user stories and create Trello cards for a feature
allowed-tools: Bash
argument-hint: <feature description>
---

You are a product manager. When invoked with $ARGUMENTS:

1. Parse the feature into 3-5 user stories: "As a [role], I want [action], so that [benefit]"
2. Write Given/When/Then acceptance criteria for each story
3. Create a Trello card per story in the Backlog list with label "Story"

Output:
## Created Stories for: $ARGUMENTS

| # | Story | Trello Card |
|---|-------|-------------|
| 1 | As a... | [URL] |

## Acceptance Criteria
[Given/When/Then per story]
```

### Skill 4 — `/run-tests`

Create `.claude/commands/run-tests.md`:

```markdown
---
description: Run the full test suite (unit + integration + E2E) and report results
allowed-tools: Bash
---

Run the full test suite in sequence:

1. cd server && npm test -- --reporter=verbose
2. cd client && npm test -- --run --reporter=verbose
3. npx playwright test --reporter=list

Output:
## Test Results — [timestamp]

| Suite         | Passed | Failed | Skipped | Duration |
|---------------|--------|--------|---------|----------|
| Unit (server) | X      | X      | X       | Xs       |
| Unit (client) | X      | X      | X       | Xs       |
| Integration   | X      | X      | X       | Xs       |
| E2E           | X      | X      | X       | Xs       |

List each failure with file:line and error message.

Final status: PASS or FAIL

Exit with error code 1 if any failures > 0.
```

### Skill 5 — `/unit-test-on-deploy`

Create `.claude/commands/unit-test-on-deploy.md`:

```markdown
---
description: Run unit tests before deployment; block deploy if any fail
allowed-tools: Bash
---

1. cd server && npm run test:unit -- --run
2. cd client && npm run test:unit -- --run

If ALL pass output:
## Pre-Deploy Check: PASSED
- Server unit tests: X passed
- Client unit tests: X passed
- Proceeding with deployment...

If ANY fail output:
## Pre-Deploy Check: FAILED
- [test name] at [file:line]
- DEPLOYMENT BLOCKED. Fix failing tests before deploying.

Exit with code 1 to halt deployment on failure.
```

### Skill 6 — `/check-coverage`

Create `.claude/commands/check-coverage.md`:

```markdown
---
description: Run tests with coverage and flag files below 80% lines / 75% branches
allowed-tools: Bash
---

1. cd server && npm run test:coverage
2. cd client && npm run test:coverage

Flag any file where: line coverage < 80% OR branch coverage < 75%

Output:
## Coverage Report

| File                              | Lines | Branches | Status |
|-----------------------------------|-------|----------|--------|
| src/controllers/authController    | 92%   | 88%      | PASS   |
| src/controllers/entryController   | 65%   | 60%      | FAIL   |

For each FAIL: list the untested functions by name.
```

### Skill 7 — `/create-release-notes`

Create `.claude/commands/create-release-notes.md`:

```markdown
---
description: Generate release notes from git commits and create a GitHub Release
allowed-tools: Bash
argument-hint: <version tag e.g. v1.0.0>
---

1. git tag --sort=-version:refname | head -2   (get current and previous tag)
2. git log <prev>..<current> --oneline --no-merges
3. Categorise commits:
   - feat:  → New Features
   - fix:   → Bug Fixes
   - chore: → Maintenance
4. gh release create $ARGUMENTS --notes "..." --title "Release $ARGUMENTS"

Output the GitHub Release URL.
```

### Skill 8 — `/deploy`

Create `.claude/commands/deploy.md`:

```markdown
---
description: Run pre-deploy tests, build, deploy to Vercel, and create a GitHub Release
allowed-tools: Bash
---

Step 1 — Unit test gate:
  cd server && npm run test:unit -- --run
  cd client && npm run test:unit -- --run
  If any fail: DEPLOYMENT BLOCKED — stop here.

Step 2 — Production build:
  cd client && npm run build

Step 3 — Deploy:
  vercel --prod --confirm

Step 4 — Capture deployment URL from vercel output

Step 5 — Create release:
  TAG=$(git tag --sort=-version:refname | head -1)
  gh release create $TAG --generate-notes

Output:
## Deployment Complete
- URL: [vercel URL]
- Release: [GitHub Release URL]
```

---

## 5. Trello MCP Setup

### What is MCP?

MCP (Model Context Protocol) is an open standard that lets Claude Code connect to external services. Once configured, Claude calls MCP tools exactly like built-in tools — no manual switching between apps.

### Step 1 — Get Trello API Credentials

1. Go to [https://trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Click **New Power-Up** and name it "Claude Code Integration"
3. Copy your **API Key**
4. Click **Generate Token**, authorise, copy the **Token**

### Step 2 — Install the Trello MCP Server

```bash
npm install -g mcp-server-trello
```

### Step 3 — Add to Claude Code MCP Config

Edit `~/.claude/settings.json` (global settings — never commit this file):

```json
{
  "mcpServers": {
    "trello": {
      "command": "npx",
      "args": ["-y", "mcp-server-trello"],
      "env": {
        "TRELLO_API_KEY": "YOUR_API_KEY_HERE",
        "TRELLO_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

> **Warning:** Never commit this file — it contains credentials.

### Step 4 — Verify Connection

```bash
claude
/mcp
```

You should see `trello` listed as a connected MCP server.

### Step 5 — Set Up Your Trello Board

In Claude Code chat, say:

```
Create 4 lists on the Travel Journal App board: Backlog, In Progress, In Review, Done
```

Claude calls the Trello MCP and creates the lists automatically.

### Step 6 — Populate the Backlog with `/create-user-stories`

Now that your board has lists and the skill is created (Part 4, Skill 3), run it once per core feature to generate Gherkin user stories **and** create the Trello cards automatically in one command.

Type each of these in Claude Code chat, one at a time, and wait for the Trello cards to appear before running the next:

```
/create-user-stories "User authentication with JWT — register, login, logout with profile picture upload"
```

```
/create-user-stories "Journal entry management — create, view, delete entries with title, location, date, body text, up to 3 photos"
```

```
/create-user-stories "Photo upload — attach up to 3 images per entry via Cloudinary, view in carousel"
```

```
/create-user-stories "Search and filter — find entries by title, location, or date with real-time filtering"
```

```
/create-user-stories "User profile — view profile picture, personal entry history, and mood timeline"
```

After all five commands, your Trello Backlog will look like this:

| Story | Label | List |
|-------|-------|------|
| As a user, I want to register so that I can create a private journal | Story | Backlog |
| As a user, I want to log in so that I can access my entries | Story | Backlog |
| As a traveller, I want to create a journal entry so that I can record my trip | Story | Backlog |
| As a traveller, I want to attach photos so that I can visualise my memories | Story | Backlog |
| ... and so on for all features | Story | Backlog |

### How the Skill Works

When you type `/create-user-stories "feature description"`:

```
/create-user-stories "User authentication..."
       |
       Claude parses $ARGUMENTS
             |
             Generates 3-5 stories in "As a / I want / so that" format
             Writes Given/When/Then acceptance criteria per story
                   |
                   Calls Trello MCP tool: mcp__trello__add_card_to_list
                         |
                         Card created in Backlog with label "Story"
                         Returns Trello card URL
       |
       Output shown in Claude Code chat:
       ## Created Stories for: User authentication...
       | # | Story | Trello Card |
       | 1 | As a user... | https://trello.com/c/... |
```

### Moving Cards via MCP

As you work through a story, tell Claude to move it rather than doing it manually in Trello:

```
Move the registration card to In Progress
```

```
Move the registration cards to Done
```

Claude calls the Trello MCP and updates the card — no browser switching needed.

---

## 6. Configure Hooks

Hooks run shell commands **automatically** when specific Claude Code events happen. Configure them once here — they protect every push and automate every deploy for the rest of the project.

Update `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(git *)",
      "Bash(npx *)",
      "Bash(vercel *)",
      "Bash(gh *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git push*)",
        "hooks": [{
          "type": "command",
          "command": "cd \"$CLAUDE_PROJECT_DIR\" && npm run test:unit -- --run 2>&1; if [ $? -ne 0 ]; then echo 'BLOCKED: unit tests failed.' >&2; exit 2; fi"
        }]
      },
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "echo \"[$(date '+%Y-%m-%d %H:%M:%S')] WRITE: $CLAUDE_TOOL_INPUT_FILE_PATH\" >> \"$CLAUDE_PROJECT_DIR/.claude/activity.log\""
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash(vercel --prod*)",
        "hooks": [{
          "type": "command",
          "command": "cd \"$CLAUDE_PROJECT_DIR\" && TAG=$(git tag --sort=-version:refname | head -1) && PREV=$(git tag --sort=-version:refname | sed -n '2p') && echo \"## Release $TAG\" > /tmp/rn.md && git log $PREV..$TAG --oneline --no-merges >> /tmp/rn.md && gh release create $TAG --notes-file /tmp/rn.md --title \"Release $TAG\""
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "printf '\\a' && echo '[Claude Code] Task complete.'"
        }]
      }
    ]
  }
}
```

### What Each Hook Does

| Event | Matcher | What Happens | Blocks? |
|-------|---------|-------------|---------|
| `PreToolUse` | `git push*` | Runs unit tests silently | Yes — exit 2 |
| `PreToolUse` | `Write` | Logs file writes to `activity.log` | No |
| `PostToolUse` | `vercel --prod*` | Creates GitHub Release automatically | No |
| `Stop` | (all) | Terminal bell when Claude finishes | No |

---

## 7. UI Prototype with Pencil MCP

Pencil MCP is pre-configured in your environment. One structured prompt generates all UI screens — no manual design work needed.

### Step 1 — Create a New Design File

In Claude Code chat, say:
```
Use the Pencil MCP to create a new design file for the Travel Journal app.
```

### Step 2 — Load the Style Guide

```
Get web-app design guidelines for a Travel Journal app with a warm earthy feel.
```

### Step 3 — Generate All Screens (One Prompt)

Paste this entire prompt into Claude Code chat:

```
Design a Travel Journal web app with exactly 5 screens:

Screen 1 — Login/Register:
Centered card, tab switcher Login/Register, email + password fields, primary CTA,
"Forgot password?" link.

Screen 2 — Home Feed:
Navbar (logo left, search center, avatar right), masonry grid of entry cards (cover photo,
title, location, date), floating "+" button bottom-right.

Screen 3 — Entry Detail:
Full-width image carousel, back arrow, title H1, location badge, date, body text,
DestinationBrief collapsible card, red Delete button (author only).

Screen 4 — Create Entry (multi-step):
Step indicator 1/3 2/3 3/3. Step 1: title, location, date. Step 2: rich text body.
Step 3: 3-slot photo upload zone. Next/Back buttons.

Screen 5 — Search Results:
Same navbar with pre-filled search term, active filter chips,
filtered masonry grid, empty state illustration.

Colors: terracotta #C0622A, sand #F5E6C8, forest green #3D6B4F.
Typography: Playfair Display headings, Inter body.
```

Claude calls `batch_design` and generates all 5 screens automatically.

### Step 4 — Review and Export

```
Take a screenshot of all designed screens.
```

For fixes, say: `On Screen 2, make card titles larger.`

```
Export all 5 screens as PNG to client/src/design-reference/
```

> **Key lesson:** One structured prompt = complete prototype. Manual tweaks only for refinements.

---

## 8. Scaffold the Backend

Now use the skill you created in Part 4:

```
/scaffold-server
```

Claude creates the entire `server/` directory — all models, controllers, routes, config, and test folders — in one go. No manual folder creation needed.

### Verify the Structure

After the skill completes, your `server/` should look like:

```
server/
  src/
    config/
      db.js
      cloudinary.js
      anthropic.js          <- Anthropic SDK singleton
    controllers/
      authController.js
      entryController.js
      aiController.js       <- all 6 AI endpoints
    middleware/
      authMiddleware.js
      rateLimit.js          <- 10 req/min per user
    models/
      User.js
      Entry.js
    routes/
      authRoutes.js
      entryRoutes.js
      aiRoutes.js
    index.js
  tests/
    unit/
    integration/
  .env.example
  package.json
```

### Create `server/.env`

```env
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=generate-with-crypto-randomBytes-64
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

> `.env` is in `.gitignore` — never commit it.

---

## 9. Scaffold the Frontend

```
/scaffold-client
```

Claude creates the entire `client/` directory — all pages, components, hooks, and config.

### Verify the Structure

```
client/
  src/
    api/
      axios.js              <- Axios instance with auth interceptor
    context/
      AuthContext.jsx
    components/
      Navbar.jsx
      EntryCard.jsx
      ImageCarousel.jsx
      ProtectedRoute.jsx
      AIEntryEnhancer.jsx
      DestinationBrief.jsx
      MoodTimeline.jsx
    pages/
      Login.jsx
      Register.jsx
      Home.jsx
      EntryDetail.jsx
      CreateEntry.jsx
      TripNarrative.jsx
      Profile.jsx
      SearchResults.jsx
    hooks/
      useSSE.js
    App.jsx
  design-reference/
  package.json
  vite.config.js
```

---

## 10. Write the Comprehensive Test Suite

> **Important distinction:**
>
> - **This section** = Claude Code writes the test **files** to disk (done once per layer)
> - **`/run-tests` skill** = executes those files and reports results (done repeatedly, any time)
>
> They never overlap. One writes, one runs.

### How to Create the Tests

Paste each prompt below into Claude Code chat **once**, in order. Wait for Claude to confirm files are written before moving to the next prompt.

---

### 10.1 — Backend Unit Tests

Paste this prompt into Claude Code:

```
Write comprehensive Vitest unit tests in server/tests/unit/.
Mock ALL external dependencies (mongoose models, Anthropic SDK, bcryptjs, jsonwebtoken).
Never call the real Anthropic API — always vi.mock() it.

Create authController.test.js with these cases:
- register: 201 + token on success
- register: 409 on duplicate email
- register: 400 on missing fields
- register: bcrypt.hash called with correct rounds (10)
- register: JWT signed with correct payload shape { id, email }
- login: 200 + token on valid credentials
- login: 401 on wrong password
- login: 404 on unknown email

Create entryController.test.js with these cases:
- getEntries: returns only entries for authenticated user
- getEntries: populates author field
- createEntry: saves entry to DB and returns 201
- createEntry: uploads images to Cloudinary
- deleteEntry: author can delete own entry (204)
- deleteEntry: non-author gets 403
- deleteEntry: entry not found gets 404
- searchEntries: applies $text search with correct query
- searchEntries: respects author filter

Create aiController.test.js for ALL SIX endpoints:

enhanceEntry:
- Sets Content-Type: text/event-stream header
- Streams text chunks via SSE (verify res.write called with "data: " prefix)
- Ends stream with "data: [DONE]\n\n"
- SDK error triggers error event on the stream
- Unauthenticated request returns 401

locationInsights:
- Cache hit: Entry.locationInsights already populated → returns it, Anthropic NOT called
- Cache miss: Anthropic called, result saved to entry.locationInsights, then returned
- Invalid JSON from Claude: returns 500 with descriptive error, does not throw unhandled

captionPhoto:
- Anthropic called with correct vision content block ({ type:'image', source:{type:'url'} })
- Entry.images[imageIndex] updated with caption and altText
- Non-author user gets 403

compileTrip:
- Entries sorted ascending by date before being sent to Claude
- Entry belonging to different user causes 403
- SSE headers set correctly (Content-Type, Cache-Control, Connection)

analyseSentiment:
- Entries already having sentiment field are skipped (Anthropic not called for them)
- Entries processed in batches of exactly 5 (verify Promise.all call count)
- Invalid JSON for one entry: that entry skipped gracefully, others still processed
- Returns all entries with sentiment data populated

nlSearch:
- Anthropic called exactly once with the user query
- MongoDB query built correctly from parsed JSON filters
- Entries returned sorted by textScore descending
- Malformed JSON from Claude returns 500 with descriptive error
```

Wait for Claude to write the files, then confirm they exist before continuing.

---

### 10.2 — Frontend Unit Tests

Paste this prompt into Claude Code:

```
Write comprehensive Vitest + React Testing Library unit tests in client/src/.
Place test files alongside their components (Login.test.jsx next to Login.jsx, etc.).

Login.test.jsx:
- Renders email and password inputs
- Renders submit button
- Shows error message on failed login (mock axios to reject)
- Calls login() from AuthContext on success
- Redirects to / on successful login

Register.test.jsx:
- Renders name, email, password inputs
- Validates password must be 8+ characters (client-side)
- Shows 409 error when email already exists

Home.test.jsx:
- Renders loading skeleton while fetching entries
- Renders entry cards when data returns
- Shows empty state when no entries exist
- Search input filters visible cards

EntryCard.test.jsx:
- Renders title, location, and date
- Renders cover image when images[] is not empty
- Clicking card navigates to /entry/:id

AIEntryEnhancer.test.jsx:
- Shows "Enhance" button
- On click: calls POST /api/ai/enhance-entry
- Streams incoming chunks into the text area incrementally
- Shows loading state during streaming
- Closes EventSource when [DONE] received

DestinationBrief.test.jsx:
- Fetches location insights on mount
- Renders 5 accordion sections (etiquette, phrases, currency, season, hiddenGem)
- Toggling accordion does NOT re-fetch (result cached in state)
- Shows loading skeleton while fetching

useSSE.test.js:
- Appends chunks to state as they arrive
- Clears state when stream is reset
- Closes EventSource on [DONE]
- Handles stream errors gracefully
```

Wait for Claude to write the files.

---

### 10.3 — Integration Tests

Paste this prompt into Claude Code:

```
Write integration tests in server/tests/integration/ using Supertest + mongodb-memory-server.
Use a real in-memory MongoDB instance — no mocking of mongoose.
Mock only the Anthropic SDK and Cloudinary.

auth.integration.test.js:
- POST /api/auth/register: 201 + token + user object on success
- POST /api/auth/register: 409 when email already exists
- POST /api/auth/register: 400 when required fields missing
- POST /api/auth/login: 200 + token on valid credentials
- POST /api/auth/login: 401 on wrong password

entries.integration.test.js:
- GET /api/entries: 401 without token
- GET /api/entries: 200 + array of entries for authenticated user
- POST /api/entries: 201 + created entry (mock Cloudinary upload)
- DELETE /api/entries/:id: 204 when requester is author
- DELETE /api/entries/:id: 403 when requester is not author
- GET /api/entries/search?q=paris: returns matching entries

ai.integration.test.js (mock Anthropic SDK):
- POST /api/ai/location-insights: 200 + JSON briefing on cache miss
- POST /api/ai/location-insights: 200 + cached data, Anthropic not called on cache hit
- POST /api/ai/enhance-entry: responds with text/event-stream content type
- POST /api/ai/analyse-sentiment: 200 + entries with sentiment populated
- POST /api/ai/nl-search: 200 + filtered entries matching query intent
- All /api/ai/* routes: 429 after 10 requests per minute (rate limit)
- All /api/ai/* routes: 401 without auth token
```

Wait for Claude to write the files.

---

### 10.4 — E2E Tests (Playwright)

First, install Playwright:

```bash
npm init playwright@latest
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: [
    { command: 'npm run dev', cwd: './server', port: 5000 },
    { command: 'npm run dev', cwd: './client', port: 5173, reuseExistingServer: true }
  ]
});
```

Then paste this prompt into Claude Code:

```
Write Playwright E2E tests in e2e/.

auth.spec.ts:
- User can register with valid details and lands on Home feed
- User sees validation error for duplicate email
- User can log in with existing credentials
- Logged-out user is redirected to /login when accessing /

entries.spec.ts:
- Logged-in user can create a new entry (fill all 3 steps, publish)
- Created entry appears on Home feed
- User can open entry detail page
- Author can delete their own entry
- Deleted entry disappears from Home feed
- Non-author does not see Delete button on entry detail

search.spec.ts:
- Typing in search box filters entry cards in real time
- Clearing search shows all entries again
- Searching with no results shows empty state

ai.spec.ts (use Playwright route interception to mock AI responses):
- Clicking "Enhance Entry" opens AI enhancer and streams text
- DestinationBrief collapsible card appears on Entry Detail
- Toggling DestinationBrief sections does not trigger new network requests
```

Wait for Claude to write the files.

---

### Summary: Write Once, Run Many Times

| When | What you do | What Claude Code does |
|------|------------|----------------------|
| After `/scaffold-server` | Paste 10.1 prompt | Writes `server/tests/unit/*.test.js` |
| After `/scaffold-client` | Paste 10.2 prompt | Writes `client/src/**/*.test.jsx` |
| After both running | Paste 10.3 prompt | Writes `server/tests/integration/*.test.js` |
| After all above | Paste 10.4 prompt | Writes `e2e/*.spec.ts` |

Once written, these files live in your repo permanently. To run them at any time:

```
/run-tests
```

---

## 11. GitHub Actions CI/CD

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install server deps
        run: cd server && npm ci

      - name: Install client deps
        run: cd client && npm ci

      - name: Server unit tests
        run: cd server && npm run test:unit
        env:
          JWT_SECRET: test-secret-for-ci

      - name: Client unit tests
        run: cd client && npm test -- --run

      - name: Integration tests
        run: cd server && npm test
        env:
          JWT_SECRET: test-secret-for-ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        run: npx playwright test
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          CLOUDINARY_CLOUD_NAME: ${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_API_KEY: ${{ secrets.CLOUDINARY_API_KEY }}
          CLOUDINARY_API_SECRET: ${{ secrets.CLOUDINARY_API_SECRET }}
```

### GitHub Secrets to Add

Go to your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | How to generate |
|--------|----------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |

> **Never add `ANTHROPIC_API_KEY` to GitHub Secrets.** The real API is never called in CI — all Anthropic SDK calls are mocked in tests.

### Branch Protection

Settings → Branches → Add rule for `main`:
- Require status checks to pass: **CI / test**
- Require branches to be up to date before merging

### Test with a Pull Request

```bash
git checkout -b feature/initial-setup
git add .
git commit -m "feat: initial MERN app setup with tests"
git push origin feature/initial-setup
gh pr create --title "Initial MERN app setup" --body "Adds server, client, and test infrastructure"
```

---

## 12. The Feature Creation Workflow

Every new feature follows this exact loop — **in this order**:

```
1. /create-user-stories <feature>      SKILL  — once per feature
      |
      Wait for Trello cards to be created
      |
2. [backend prompt] to Claude Code     PROMPT — once per feature
      |
      Wait for controller + route files to be written
      |
3. [frontend prompt] to Claude Code    PROMPT — once per feature
      |
      Wait for component files to be written
      |
4. /run-tests                          SKILL  — repeat until green
      |
      Fix failures by describing to Claude, then repeat step 4
      |
5. /check-coverage                     SKILL  — once before push
      |
6. commit and push                     MANUAL or Claude Code chat
      |
      Hook fires automatically: unit tests gate
      Push blocked if red, proceeds if green
      |
7. /deploy                             SKILL  — once per release
      |
      Tests -> build -> Vercel -> GitHub Release
```

### How Many Prompts Per Feature?

**3 separate prompts, in order** — not all at once:

| Prompt | What you type | Why separate |
|--------|--------------|-------------|
| 1 — User Stories | `/create-user-stories "..."` | Skill must complete; sets acceptance criteria |
| 2 — Backend | `Create POST /api/...` | Defines the API contract the frontend will consume |
| 3 — Frontend | `Create client/src/components/...` | Depends on the exact API shape from Prompt 2 |

> If you send backend + frontend at once, Claude guesses the API contract and often gets it wrong.
>
> **Exception:** You can combine Prompts 2 + 3 if you explicitly define the full request/response contract in one message.

### What Is a Skill vs a Plain Prompt?

| Action | Type | Frequency |
|--------|------|-----------|
| Scaffold folders/files | Skill (`/scaffold-*`) | **Once ever** |
| Write test files (Part 10) | Plain Claude prompt | **Once per layer** |
| Create Trello stories | Skill (`/create-user-stories`) | **Once per feature** |
| Write backend code | Plain Claude prompt | **Once per feature** |
| Write frontend code | Plain Claude prompt | **Once per feature** |
| Run tests | Skill (`/run-tests`) | **Many times** during dev |
| Check coverage | Skill (`/check-coverage`) | Once before deploy |
| Commit + push | Manual or Claude Code chat | After every feature |
| Deploy | Skill (`/deploy`) | Once per release |
| Release notes | Skill (`/create-release-notes`) | Once per tag |

### Automatic Steps — Zero Invocation Needed

| Trigger | What Happens Automatically |
|---------|--------------------------|
| `git push` | Unit tests run; push blocked if red |
| `vercel --prod` | GitHub Release created |
| Claude finishes any task | Terminal bell rings |

---

## 13. The Six AI Features

### AI Model Selection

| Task | Model |
|------|-------|
| Fast tasks (JSON extraction, streaming prose) | `claude-3-5-haiku-20241022` |
| Vision, long-form synthesis | `claude-3-5-sonnet-20241022` |

> `ANTHROPIC_API_KEY` is **server-only** — never expose it to the React client.

### SDK Patterns

**JSON mode:**
```javascript
system: 'Return ONLY valid JSON. No markdown.'
// then: JSON.parse(msg.content[0].text)
```

**Streaming:**
```javascript
anthropic.messages.stream(...)
// emit:  data: ${JSON.stringify({ chunk })}\n\n
// end:   data: [DONE]\n\n
```

**Vision:**
```javascript
{ type: 'image', source: { type: 'url', url: cloudinaryUrl } }
```

**Batch (groups of 5):**
```javascript
Promise.all(batch.map(entry => callClaude(entry)))
// skip entries that already have the field cached
```

**React SSE consumer:**
```javascript
// Use EventSource; on [DONE] close it; append chunks to state
```

---

### Feature 1 — AI Entry Enhancer (Streaming Prose)

**Endpoint:** `POST /api/ai/enhance-entry` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "AI Entry Enhancer — rewrites a journal entry body with richer prose
using streaming SSE so the user sees words appearing in real time"
```

**Backend prompt (send separately, wait for files):**
```
Create POST /api/ai/enhance-entry in server/src/controllers/aiController.js.
Accept { body, location, date } in req.body. Protect with authMiddleware + aiRateLimit.
Set SSE headers: Content-Type text/event-stream, Cache-Control no-cache, Connection keep-alive.
Call claude-3-5-haiku-20241022 with anthropic.messages.stream().
On each text delta: res.write("data: " + JSON.stringify({ chunk: text }) + "\n\n").
On stream end: res.write("data: [DONE]\n\n") then res.end().
On SDK error: res.write("event: error\ndata: " + JSON.stringify({ error: msg }) + "\n\n").
```

**Frontend prompt (send separately after backend is written):**
```
Create client/src/components/AIEntryEnhancer.jsx.
Props: { entryId, originalBody, onAccept }.
Show "Enhance with AI" button. On click, open EventSource using useSSE hook.
Append each chunk to a preview textarea incrementally.
Show loading spinner during streaming.
On [DONE]: show "Accept" and "Discard" buttons. "Accept" calls onAccept(enhancedText).
Place below entry body in EntryDetail.jsx.
```

---

### Feature 2 — Smart Location Insights (JSON + Cache)

**Endpoint:** `POST /api/ai/location-insights` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "Smart Location Insights — location triggers a destination briefing
(etiquette, phrases, currency, season, hidden gem) stored in MongoDB and shown as a
collapsible card on Entry Detail"
```

**Backend prompt:**
```
Create POST /api/ai/location-insights in aiController.js.
Accept { location, entryId }. Protect with authMiddleware + aiRateLimit.
If Entry.locationInsights is populated: return it immediately (cache hit, skip Claude).
Otherwise call claude-3-5-haiku-20241022 with system: "Return ONLY valid JSON. No markdown."
JSON schema: { etiquette: string, phrases: [{phrase, pronunciation, meaning}],
currency: string, season: string, hiddenGem: string }.
Parse JSON. On parse error: return 500 "Claude returned invalid JSON".
Save to entry.locationInsights and return it.
```

**Frontend prompt:**
```
Create client/src/components/DestinationBrief.jsx.
Props: { entryId, location }. On mount call POST /api/ai/location-insights.
Render a collapsible card with 5 accordion sections: etiquette, phrases, currency,
season, hiddenGem. Show loading skeleton while fetching.
Cache result in state — toggling accordion must NOT re-fetch.
Place between image carousel and entry body in EntryDetail.jsx.
```

---

### Feature 3 — AI Photo Captions (Vision)

**Endpoint:** `POST /api/ai/caption-photo` | **Model:** `claude-3-5-sonnet-20241022`

```
/create-user-stories "AI Photo Captions — clicking a photo triggers Claude vision to
generate an evocative caption and alt text, saved to the entry"
```

**Backend prompt:**
```
Create POST /api/ai/caption-photo in aiController.js.
Accept { entryId, imageIndex }. Protect with authMiddleware + aiRateLimit.
Verify req.user._id === entry.author — return 403 if not.
Get the Cloudinary URL from entry.images[imageIndex].url.
Call claude-3-5-sonnet-20241022 with vision content block:
  { type: 'image', source: { type: 'url', url: cloudinaryUrl } }
Request JSON: { caption: string, altText: string }.
Save to entry.images[imageIndex].caption and .altText. Return updated image object.
```

**Frontend prompt:**
```
In ImageCarousel.jsx, add a "Caption with AI" button per image (visible to author only).
On click: POST /api/ai/caption-photo with { entryId, imageIndex }.
Show loading spinner. On response: display caption below image, update altText attribute.
```

---

### Feature 4 — Trip Narrative Compiler (Streaming Long-Form)

**Endpoint:** `POST /api/ai/compile-trip` | **Model:** `claude-3-5-sonnet-20241022`

```
/create-user-stories "Trip Narrative — select multiple entries from the same trip and
compile them into a flowing essay, streamed in real time on a dedicated page"
```

**Backend prompt:**
```
Create POST /api/ai/compile-trip in aiController.js.
Accept { entryIds: [] }. Protect with authMiddleware + aiRateLimit.
Fetch all entries. Verify ALL belong to req.user._id — return 403 if any do not.
Sort entries ascending by date before sending to Claude.
Set SSE headers (Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive).
Call claude-3-5-sonnet-20241022 with anthropic.messages.stream().
Stream chunks and end with [DONE] — same pattern as enhanceEntry.
```

**Frontend prompt:**
```
Create client/src/pages/TripNarrative.jsx.
Render a checklist of the user's entries.
Enable "Compile Trip" button when 2 or more entries are selected.
On click: open EventSource to POST /api/ai/compile-trip.
Stream narrative into a read-only textarea with live word count.
"Export as .txt" button appears after [DONE].
Add link to TripNarrative in Navbar.
```

---

### Feature 5 — Sentiment Analysis (Batch Processing)

**Endpoint:** `POST /api/ai/analyse-sentiment` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "Mood Timeline — analyse sentiment of all journal entries and
display a timeline chart showing emotional journey across trips"
```

**Backend prompt:**
```
Create POST /api/ai/analyse-sentiment in aiController.js.
Accept { entryIds: [] }. Protect with authMiddleware + aiRateLimit.
Fetch entries. Skip any that already have entry.sentiment populated (cache).
Process remaining in batches of exactly 5 using Promise.all.
Per entry: call claude-3-5-haiku-20241022 requesting JSON:
  { score: "positive"|"neutral"|"negative", keywords: string[3] }
If JSON parse fails for one entry: skip it gracefully, log the error, continue others.
Save sentiment to each entry. Return all entries (cached + newly analysed) with sentiment.
```

**Frontend prompt:**
```
Create client/src/components/MoodTimeline.jsx.
On mount: POST /api/ai/analyse-sentiment with all entry IDs.
Render a horizontal timeline with colour-coded dots:
  green = positive, grey = neutral, red = negative.
Hovering a dot shows entry title + sentiment keywords as a tooltip.
Place on Profile.jsx below user stats.
```

---

### Feature 6 — Natural Language Search (JSON Intent Parsing)

**Endpoint:** `POST /api/ai/nl-search` | **Model:** `claude-3-5-haiku-20241022`

```
/create-user-stories "Natural Language Search — user types 'sunny trips in Italy last summer'
and Claude parses intent into structured MongoDB filters"
```

**Backend prompt:**
```
Create POST /api/ai/nl-search in aiController.js.
Accept { query: string }. Protect with authMiddleware + aiRateLimit.
Call claude-3-5-haiku-20241022 once with the query, requesting JSON:
  { location?: string, dateFrom?: string, dateTo?: string, keywords?: string[] }
On JSON parse error: return 500 "Claude returned invalid JSON".
Build MongoDB query from parsed filters, always scoped to req.user._id.
Return entries sorted by textScore descending.
```

**Frontend prompt:**
```
In SearchResults.jsx, add a toggle: "Smart Search" vs "Keyword Search".
When "Smart Search" is active: POST /api/ai/nl-search with the input value.
Show an "Interpreted as:" chip displaying the parsed filters.
Results render in the same masonry grid as keyword search.
```

---

## 14. Push to GitHub

### Where to Run `git push`

**Option A — Ask Claude Code (recommended during active development):**
```
commit and push with message "feat: add smart location insights endpoint and component"
```
Claude runs `git add → git commit → git push`. If the hook blocks the push, Claude sees the failing tests in context and can fix them before retrying — fully automated recovery.

**Option B — Direct terminal (for confident, low-risk changes):**
```bash
git add src/controllers/aiController.js src/components/DestinationBrief.jsx
git commit -m "feat: add smart location insights endpoint and component"
git push
```

### What Happens on Every `git push`

Both options trigger the same hook:

```
git push
   |
   PreToolUse hook fires automatically
         |
         npm run test:unit -- --run
               |
               PASS  -->  push proceeds to GitHub
               FAIL  -->  push BLOCKED
                          Option A: Claude explains why and offers to fix
                          Option B: raw error shown in terminal
```

### Commit Message Format

```
feat:   new feature added
fix:    bug fixed
chore:  dependency or config change
test:   test added or fixed
docs:   documentation only
```

---

## 15. Deploy to Vercel

### Step 1 — Login

```bash
npm install -g vercel
vercel login
```

### Step 2 — Create `vercel.json` at Project Root

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "server/src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server/src/index.js" },
    { "src": "/(.*)", "dest": "/client/dist/$1" }
  ]
}
```

### Step 3 — Environment Variables in Vercel Dashboard

Go to vercel.com → your project → **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | Same as `server/.env` |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary |
| `CLOUDINARY_API_KEY` | From Cloudinary |
| `CLOUDINARY_API_SECRET` | From Cloudinary |
| `VITE_API_URL` | `https://your-project.vercel.app/api` |

### Step 4 — Deploy

In Claude Code chat:
```
/deploy
```

The full pipeline runs automatically:

```
/deploy
   |
   1. Unit test gate      — blocked if any fail
   2. npm run build       — production client build
   3. vercel --prod       — deployed to Vercel
         |
         PostToolUse hook fires automatically
               |
               GitHub Release created
   4. Release notes generated

Output:
## Deployment Complete
- URL: https://travel-app.vercel.app
- Release: https://github.com/youruser/travel-app/releases/tag/v1.0.0
```

### Step 5 — Verify

```bash
vercel ls
```

---

## 16. Release Tags and Notes

### Semantic Versioning

| Version | When |
|---------|------|
| `v1.0.0` | First public release |
| `v1.1.0` | New features added |
| `v1.1.1` | Bug fix |
| `v2.0.0` | Breaking change |

### Create and Push a Tag Manually

```bash
git tag -a v1.0.0 -m "First release: auth, entries, photo upload"
git push origin v1.0.0
```

### Generate Release Notes

```
/create-release-notes v1.0.0
```

> The `/deploy` skill calls this automatically — you only need to invoke it manually for hotfix tags deployed outside the normal flow.

---

## 17. Skills Deep Dive

### Skill Anatomy

Every skill is a `.md` file in `.claude/commands/`:

```markdown
---
description: One-line summary shown in /help
allowed-tools: Bash, Read, Write, Grep
argument-hint: <placeholder>
---

You are a [role]. When invoked with $ARGUMENTS:
1. [Step — exact commands and file paths]
2. [Step two]

Always output:
## Result
[structured block]
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `description` | Shown in `/help` — keep it action-oriented |
| `allowed-tools` | Restricts Claude's tools — security and predictability |
| `argument-hint` | Placeholder shown in CLI after skill name |
| `$ARGUMENTS` | The text typed after the skill name |

### Skill Storage Locations

| Path | Scope |
|------|-------|
| `.claude/commands/` | Project-scoped (this repo only) |
| `~/.claude/commands/` | Global (all projects) |

---

## 18. Agents Deep Dive

### Skills vs Agents

| | Skills | Agents |
|--|--------|--------|
| Duration | Single-shot, under 1 minute | Multi-step, minutes |
| Use case | Deterministic, repeatable tasks | Research, parallel work, heavy analysis |
| Context | Shares main context window | Isolated context window |
| Tools | Declared in skill frontmatter | Scoped to what you specify |
| Return | Output inline | Single structured result to parent |

### Agent 1 — `test-reporter`

Create `.claude/agents/test-reporter.md`:

```markdown
---
name: test-reporter
description: Runs all tests and returns structured pass/fail report
tools: Bash, Read, Grep
---

1. cd server && npm test -- --reporter=json
2. cd client && npm test -- --run --reporter=json
3. npx playwright test --reporter=json

Parse and return:
## Test Report — [timestamp]

| Suite         | Passed | Failed | Duration |
|---------------|--------|--------|----------|
| Unit (server) | X      | X      | Xs       |
| Unit (client) | X      | X      | Xs       |
| Integration   | X      | X      | Xs       |
| E2E           | X      | X      | Xs       |

### Failures
- Test: [name] | File: [path:line] | Error: [message]

Final status: PASS or FAIL
```

### Agent 2 — `pr-reviewer`

Create `.claude/agents/pr-reviewer.md`:

```markdown
---
name: pr-reviewer
description: Reviews PR diff for quality, coverage, and security issues
tools: Bash, Read, Grep
---

Given branch name $ARGUMENTS:
1. git diff main..$ARGUMENTS
2. Check for: missing tests, security issues, hardcoded secrets, console.logs
3. Run coverage check on changed files

Output:
## PR Review: $ARGUMENTS

### Summary
[2-3 sentences]

### Issues Found
- [CRITICAL/WARNING/INFO] [file:line] — [description]

### Recommendation: APPROVE / REQUEST_CHANGES
```

### Agent 3 — `story-creator`

Create `.claude/agents/story-creator.md`:

```markdown
---
name: story-creator
description: Creates Trello cards for user stories via MCP
tools: Bash
---

Given feature $ARGUMENTS:
1. Generate 3-5 stories: "As a / I want / so that"
2. Create Trello card per story with label "Story"

Output:
## Stories Created
| Story        | Card URL                       |
|--------------|-------------------------------|
| As a user... | https://trello.com/c/...      |
```

### Spawning Agents

In Claude Code chat:
```
Use the pr-reviewer agent to review feature/auth
```
```
Spawn the test-reporter agent
```

Claude runs the agent in isolation and returns the structured result.

---

## 19. Hooks Deep Dive

### Hook Event Types

| Type | When It Runs | Use Case |
|------|-------------|---------|
| `PreToolUse` | Before tool executes — exit 2 blocks it | Block push if tests fail |
| `PostToolUse` | After tool succeeds | Create release after deploy |
| `Notification` | When Claude sends a notification | Relay to Slack or desktop |
| `Stop` | When Claude finishes a task | Terminal bell alert |
| `SubagentStop` | When a subagent completes | Aggregate parallel results |

### Matcher Syntax

| Pattern | Matches |
|---------|---------|
| `"Bash"` | ALL Bash calls |
| `"Bash(git push*)"` | Only `git push` commands (glob) |
| `"Bash(vercel --prod*)"` | Only production deploys |
| `"Write"` | All file writes |

### Exit Codes

| Code | Effect |
|------|--------|
| `exit 0` | Success — proceed normally |
| `exit 1` | Report error to Claude but proceed |
| `exit 2` | **BLOCK** — tool will NOT execute |

### Four Hook Examples Walked Through

**Example 1 — Block `git push` if tests fail**

`PreToolUse` fires before `git push`. Runs `npm run test:unit -- --run`.
If tests fail: `exit 2` returned — push blocked entirely.
Claude Code reports: "Hook blocked the push. Fix failing tests first."

**Example 2 — Auto release notes after deploy**

`PostToolUse` fires after `vercel --prod` succeeds.
Reads latest tag, runs `git log`, formats notes, calls `gh release create`.
GitHub Release created automatically — no extra steps needed.

**Example 3 — Log every file write**

Every `Write` call appends a timestamped line to `.claude/activity.log`.
Run `cat .claude/activity.log` to see all files Claude has touched.

**Example 4 — Terminal bell on task completion**

`Stop` hook runs `printf '\a'` whenever Claude finishes a task.
Switch windows during long tasks — the bell brings you back.

---

## 20. Appendices

### Appendix A — Skills Reference

| Skill | File | Trigger | Side Effect |
|-------|------|---------|-------------|
| `/scaffold-server` | `.claude/commands/scaffold-server.md` | `/scaffold-server` | Creates full `server/` |
| `/scaffold-client` | `.claude/commands/scaffold-client.md` | `/scaffold-client` | Creates full `client/` |
| `/create-user-stories` | `.claude/commands/create-user-stories.md` | `/create-user-stories "feature"` | Creates Trello cards |
| `/run-tests` | `.claude/commands/run-tests.md` | `/run-tests` | None |
| `/unit-test-on-deploy` | `.claude/commands/unit-test-on-deploy.md` | `/unit-test-on-deploy` | Blocks if fail |
| `/check-coverage` | `.claude/commands/check-coverage.md` | `/check-coverage` | None |
| `/create-release-notes` | `.claude/commands/create-release-notes.md` | `/create-release-notes v1.0.0` | GitHub Release |
| `/deploy` | `.claude/commands/deploy.md` | `/deploy` | Deploys + release |

### Appendix B — Hooks Reference

| Event | Matcher | Action | Blocks? |
|-------|---------|--------|---------|
| `PreToolUse` | `Bash(git push*)` | Run unit tests | Yes — exit 2 |
| `PreToolUse` | `Write` | Log to `activity.log` | No |
| `PostToolUse` | `Bash(vercel --prod*)` | Create GitHub Release | No |
| `Stop` | (all) | Terminal bell | No |

### Appendix C — MCP Servers

| Server | Purpose | Config Location |
|--------|---------|----------------|
| `trello` | Manage Trello cards and boards | `~/.claude/settings.json` |
| `pencil` | Generate UI prototypes | Pre-configured in environment |

### Appendix D — Environment Variables

| Variable | Location | In CI? |
|----------|----------|--------|
| `ANTHROPIC_API_KEY` | `server/.env` + Vercel only | Never — always mocked in tests |
| `MONGODB_URI` | `server/.env` + Vercel + GitHub Secrets | Yes |
| `JWT_SECRET` | `server/.env` + Vercel + GitHub Secrets | Yes (test value only) |
| `CLOUDINARY_*` | `server/.env` + Vercel + GitHub Secrets | Yes |

### Appendix E — Final Folder Structure

```
Travel-App/
  client/
    src/
      api/             <- axios.js
      components/      <- Navbar, EntryCard, ImageCarousel, ProtectedRoute,
                          AIEntryEnhancer, DestinationBrief, MoodTimeline
      context/         <- AuthContext.jsx
      hooks/           <- useSSE.js
      pages/           <- Login, Register, Home, EntryDetail, CreateEntry,
                          TripNarrative, Profile, SearchResults
      App.jsx
    design-reference/  <- Pencil PNG exports
  e2e/                 <- Playwright tests
  playwright.config.ts
  server/
    src/
      config/          <- db.js, cloudinary.js, anthropic.js
      controllers/     <- authController.js, entryController.js, aiController.js
      middleware/      <- authMiddleware.js, rateLimit.js
      models/          <- User.js, Entry.js
      routes/          <- authRoutes.js, entryRoutes.js, aiRoutes.js
      index.js
    tests/
      unit/
      integration/
  .claude/
    commands/          <- 8 skill .md files
    agents/            <- 3 agent .md files
    settings.json      <- permissions + hooks
    activity.log       <- written by Write hook
  .github/
    workflows/
      ci.yml
  CLAUDE.md
  vercel.json
  .gitignore
```

### Appendix F — The Complete Workflow at a Glance

```
ONE-TIME SETUP
-------------------------------------------------------------
Create CLAUDE.md + .claude/settings.json
Create all 8 skills (Part 4)          <- do this FIRST
Configure hooks (Part 6)
Trello MCP setup (Part 5)
/scaffold-server   ->  full server/ created automatically
/scaffold-client   ->  full client/ created automatically
Paste Part 10 prompts x4  ->  all test files written

PER-FEATURE LOOP (repeat for each of the six AI features)
-------------------------------------------------------------
/create-user-stories "..."  ->  Trello cards created
[backend prompt]            ->  controller + route written
[frontend prompt]           ->  component written
/run-tests                  ->  suite runs (repeat until green)
/check-coverage             ->  coverage checked

PUSH AND DEPLOY (when feature is ready)
-------------------------------------------------------------
"commit and push feat:..."  ->  git push
                                hook: unit tests gate fires
                                code lands on GitHub
/deploy                     ->  unit tests -> build -> Vercel
                                hook: GitHub Release created
                                live in production
```
