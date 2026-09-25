# BizConnect Rwanda

A discovery platform for small businesses in Rwanda: visitors find a business and contact it
directly on WhatsApp, by phone or by email; owners keep their listing up to date; admins review
what gets published.

Status: **Milestone 6 (admin)**: public directory, accounts, the owner flow ("List your
business" wizard, photos, dashboard, claims), and the admin side: a review queue, claims,
visitor reports, an audit log, and an email queue that retries. Reviews and favourites arrive in
Milestone 7.

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · PostgreSQL 16 · Prisma 7 ·
Better Auth (Argon2id passwords) · pg-boss (job queue) · sharp (photos) · Leaflet + OpenStreetMap
(maps) · Nodemailer · Zod · Vitest · ESLint + Prettier · GitHub Actions.

## Local setup (Windows)

You need **Node.js 22+**, **Git**, **PostgreSQL 16** and **Mailpit** installed:

```bash
winget install --id Git.Git -e
winget install --id PostgreSQL.PostgreSQL.16 -e
winget install --id axllent.mailpit -e
```

Then, from the project folder:

1. Install dependencies (this also generates the Prisma client):

   ```bash
   npm install
   ```

2. Create the local database. You'll be asked for the `postgres` password you chose when
   installing PostgreSQL. The script creates a `bizconnect` database with its own login and
   writes the connection string into a new `.env` file for you:

   ```bash
   npm run db:setup
   ```

3. Create the tables, then fill them with categories, Rwanda's provinces and districts, and about
   twenty demo businesses:

   ```bash
   npm run db:migrate
   ```

   ```bash
   npm run db:seed
   ```

4. Start Mailpit (the local test inbox) in one terminal:

   ```bash
   npm run mail
   ```

5. Start the app in a second terminal:

   ```bash
   npm run dev
   ```

6. Open <http://localhost:3000>. The health check at <http://localhost:3000/api/health> should
   show `"status":"ok"`, with both `database` and `mail` reported as `"up"`. Test emails appear
   at <http://localhost:8025>.

## Settings

Every setting the app needs is listed in [`.env.example`](.env.example). Your real values live in
`.env`, which is never committed. If a setting is missing or malformed, the app refuses to start
and names the setting that's wrong.

## Database

The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). After changing it, run
`npm run db:migrate` and give the change a short name; Prisma writes a new SQL file to
`prisma/migrations/`, applies it, and regenerates the client. Commit the migration with the code
that needs it.

**Demo data.** Every seeded business is fictional, named "Demo …" and stored with
`is_demo = true`. Demo businesses have no phone number unless you set `SEED_DEMO_WHATSAPP` in
`.env` to your own number. Before launch, remove them all with `npm run db:wipe-demo`; real
businesses are never touched.

**Dependency overrides.** `package.json` forces patched versions of `deepmerge-ts` and `mysql2`.
Both come only through the `prisma` command-line tool, which pins older versions with known
security advisories. Remove the overrides once a stable Prisma release depends on fixed versions
(check with `npm audit --omit=dev`).

## Scripts

| Command                            | What it does                                                   |
| ---------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                      | Start the development server on port 3000                      |
| `npm run build`                    | Production build                                               |
| `npm run check`                    | Lint, type-check, formatting check and tests, all at once      |
| `npm run lint`                     | ESLint                                                         |
| `npm run typecheck`                | Generate route types, then run the TypeScript compiler         |
| `npm run format`                   | Format every file with Prettier                                |
| `npm test`                         | Run all tests once (`npm run test:watch` to keep going)        |
| `npm run db:setup`                 | Create the local database and write `DATABASE_URL` to `.env`   |
| `npm run db:migrate`               | Apply migrations, or create a new one after a schema change    |
| `npm run db:seed`                  | Add categories, locations and demo businesses (safe to re-run) |
| `npm run db:studio`                | Browse and edit the database in your web browser               |
| `npm run db:wipe-demo`             | Delete every demo business and demo user                       |
| `npm run env:sync`                 | Add settings missing from `.env` and generate the auth secret  |
| `npm run user:make-admin -- email` | Give a confirmed account the admin role                        |
| `npm run mail`                     | Start Mailpit                                                  |

A pre-commit hook runs ESLint and Prettier on the files you're committing. On every pull request,
GitHub Actions runs lint, type-check and formatting, builds a fresh PostgreSQL database from the
migrations, seeds it twice, checks the schema and migrations match, runs the tests, builds the app
and runs `npm audit`.

**Tests.** Most tests are plain unit tests. Five files run against your local database:
`src/server/services/directory-service.test.ts` expects the demo data (run `npm run db:seed`
first) and checks search, filters and "open now"; `src/server/auth/auth.test.ts` runs the real
sign-up, confirmation, sign-in, reset and rate-limit flows with emails captured in memory, using
throwaway accounts it deletes afterwards; `src/server/services/listing-service.test.ts` runs the
owner and claim flows (it also needs the seed), saving test photos in a temporary folder;
`src/server/services/admin-service.test.ts` runs admin decisions, claims and reports; and
`src/server/jobs/email-queue.test.ts` puts an email through the real job queue.

## Accounts

Sign-in uses [Better Auth](https://www.better-auth.com/) with email and password:

- Registering sends a confirmation email; nobody can sign in until they click it. Registering an
  email that already has an account looks the same as a normal sign-up (and emails the real
  owner), so the form can't be used to discover who has an account.
- Passwords are hashed with Argon2id. Sessions live in the database and in httpOnly, SameSite
  cookies; resetting a password signs out every other device.
- Sign-in, sign-up, password-reset and confirmation-email requests are rate limited per IP.
- Roles are `VISITOR` (default), `OWNER` and `ADMIN`. Nobody can choose their own role.

**Creating the first admin.** There is no built-in admin account or password. Register normally,
confirm your email, then run:

```bash
npm run user:make-admin -- you@example.com
```

`/admin` answers "not found" to everyone who isn't an admin.

**New settings.** When a milestone adds settings to `.env.example`, run `npm run env:sync` to copy
the missing ones into your `.env`. It also generates `BETTER_AUTH_SECRET` if it's empty, without
printing it.

## Listing a business

Signed-in people can list a business at `/list-your-business` in four steps: the basics, contact
and location (with a map pin), photos and hours, then review and send. Each step saves a draft;
sending puts the listing in **Waiting for review**. Starting a listing gives the account the
`OWNER` role. Owners manage everything from `/dashboard`: details, contact, hours, photos, the
menu or products, and a preview. Changes to a live listing appear straight away; a suspended
listing can't be edited, and only drafts can be deleted.

**Photos.** The browser shrinks photos before sending them. The server then checks what each file
really is (JPEG, PNG or WebP only), turns it the right way up, removes camera data such as GPS
location, and saves three WebP sizes (480, 960 and 1600 pixels wide) plus a tiny blurred preview.
Files live in `UPLOADS_DIR` (default `./storage`, never committed) behind a small storage
interface, so they can move to S3-style storage later. Back this folder up with the database.

**Claiming a listing.** Listings that nobody manages show "Is this your business?". The request
asks how the person is connected, a phone number to call, a message and optional proof (a photo or
PDF), which is stored under `private/` and only ever shown to admins.

## Admin

Admins (see "Creating the first admin" above) get `/admin`:

- **Overview**: what's waiting (listings, claims, reports) and recent admin activity.
- **Listings**: the review queue, oldest first, plus every other status and a search by name or
  owner email. Each listing shows a full preview, its owner, open reports and its history.
  Admins can approve, ask for changes (the reason is emailed to the owner and shown on their
  dashboard), feature a listing on the home page, suspend it with a reason, or restore it.
- **Claims**: the request, the phone number to call and the private proof. Approving gives the
  listing to that person (and makes them an owner); other requests for the same listing are
  turned down automatically. Turning a claim down needs a reason, which is emailed.
- **Reports**: signed-in visitors can report a live listing ("Report wrong or harmful
  information" on its page). Admins resolve or dismiss each report.
- **Audit log**: every decision, who made it and when, with the note they wrote. Each decision
  is saved in the same database transaction as its audit entry, and only goes through if nobody
  else has changed the item since the admin opened it.

## Emails and the job queue

Every email (sign-up confirmation, password reset, listing and claim decisions) goes into a job
queue kept in PostgreSQL by [pg-boss](https://github.com/timgit/pg-boss), in its own `pgboss`
schema. A worker inside the web server sends the emails; it starts with the server
(`src/instrumentation.ts`) and logs `[jobs] email worker started`. If the mail server is down,
each email is retried up to 6 times with growing gaps (30 seconds, then longer, up to an hour),
so nothing is lost when Mailpit isn't running. Sent jobs are deleted after 7 days.

## Search

Search combines PostgreSQL full-text search (over the name, description, sector, district and
category) with `pg_trgm` trigram matching on the name, so "hotel Musanze" and misspellings like
"Lakside" both work. Filters live in the URL (`/explore?q=…&category=…&district=…&price=…&open=1`),
so results can be shared and the back button works.

## Project layout

```
prisma/
  schema.prisma        database tables
  migrations/          versioned SQL, applied in order
  seed.ts, seed-data/  categories, locations and demo businesses
src/
  app/                 routes and UI (pages, layouts, API route handlers)
  components/          UI building blocks (see /styleguide in development)
  config/              settings, categories and site navigation
  lib/                 pure helpers: opening hours, URL filters, validation rules, phone numbers
  server/
    services/          business rules
    repositories/      the only place that talks to the database
    images/            photo checks and resizing (sharp)
    storage/           where uploaded files are kept
    jobs/              the job queue and its workers (emails)
scripts/               developer helper scripts
```

The UI never talks to the database directly: a route calls a service, and the service calls a
repository.
