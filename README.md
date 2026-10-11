# Community Events Board

A small Next.js app where an admin posts local events (music nights, workshops,
food fairs, and more) and visitors browse, filter, favourite, set reminders on,
and decorate shareable cards for them.

Everything the UI renders comes from the app's own JSON API under `/api/*`, so a
mobile client can reuse the same endpoints later.

---

## Features

**Everyone (no login)**
- Browse active & upcoming events, nearest first
- Filter by category + city + free-text search (combined) with pagination
- Open an event detail page

**Registered visitors**
- Email + password signup / login (JWT stored in an httpOnly cookie)
- Pick favourite categories
- **My Feed** — upcoming events from the chosen categories
- **Remind me** on any event (optimistic UI, persists, rolls back on failure)
- **Design your card** — 3 themes, up to 3 of 5 stickers, saved per user per event

**Admin**
- Hard-coded admin login, server-protected pages and APIs
- Add events (title, category, city, date/time, price, description, image URL)
- Toggle events **Active / Inactive** (events are never deleted)

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | SQLite via Prisma 5 |
| Auth | `jose` (JWT, HS256) + `bcryptjs` |
| Validation | `zod` (schemas shared by form and API) |
| Data fetching | TanStack Query |
| UI | Tailwind CSS v4, `lucide-react`, `next/font` (Inter) |
| Animation | framer-motion (respects reduced motion) |
| Tests | Vitest |

---

## Quick start

```bash
npm install
cp .env.example .env      # then edit if you like (see below)
npx prisma migrate dev    # creates the SQLite database
npx prisma db seed        # 15 sample events + 3 demo visitors
npm run dev               # http://localhost:3000
```

> On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

---

## Environment variables

`.env` (see `.env.example`):

| Variable | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Prisma / SQLite connection |
| `JWT_SECRET` | 32+ random characters | Signs session tokens |
| `ADMIN_EMAIL` | `admin@events.local` | Hard-coded admin identity |
| `ADMIN_PASSWORD` | `change-me-admin` | Hard-coded admin password |

The admin account is **not** a database row — it is defined entirely by
`ADMIN_EMAIL` / `ADMIN_PASSWORD`. Change those values to change the login.

---

## Demo accounts

| Role | Email | Password | Where to sign in |
|---|---|---|---|
| **Admin** | `admin@events.local` | `change-me-admin` | `/admin/login` |
| Visitor | `priya@example.com` | `password123` | `/login` |
| Visitor | `arjun@example.com` | `password123` | `/login` |
| Visitor | `neha@example.com` | `password123` | `/login` |

Visitors also sign up themselves at `/signup`. Demo passwords are intentionally
simple — this is a local demo database, never deploy it as-is.

---

## Admin guide — everything an admin can do

### Sign in

1. Go to **`/admin/login`** (linked from the site footer as **Admin**).
2. Enter the admin email + password from your `.env` (defaults above).
3. You land on **`/admin`**. Non-admin credentials are rejected with
   "Admin access required".

### Pages

| Path | What it does |
|---|---|
| `/admin/login` | Admin sign-in form (public) |
| `/admin` | Event list — **all** events, including inactive and past, newest pages first |
| `/admin/events/new` | Add-event form |

Everything under `/admin` (except `/admin/login`) is protected — visiting it
while signed out redirects to `/admin/login?next=…`.

### Actions

- **Add an event** — `/admin/events/new`. Fields and their rules:

  | Field | Rule |
  |---|---|
  | Title | 3–80 characters |
  | Category | one of `Music`, `Workshop`, `Food`, `Sports`, `Kids` |
  | City | 2–50 characters |
  | Date & time | IST `datetime-local` input |
  | Price | `0`–`10,00,000` (₹), integer |
  | Description | 10–1000 characters |
  | Image URL | required, valid `http(s)` URL |

  A live image preview is shown as you type.

- **Toggle Active / Inactive** — the switch in the **Actions** column on
  `/admin`. Inactive events disappear from the public site immediately; they are
  never deleted, so the toggle is fully reversible.
- **Pagination** — the admin table is paginated (10 per page).

### Admin API

All admin API routes require an admin session; otherwise they return **403**.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/admin/events?page=1` | List all events (admin view, paginated) |
| `POST` | `/api/admin/events` | Create an event |
| `PATCH` | `/api/admin/events/:id/status` | Body `{ "isActive": boolean }` — toggle status |

### How admin protection works

- `src/proxy.ts` (Next middleware) guards `/admin/*` and `/api/admin/*`:
  - pages → redirect to `/admin/login`
  - APIs → `403 {"error":{"code":"FORBIDDEN"}}`
- `src/app/admin/(protected)/layout.tsx` re-checks the session server-side.
- Route handlers call `requireAdminSession()` from `src/lib/session.ts`.
- Admin tokens carry `sub: "admin"` and `role: "admin"`; there is no User row.

### Out of scope (by design)

Editing or deleting events, admin user management, image upload, password reset.

---

## Pages

| Path | Audience | Description |
|---|---|---|
| `/` | Public | Events board with filters + search + pagination |
| `/events/[id]` | Public / user | Event detail, reminder button, card designer |
| `/login`, `/signup` | Public | Visitor auth |
| `/feed` | User | Upcoming events from favourite categories |
| `/favourites` | User | Pick favourite categories |
| `/admin/login` | Admin | Admin sign-in |
| `/admin`, `/admin/events/new` | Admin | Event management |

---

## API reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/signup` | — | Create visitor account, set cookie |
| `POST` | `/api/auth/login` | — | Login (visitor or admin), set cookie |
| `POST` | `/api/auth/logout` | — | Clear the auth cookie |
| `GET` | `/api/auth/me` | session | Current user |
| `GET` | `/api/events` | — | List active/upcoming events (`category`, `city`, `q`, `page`, `pageSize`) |
| `GET` | `/api/events/filters` | — | Available filter values |
| `GET` | `/api/events/:id` | — | Event detail (adds `isReminded` / `cardDesign` for users) |
| `PUT` / `DELETE` | `/api/events/:id/reminder` | user | Set / clear a reminder |
| `GET` / `PUT` | `/api/events/:id/card` | user | Get / save card design |
| `GET` / `PUT` | `/api/me/favourites` | user | Get / set favourite categories |
| `GET` | `/api/me/feed?page=1` | user | Upcoming events from favourite categories |
| `GET` / `POST` | `/api/admin/events` | admin | List all / create event |
| `PATCH` | `/api/admin/events/:id/status` | admin | Toggle active state |

Errors use a consistent shape:

```json
{ "error": { "code": "VALIDATION", "message": "…", "fields": { "title": "…" } } }
```

---

## Project structure

```
ceb-app/
├─ prisma/
│  ├─ schema.prisma        # User, Event, FavouriteCategory, Reminder, CardDesign
│  ├─ seed.ts              # 15 events (9 active, 3 past, 3 inactive) + 3 visitors
│  └─ migrations/
├─ src/
│  ├─ app/
│  │  ├─ (pages)           # /, /login, /signup, /feed, /favourites, /events/[id]
│  │  ├─ admin/            # /admin/login, /admin, /admin/events/new
│  │  └─ api/              # route handlers (the JSON API)
│  ├─ components/          # header, event card, filter bar, card designer, …
│  ├─ hooks/               # useSession, …
│  ├─ lib/                 # api client, jwt, cookies, env, validation, format
│  ├─ services/            # auth, events, feed, favourites, reminders
│  └─ proxy.ts             # admin route protection (middleware)
└─ tests/                  # Vitest unit + integration tests
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run dev:clean` | Delete `.next` then start dev (see Troubleshooting) |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite once |
| `npm run check` | lint + typecheck + test + build |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | `prisma db seed` |
| `npm run db:reset` | `prisma migrate reset --force` (wipes + re-seeds) |
| `npm run clean` | Remove the `.next` build cache |

---

## Testing

```bash
npm test          # Vitest (unit + API integration, SQLite test.db)
npm run typecheck
npm run build
```

Tests run against `prisma/test.db` with `fileParallelism: false` because SQLite
cannot take parallel writers.

---

## Troubleshooting

**The page keeps reloading in dev.**
This is a stale Turbopack dev cache, not app code: the server keeps re-issuing
an HMR `restart` for the entry chunk, the client sees an "HMR hash mismatch",
and reloads forever. Fix:

```bash
# stop the dev server, then:
npm run dev:clean
```

In a production run (`npm run build` + `npm start`) HMR does not exist, so it
cannot happen there.

**`Invariant: expected 16.4.1, installed 16.4.0`** — cosmetic version-staleness
notice from the dev overlay; it does not affect behaviour.

**Reset the database** — `npm run db:reset` recreates and re-seeds everything.

---

## Notes

- Reminders are a saved flag only — no email or push notifications.
- Prices are shown in ₹ (INR) with Indian digit grouping; dates are IST.
- Security headers (`X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`) are set in `next.config.ts`.
