# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # Next.js dev server; D1 binding comes from wrangler.jsonc (local D1)
npm run preview        # OpenNext build + wrangler dev (closest to production)
npm run deploy         # OpenNext build + deploy to Cloudflare Workers
npm run lint
npm run cf-typegen     # regenerate cloudflare-env.d.ts after changing wrangler.jsonc

npm run db:migrate         # apply migrations/ to the production D1
npm run db:migrate:local   # same, local D1 (.wrangler/)

# Set-password link for any user (first admin login, or while email is off)
npx tsx scripts/password-link.ts <email>            # production
npx tsx scripts/password-link.ts <email> --local    # wrangler dev on :8788
```

Wrangler is pinned to the "Shahar Golan" Cloudflare account via `account_id` in wrangler.jsonc.

## Architecture

Hebrew, RTL directory of businesses in northern Israel. Everything runs on Cloudflare:
a Next.js app on **Workers** (via `@opennextjs/cloudflare`), data in **D1** (`zafon-biz`,
binding `DB`). Live at https://zafon-biz.sgolan20.workers.dev. Firebase is no longer used.

### Rendering

Pages are server-rendered on each request and read straight from D1 (`export const dynamic =
"force-dynamic"`), so approvals and owner edits show up immediately — no rebuilds, no cron.
`next.config.ts` keeps `trailingSlash: true`, so **API calls must end with `/`**
(otherwise a 308 redirect).

### Data layer

- [lib/db.ts](lib/db.ts) — all D1 queries, row ↔ `Business` mapping (snake_case columns,
  camelCase types). `getEnv()` / `getDb()` via `getCloudflareContext()`.
- Schema: [migrations/](migrations/). Tables: `businesses`, `categories`, `towns`, `users`,
  `sessions`, `password_tokens`, `rate_limits`.
- Home page inlines the first 30 businesses; `BusinessGrid` lazy-loads `/businesses.json`
  ([app/businesses.json/route.ts](app/businesses.json/route.ts)) for search.
- Daily shuffle: both are shuffled with seed = today's date in Asia/Jerusalem
  ([lib/shuffle.ts](lib/shuffle.ts)), computed per request.

### Business photos ([lib/media.ts](lib/media.ts))

- Each business has a main photo (`cover_key`) and a logo (`logo_key`), stored in **R2**
  (bucket `zafon-biz-media`, binding `MEDIA`) under `businesses/<id>/<kind>-<rand>.<ext>`.
- Upload/remove: `POST|DELETE /api/businesses/[id]/images/` (owner or admin). The browser
  shrinks to WebP first ([components/BusinessImagesEditor.tsx](components/BusinessImagesEditor.tsx));
  the server sniffs magic bytes (JPEG/PNG/WebP only) and caps size at 6 MB.
- Served by [app/media/[...key]/route.ts](app/media/[...key]/route.ts) with immutable caching
  (keys change on every upload). Deleting a business removes its R2 folder.
- Cards and the business page fall back to a branded green block when there is no photo.

### Accounts ([lib/auth.ts](lib/auth.ts))

- One `users` row per email. `role` = `owner` | `admin`; the only admin is sgolan20@gmail.com.
- A business belongs to `businesses.owner_id`. Migrated businesses were linked by their email;
  32 had no email and have no owner until the admin adds one (admin edit sets the owner from
  the business email, creating the user if needed).
- Migrated users start with `password_hash = NULL` and set one via "forgot password".
- Passwords: PBKDF2-SHA256 100k (Workers max). Sessions: random token in `zb_session`
  HttpOnly cookie, SHA-256 stored in `sessions`. Password links: single-use, SHA-256 stored.
- Route Handlers under `app/api/` check `sameOrigin()` + session ([lib/api.ts](lib/api.ts));
  all input is re-validated with the shared Zod schemas in [lib/validation.ts](lib/validation.ts).
- Pages: `/login`, `/forgot-password`, `/reset-password?token=`, `/account` (owner),
  `/account/business/[id]`, `/admin`, `/admin/business/[id]`.

### Email & notifications ([lib/notify.ts](lib/notify.ts))

- Password emails use Cloudflare Email Service (`send_email` binding named `EMAIL`) and need
  `EMAIL_FROM` in wrangler.jsonc + a domain onboarded to Email Service. **Not connected yet**:
  until then the admin "users" tab copies a set-password link to send by WhatsApp.
- New registrations email `ADMIN_EMAIL` through the same binding (no-op until email is
  connected); pending businesses are always listed first in `/admin`. Nothing goes through
  GitHub — no Actions, no cron, no issues.

### Migration from Firebase (one-off, Nov 2026)

`scripts/migrate/export-firestore.ts` → `.migration/firestore.json` →
`scripts/migrate/firestore-to-sql.ts` → `.migration/data.sql` → `wrangler d1 execute`.
`.migration/` is gitignored (contact details). `firebase-admin` stays as a devDependency only
for these scripts.

### Path alias & types

`@/*` → project root. Shared types in [lib/types.ts](lib/types.ts): `Business` (full row) vs
`BusinessSummary` (slim shape for the grid/search). Worker binding types in
`cloudflare-env.d.ts` (generated).
