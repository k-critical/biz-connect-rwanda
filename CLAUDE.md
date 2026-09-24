@AGENTS.md

# BizConnect Rwanda: notes for Claude

Read `docs/PROJECT_STATUS.md` first: it says which milestone is next and what's left. The full
build plan is the "Production Build Master Prompt" (milestones M0–M9, stack, design brief).

## Working agreement with the owner (student developer, new to backends)

- One milestone at a time. Before coding, give a five-line plan. After, explain in plain
  language what was built, give exact commands to try it, say plainly what's not finished,
  then wait for "go".
- One branch per milestone (`m5-…`), merged to `main` by pull request. The owner merges. Check
  that the previous PR is really merged (`git log origin/main`) before starting the next one.
- Demo data is fictional, named "Demo …", flagged `is_demo`, and has no phone numbers.
- Ask before anything destructive or costly. Never read out secrets from `.env`.

## Architecture rules

- `src/app` (routes/UI) → `src/server/services` (rules) → `src/server/repositories` (Prisma).
  UI never imports Prisma. Server modules start with `import "server-only"`.
- Settings are validated in `src/config/env-schema.ts`; add new ones to `.env.example` too.
- Colours come from tokens in `src/app/globals.css` (light + dark, WCAG AA checked).
- Links from business data go through `safeExternalUrl`; `?next=` through `safeNextPath`.

## Environment gotchas (Windows, PowerShell 5.1)

- Refresh PATH at the start of each shell command:
  `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
- Commit with `git commit -F <file>`: PowerShell breaks double quotes inside `-m` messages.
- Push with `$env:GIT_TERMINAL_PROMPT="0"; $env:GCM_INTERACTIVE="never"` so it can't hang.
- Paths over 260 characters fail for Python/node; use short folders like `C:\Temp\bcdeck`.
- After `npm run db:migrate`, the owner must restart `npm run dev` (it caches the Prisma client).
- Port 3001 belongs to another of the owner's apps. Use a free port (e.g. 3100) for test servers
  and stop them afterwards.
- Database tests (`src/server/**/*.test.ts`) need the local database seeded (`npm run db:seed`).
- Next 16 differs from older versions: check `node_modules/next/dist/docs/` before using an API.
