# BizConnect Rwanda

A discovery platform for small businesses in Rwanda: visitors find a business and contact it
directly on WhatsApp, by phone or by email; owners keep their listing up to date; admins review
what gets published.

Status: **Milestone 0 (foundations)**. The real design arrives in Milestone 1.

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · PostgreSQL 16 · Zod ·
Vitest · ESLint + Prettier · GitHub Actions. More of the stack (Prisma, Auth.js, pg-boss) arrives
in later milestones.

## Local setup (Windows)

You need **Node.js 22+**, **Git**, **PostgreSQL 16** and **Mailpit** installed:

```bash
winget install --id Git.Git -e
winget install --id PostgreSQL.PostgreSQL.16 -e
winget install --id axllent.mailpit -e
```

Then, from the project folder:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local database. You'll be asked for the `postgres` password you chose when
   installing PostgreSQL. The script creates a `bizconnect` database with its own login and
   writes the connection string into a new `.env` file for you:

   ```bash
   npm run db:setup
   ```

3. Start Mailpit (the local test inbox) in one terminal:

   ```bash
   npm run mail
   ```

4. Start the app in a second terminal:

   ```bash
   npm run dev
   ```

5. Open <http://localhost:3000>. The health check at <http://localhost:3000/api/health> should
   show `"status":"ok"`, with both `database` and `mail` reported as `"up"`. Test emails appear
   at <http://localhost:8025>.

## Settings

Every setting the app needs is listed in [`.env.example`](.env.example). Your real values live in
`.env`, which is never committed. If a setting is missing or malformed, the app refuses to start
and names the setting that's wrong.

## Scripts

| Command             | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Start the development server on port 3000                    |
| `npm run build`     | Production build                                             |
| `npm run check`     | Lint, type-check, formatting check and tests, all at once    |
| `npm run lint`      | ESLint                                                       |
| `npm run typecheck` | Generate route types, then run the TypeScript compiler       |
| `npm run format`    | Format every file with Prettier                              |
| `npm test`          | Run the unit tests once (`npm run test:watch` to keep going) |
| `npm run db:setup`  | Create the local database and write `DATABASE_URL` to `.env` |
| `npm run mail`      | Start Mailpit                                                |

A pre-commit hook runs ESLint and Prettier on the files you're committing, and GitHub Actions
runs lint, type-check, formatting, tests, build and `npm audit` on every pull request.

## Project layout

```
src/
  app/                 routes and UI (pages, layouts, API route handlers)
  config/              settings schema and validation
  server/
    services/          business rules
    repositories/      the only place that talks to the database
scripts/               developer helper scripts
```

The UI never talks to the database directly: a route calls a service, and the service calls a
repository.
