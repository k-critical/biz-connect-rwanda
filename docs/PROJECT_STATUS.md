# BizConnect Rwanda: project status

_Last updated 25 September 2026, after Milestone 6._

## At a glance

| Milestone                | What it covers                                                    | Status                               |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------ |
| M0 Foundations           | Next.js app, settings check, health check, lint/format, CI        | Done, merged (PR #1)                 |
| M1 Design system         | Colours (light + dark), fonts, logo, components, style guide      | Done, merged (PR #2)                 |
| M2 Database              | Prisma schema, migrations, categories, districts, demo businesses | Done, merged (PR #3)                 |
| M3 Public directory      | Home, explore with search and filters, category pages, profiles   | Done, merged (PR #4)                 |
| M4 Accounts and roles    | Register, confirm email, sign in, reset password, roles, limits   | Done, merged (PR #5)                 |
| M5 Owner flow            | Listing wizard, photo uploads, owner dashboard, claim a business  | Done, merged (PR #6)                 |
| M6 Admin                 | Review queue, approve/reject, claims, moderation, audit log       | Done, merged (PR #7)                 |
| M7 Community and insight | Reviews, favourites, view and contact counters, owner analytics   | **Started** on branch `m7-community` |
| M8 Polish                | Kinyarwanda/French, accessibility, performance, legal pages       | Not started                          |
| M9 Production            | Docker, HTTPS, backups, monitoring, going live                    | Not started                          |

Seven of ten milestones are done. Everything built so far passes 176 automated tests,
lint, type checks, a production build and a security audit (0 known issues).

## Where everything lives

| What                       | Where                                                         |
| -------------------------- | ------------------------------------------------------------- |
| Project on your PC         | `D:\dev\biz-connect-rwanda`                                   |
| Code on GitHub (public)    | https://github.com/k-critical/biz-connect-rwanda              |
| Old static prototype       | `prototype/` in the project folder, kept on your PC only      |
| Build plan (master prompt) | `BizConnect_Rwanda_Production_Prompt.md`, sent to you in chat |
| Setup and commands         | [`README.md`](../README.md)                                   |

## Running it every day

Open two terminals in the project folder:

```bash
npm run mail
```

```bash
npm run dev
```

Then open:

| Page                 | Address                                  |
| -------------------- | ---------------------------------------- |
| The website          | http://localhost:3000                    |
| Test inbox (Mailpit) | http://localhost:8025                    |
| Health check         | http://localhost:3000/api/health         |
| Style guide          | http://localhost:3000/styleguide         |
| List a business      | http://localhost:3000/list-your-business |
| Owner dashboard      | http://localhost:3000/dashboard          |
| Admin                | http://localhost:3000/admin              |
| Database viewer      | run `npm run db:studio`                  |

**Restart `npm run dev` after any database change** (`npm run db:migrate`), or new tables won't
be visible to the running server.

## What's been built

**M0 Foundations.** Next.js 16 with strict TypeScript and Tailwind. The app refuses to start if a
setting in `.env` is missing or wrong. `/api/health` checks the database and email. A pre-commit
hook formats and lints code; GitHub Actions checks every pull request.

**M1 Design system.** Your prototype's red-orange, gold and cream as colours that meet WCAG AA
contrast in both light and dark mode. Playfair Display and DM Sans, Lucide icons, a diamond logo
mark and an Imigongo-inspired chevron pattern. Buttons, form fields, badges, ratings, loading and
empty states, business card, header with mobile menu, footer, 404 page, and `/styleguide`.

**M2 Database.** PostgreSQL through Prisma 7. Tables for businesses (with a draft → pending →
approved status), categories, provinces and districts, opening hours, photos and a
menu/product showcase. The seed adds 9 categories, Rwanda's 5 provinces and 30 districts, and
21 fictional "Demo …" businesses. `npm run db:wipe-demo` removes every demo record before launch.

**M3 Public directory.** Search that forgives typos and understands places and categories
("hotel Musanze", "Lakside"). Explore page with category, district, price and open-now filters
kept in the URL. Category pages. Business profiles with open/closed status, hours, menu prices in
RWF, contact card, WhatsApp/Call bar on phones, share button, related and nearby businesses, and
Google structured data. Real home page, sitemap and robots file.

**M4 Accounts and roles.** Registration with email confirmation, sign-in, sign-out and password
reset. Passwords hashed with Argon2id. Sessions in the database. Login attempts are rate limited.
Roles: member, business owner, admin. No built-in admin: register, then run
`npm run user:make-admin -- your@email`.

**M5 Owner flow.** "List your business" in four steps (the basics, contact and location with a
map pin, photos and hours, review and send), saving a draft after each step. An owner dashboard
to edit details, contact, hours, photos and the menu/products, with a preview of the public page
and a checklist of what's missing. Photos are shrunk in the browser, then checked, turned upright,
stripped of GPS data and saved as three WebP sizes with a blurred placeholder, in a storage folder
that can move to cloud storage later. Profiles now show a photo gallery with a full-screen viewer,
a map with Google Maps and OpenStreetMap links, and "Is this your business?" to claim a listing
(with private proof for admins). Phone numbers are stored as +250…; web, Facebook and Instagram
links are checked.

**M6 Admin.** `/admin` with an overview of what's waiting, a review queue (oldest first) with a
full preview of each listing, and decisions: approve, ask for changes with a reason, feature on
the home page, suspend with a reason, restore. Owners get an email for each decision and see the
admin's note on their dashboard. Claims show the private proof and a number to call; approving
gives the listing to that person and turns down other requests for it. Signed-in visitors can
report a listing, and admins resolve or dismiss reports. Every decision is written to an audit
log in the same database step as the change, and two admins can't act on the same thing at once.
All emails now go through a job queue in PostgreSQL (pg-boss) and are retried if the mail server
is down, so none are lost.

## Decisions made along the way

| Decision                                          | Why                                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| No Docker on your PC; Docker only on the server   | Docker Desktop needs 10–15 GB; your C: drive had 18 GB free                             |
| Prisma 7.10 (stable), not Prisma 8                | Prisma 8 was still a release candidate                                                  |
| Two forced package versions in `package.json`     | Prisma's tool pinned versions with security advisories; forcing fixed ones passes audit |
| Better Auth instead of Auth.js                    | Auth.js v5 is still beta and lacks sign-up, confirmation, reset and revocable sessions  |
| Demo businesses have no phone numbers             | So nobody real gets messaged by accident                                                |
| Search uses English word forms plus typo matching | Handles "hotels" vs "hotel"; Kinyarwanda words match exactly or with typos              |
| Prototype kept out of GitHub                      | It contains RHA bank details and a fake admin password                                  |
| Edits to a live listing appear straight away      | Owners fix hours and prices often; admins can suspend a listing (M6) if it's abused     |
| A listing's web address never changes once live   | Links people shared keep working even if the owner renames the business                 |
| Map tiles from OpenStreetMap, no API key          | Free; fine at our size. A paid tile provider may be needed if traffic grows a lot       |
| Email worker runs inside the web server           | One process to run on a small server; it can move to its own process later              |
| Reporting a listing needs an account              | Keeps spam out without a CAPTCHA; reporters aren't emailed back                         |
| Claim proof is kept after a decision              | Admins may need it if the decision is disputed; account deletion (M8) must remove it    |

## What's left

**Small leftovers from M5 and M6**

- The public `/api/v1` read API (it was only suggested for M5)
- Big changes to a live listing (e.g. its name) could go back to review, if abuse appears
- A general rate limit on uploads, claims and reports (today: 12 photos per listing, 10 listings
  per account, 3 open claims and 5 open reports per person)
- Admin pages for users and categories (today: `npm run user:make-admin` and the seed)
- Emails to admins when something new is waiting (today: check the overview)

**M7 Community and insight** (started 25 September on branch `m7-community`)

Done so far: the database tables (`reviews`, `favorites`, `daily_stats`, and `rating_average`
/ `rating_count` on businesses; migration `community`, already applied to your local database)
and the validation rules in `src/lib/review-rules.ts`. Still to build, in this order: the
repositories and services, review form and list on profiles (with rating breakdown), owner
replies, admin review moderation (audit-logged), ratings on cards plus a "4 stars and up" filter
and "Top rated" sort, the favourite button and a "Saved places" page, privacy-friendly visit and
contact-tap counting (`/api/track`, totals per day only), the owner insights page, tests and docs.

- Reviews with owner replies and moderation; ratings on cards and a rating filter
- Favourites for signed-in visitors
- Privacy-friendly view and contact-click counts; owner analytics

**M8 Polish**

- Kinyarwanda and French (needs native speakers to review)
- Accessibility audit, performance pass, a 500 error page
- About, FAQ, Contact, Privacy and Terms pages (these links go to "not found" today)
- Share-preview images, basic installable-app support
- Account settings: change name, email or password; export or delete your data
- Check what Rwanda's personal data protection law requires

**M9 Production**

- Production Docker image, Caddy with automatic HTTPS, a server set up from scratch
- Nightly backups and a tested restore, uptime monitoring, structured logs
- Security and launch checklists: wipe demo data, set real contact details, create the first admin

**Documents still owed** (from the master prompt): `docs/ARCHITECTURE.md`,
`docs/API.md`, `docs/SELF_HOSTING.md` and `docs/DEV_IDEAS.md`.

## What I need from you

| When      | What                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| Now       | Merge the M6 pull request (both clicks: **Merge pull request**, then **Confirm merge**)  |
| Now       | Restart `npm run dev` (new tables), then make yourself admin to try `/admin`             |
| Before M8 | The platform's real WhatsApp number and email; a logo if you have one                    |
| Before M8 | Whether the Rwanda Hospitality Association content may be published                      |
| Before M8 | Someone to check Kinyarwanda and French wording                                          |
| Optional  | Whether you want "Sign in with Google"                                                   |
| Before M9 | Where to host and which domain; applying for the GitHub Student Developer Pack now helps |

## Keeping the work going smoothly

**Your Claude usage** (checked 25 September 2026, 16:45 Kigali time):

| Limit              | Used | Refills                             |
| ------------------ | ---- | ----------------------------------- |
| Plan               | Pro  |                                     |
| 5-hour limit       | 34%  | 17:40 Kigali time (15:40 UTC) today |
| Weekly, all models | 14%  | Thursday 1 October, 09:00 Kigali    |
| Extra usage        | Off  | $0.68 of the $20 monthly cap spent  |

Nothing expires: both limits refill on their own. If you hit a limit mid-milestone, nothing is
lost. The work stays on your PC, and after the refill you just say "continue". Turning on extra
usage (in your Claude settings) would let work carry on past a limit, charged up to your cap.

**Tips for the next milestones**

- **Start each milestone in a fresh chat session**, opened on the `D:\dev\biz-connect-rwanda`
  folder. Long conversations get summarised and lose detail. A new session reads `CLAUDE.md`
  automatically, which now points to this file and the working agreement.
- To begin, say: _"Continue with Milestone 7 as described in docs/PROJECT_STATUS.md."_
- Keep Mailpit and the dev server running while you test, and restart the dev server after
  database changes.
- Open a **new** terminal after installing any program, so it can find it.
