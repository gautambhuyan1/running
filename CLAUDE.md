# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: MYMove

India-focused running event platform. Runners discover and register for events; organisers manage events and view dashboards; admins approve events and moderate content.

**Stack:** Next.js 16 (App Router) + React 19 + Tailwind 4 + Base UI → `frontend/` | Express 4 + TypeScript + Prisma 5 + SQLite → `backend/`

**Ports:** Backend: 4000 | Frontend: 3000

## Running the App

```bash
# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

Other backend scripts:
```bash
npm run db:generate   # regenerate Prisma client after schema changes
npm run db:push       # push schema to SQLite (dev only, no migrations)
npm run db:seed       # seed 7 demo users + 6 events
npm run db:studio     # open Prisma Studio at localhost:5555
npm run build         # compile TypeScript to dist/
```

Frontend lint: `cd frontend && npm run lint`

## Architecture

### Backend (`backend/src/`)

- **`index.ts`** — Express entry point. Wires all routes under `/api/*`.
- **`config/index.ts`** — All env vars in one typed object (`config.jwtSecret`, `config.razorpay`, etc.).
- **`config/db.ts`** — Prisma client singleton.
- **`middleware/auth.ts`** — Three auth middlewares: `authenticate` (required JWT), `requireRole(...roles)` (role gate), `optionalAuth` (attaches user if token present).
- **`middleware/validate.ts`** — Zod-based request body validation.
- **`routes/`** — One file per domain. Route-level auth/role enforcement.

Route → URL prefix mapping (not all follow `/<resource>`):
| File | Prefix |
|---|---|
| `auth.ts` | `/api/auth` |
| `events.ts` | `/api/events` |
| `registrations.ts` | `/api/registrations` |
| `results.ts` | `/api` (nested: `/api/events/:id/results`) |
| `reviews.ts` | `/api/events` (nested: `/api/events/:id/reviews`) |
| `photos.ts` | `/api/events` (nested: `/api/events/:id/photos`) |
| `certificates.ts` | `/api/certificates` |
| `notifications.ts` | `/api/notifications` |
| `organiser.ts` | `/api/organiser` |
| `admin.ts` | `/api/admin` |
| `profile.ts` | `/api/users` |

### Database Schema (`backend/prisma/schema.prisma`)

SQLite via Prisma. Key relationships:
- `User` (runner | organiser | admin) → owns `Event[]`, `Registration[]`, `Review[]`, `Notification[]`
- `Event` → has `EventCategory[]` (3K/5K/10K/HM/FM/50K/Ultra, each with its own price/slots), `Review[]`, `Photo[]`, `EventFaq[]`
- `Registration` → joins `User` + `EventCategory`, holds bib number and payment ref; has one optional `Result`
- `Result` stores `finishTime`/`gunTime` as `HH:MM:SS` strings, plus `overallRank`/`categoryRank`

Event lifecycle status: `draft → pending → live → completed`

Schema changes require `npm run db:generate && npm run db:push` (dev) — there are no migration files, schema is pushed directly.

### Frontend (`frontend/src/`)

- **`lib/api.ts`** — `ApiClient` class (singleton `api`). All HTTP calls go through `api.request()`, which reads `mymove_token` from localStorage and sets `Authorization: Bearer`. All frontend API calls use this singleton.
- **`lib/auth-context.tsx`** — React context `AuthProvider` wraps the app. `useAuth()` returns `{ user, token, login, register, logout, isLoading }`. Token + user are persisted to localStorage under keys `mymove_token` / `mymove_user`.
- **`types/index.ts`** — Shared TypeScript interfaces for all domain objects (`User`, `Event`, `EventCategory`, `Registration`, `Result`, etc.).
- **`app/`** — Next.js App Router pages. All pages are client components (`"use client"`) that call `api.*` directly; there is no server-side data fetching.
- **`components/ui/`** — Primitive UI components built on Base UI (`@base-ui/react`), NOT Shadcn despite the `components.json`. Tailwind 4 (PostCSS plugin, no config file).
- **`app/client-layout.tsx`** — Wraps children with `AuthProvider` and `ThemeProvider`; imported by `app/layout.tsx`.

**AGENTS.md warning:** This project uses Next.js 16 with breaking changes. Before writing Next.js-specific code, read `frontend/node_modules/next/dist/docs/` for current conventions.

### Auth Flow

1. Login/register POSTs to `/api/auth/login` or `/api/auth/register` → returns `{ user, token }`.
2. Token stored in `localStorage` by `AuthProvider`.
3. `ApiClient.getToken()` reads it on every request.
4. Backend verifies JWT with `config.jwtSecret` (`mymove-dev-secret` in dev).

### Stubbed Integrations

These are wired but not functional — stubs return success without real calls:
- **Google OAuth** — `GOOGLE_CLIENT_ID/SECRET` empty
- **Razorpay payments** — `rzp_test_stub` key
- **Email (Resend)** — `re_stub` key
- **SMS OTP (MSG91)** — `stub` key
- **Photo AI search** (bib recognition) — returns mock results
- **PDF certificate generation** — returns certificate data without a real PDF

## Demo Accounts (password: `password123`)

| Email | Role |
|---|---|
| admin@mymove.in | Admin |
| priya@mymove.in | Organiser |
| ananya@gmail.com | Runner |
