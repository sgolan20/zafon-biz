# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # Next.js dev server (reads Firestore live via firebase-admin)
npm run build          # Produces static export into ./out  (no prebuild hook — see note below)
npm run lint           # ESLint (eslint.config.mjs, Next.js core-web-vitals + TS)

# Before `npm run build` you must refresh public/businesses.json manually, because
# the home page lazy-loads the full catalog from it after hydration:
GOOGLE_APPLICATION_CREDENTIALS=.secrets/sa-key.json npx tsx scripts/dump-businesses.ts

# Smart build + deploy (what the GitHub Actions cron runs — skips build if no
# Firestore changes since last deploy; FORCE_BUILD=1 to override)
npx tsx scripts/build-if-needed.ts

# One-off ops scripts (all under scripts/, run with `npx tsx`)
npx tsx scripts/seed-firestore.ts       # seed categories + towns
npx tsx scripts/create-admin.ts         # add an admin to /admins/{uid}
npx tsx scripts/regenerate-slugs.ts     # recompute Latin slugs
npx tsx scripts/notify-pending.ts       # open a GitHub Issue for new pending submissions
npx tsx scripts/ga-report.ts            # pull a Google Analytics report
```

Most scripts use firebase-admin and expect either `GOOGLE_APPLICATION_CREDENTIALS` (file path) or `FIREBASE_SERVICE_ACCOUNT` (raw JSON) in the environment. On Shahar's machine, `gcloud auth application-default login` Works because `firebase-admin` falls back to ADC.

## Architecture

This is a Hebrew, RTL static directory of businesses in northern Israel, deployed to Firebase Hosting at https://zafon-biz.web.app.

### The public site is fully static

`next.config.ts` sets `output: 'export'` + `trailingSlash: true`. There is no Next.js server at runtime — every route is pre-rendered to `./out/` and served by Firebase Hosting. The public site never talks to Firestore; it reads data at build time via `firebase-admin`.

Two separate Firebase SDKs are used:

- **`lib/firebase-admin.ts`** — server-side / build-time. Reads `businesses` / `categories` / `towns` during `next build`. Uses module-level Promise caches so a single build makes one Firestore round-trip per collection even when hundreds of static pages consume the same data ([app/business/[slug]/page.tsx](app/business/[slug]/page.tsx) is the heavy one via `generateStaticParams`).
- **`lib/firebase.ts`** — client SDK. Used only by the public registration form (anonymous create on `businesses`) and the admin panel (auth + read/write). Security rules in [firestore.rules](firestore.rules) enforce this boundary.

### Home page payload strategy

The home page inlines only the first 30 businesses (SEO + above-the-fold). `BusinessGrid` then fetches `/businesses.json` on hydration to power search and paginated reveal — see comments at the top of [app/page.tsx](app/page.tsx) and [components/BusinessGrid.tsx](components/BusinessGrid.tsx). `scripts/dump-businesses.ts` writes that JSON. **Gotcha:** there is no `prebuild` script in `package.json`, so `npm run build` alone does NOT refresh `public/businesses.json`. Run `dump-businesses.ts` first (or use `build-if-needed.ts` which chains them correctly). The comment in `scripts/build-if-needed.ts` referencing "the prebuild script" is stale.

### Daily Shuffle (fairness)

Both the inlined 30 on the home page and the full `businesses.json` are shuffled with the same deterministic seed = today's date in `Asia/Jerusalem` ([lib/shuffle.ts](lib/shuffle.ts)). All visitors on the same day see the same order, but order rotates daily so no business is permanently on top. The GitHub Actions cron rebuilds at 22:00 UTC (midnight Israel) to rotate it.

### Smart Build trigger

[scripts/build-if-needed.ts](scripts/build-if-needed.ts) is invoked by the cron every ~30 minutes. It compares a stored watermark at `/meta/lastBuild` (timestamp + `approvedCount`) against current Firestore state and exits without rebuilding if nothing changed. Count-delta catches deletes/unapprovals that a pure `approvedAt >` watermark would miss. `FORCE_BUILD=1` overrides.

### Admin notifications

No email service. [scripts/notify-pending.ts](scripts/notify-pending.ts) opens a GitHub Issue in this repo when new pending businesses appear; GitHub sends the owner an email automatically. Last-notified watermark at `/meta/lastNotified`. Repo is public, so issue bodies contain only name + town + category — no PII.

### Firestore collections & rules

- `businesses` — statuses `pending` | `approved` | `rejected`. Public anon users may `create` with status `pending` (constraints enforced by [firestore.rules](firestore.rules) + [lib/validation.ts](lib/validation.ts) Zod schemas). Reads, updates, deletes are admin-only.
- `categories`, `towns` — public read, admin write.
- `admins/{uid}` — gate for `isAdmin()`. Added manually via Firebase Console; no client write path.
- `meta/lastBuild`, `meta/lastNotified` — cron state.

### Path alias & types

`@/*` → project root (see `tsconfig.json`). Shared types live in [lib/types.ts](lib/types.ts). Note the intentional split between `Business` (full doc) and `BusinessSummary` (slim shape used in the grid and search index — only what the card UI needs).

### Firestore Timestamps

`firebase-admin` returns `Timestamp` objects; these are normalized to ISO strings in [lib/firebase-admin.ts](lib/firebase-admin.ts) before being passed as props, because Server Component props must be JSON-serializable.
