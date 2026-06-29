# MYMove - Implementation Tracking Sheet

## Project Overview
- **App Name**: MYMove
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + ShadCN UI → `frontend/`
- **Backend**: Express.js + TypeScript + Prisma + SQLite → `backend/`
- **Auth**: JWT + Google OAuth (stub) + OTP (stub)
- **Port**: Backend: 4000 | Frontend: 3000

## Module Status

| # | Module | FR IDs | Priority | Status | Notes |
|---|--------|--------|----------|--------|-------|
| 1 | Project Setup - Backend | — | High | Complete | Express + Prisma + SQLite scaffold |
| 2 | Project Setup - Frontend | — | High | Complete | Next.js 16 + Tailwind + ShadCN scaffold |
| 3 | Database Schema & Seed Data | — | High | Complete | 8 entities, 7 users, 6 events, seed script |
| 4 | Auth Module (Backend) | FR-01, FR-02 | High | Complete | JWT login/register + OAuth/OTP stubs |
| 5 | Auth Module (Frontend) | FR-01, FR-02 | High | Complete | Login, Register pages with demo accounts |
| 6 | Events Module (Backend) | FR-03, FR-04, FR-05 | High | Complete | List, detail, filter, create, update APIs |
| 7 | Events Module (Frontend) | FR-03, FR-04, FR-05 | High | Complete | Listing with filters, detail with FAQs/reviews |
| 8 | Registration Module (Backend) | FR-06, FR-07, FR-08 | High | Complete | Register, bib gen, payment stub, cancel |
| 9 | Registration Module (Frontend) | FR-06, FR-07, FR-08 | High | Complete | 4-step checkout (select→confirm→pay→done) |
| 10 | Results Module (Backend) | FR-09, FR-10 | High | Complete | CSV upload, leaderboard, rankings |
| 11 | Results Module (Frontend) | FR-09, FR-10 | High | Complete | Leaderboard on event detail page |
| 12 | Photos Module (Backend) | FR-11 | Medium | Complete | Upload + bib search (AI stubbed) |
| 13 | Photos Module (Frontend) | FR-11 | Medium | Complete | Photo gallery linked from profile |
| 14 | Certificates Module (Backend) | FR-12 | Medium | Complete | Certificate data gen (PDF stubbed) |
| 15 | Certificates Module (Frontend) | FR-12 | Medium | Complete | Download button on profile registrations |
| 16 | Reviews Module (Backend) | FR-13 | Medium | Complete | Create/list reviews, verified only |
| 17 | Reviews Module (Frontend) | FR-13 | Medium | Complete | Reviews section on event detail page |
| 18 | Notifications Module (Backend) | FR-14 | High | Complete | CRUD + auto-notifications on register/results |
| 19 | Organiser Dashboard (Backend) | FR-15 | High | Complete | Stats, events, participants, revenue |
| 20 | Organiser Dashboard (Frontend) | FR-15 | High | Complete | Dashboard with stats cards + event list |
| 21 | Admin Panel (Backend) | FR-16 | Medium | Complete | Approval queue, users, analytics, flagged |
| 22 | Admin Panel (Frontend) | FR-16 | Medium | Complete | Tabs: pending, users, analytics |
| 23 | Runner Profile (Backend) | FR-17 | Medium | Complete | Profile, PBs, registrations, upcoming |
| 24 | Runner Profile (Frontend) | FR-17 | Medium | Complete | Profile header, registrations tab, PBs tab |
| 25 | SEO & Meta Tags | FR-18 | Medium | Complete | Root metadata, MYMove branding |
| 26 | Home Page (Frontend) | — | High | Complete | Hero, search, featured, cities, how-it-works |
| 27 | Calendar Page (Frontend) | — | Medium | Complete | Monthly grid + event list |
| 28 | Integration & Testing | — | High | Complete | Backend API verified, frontend builds clean |

## Demo Accounts (password: password123)
| Email | Role |
|-------|------|
| admin@mymove.in | Admin |
| priya@mymove.in | Organiser |
| rajesh@mymove.in | Organiser |
| ananya@gmail.com | Runner |
| vikram@gmail.com | Runner |
| meera@gmail.com | Runner |
| arjun@gmail.com | Runner |

## How to Run
```bash
# Backend (terminal 1)
cd backend
npm run dev
# → http://localhost:4000

# Frontend (terminal 2)
cd frontend
npm run dev
# → http://localhost:3000
```

## Legend
- **Pending** — Not started
- **In Progress** — Currently being implemented
- **Complete** — Implemented and working
- **Blocked** — Waiting on dependency
