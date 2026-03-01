# CLAUDE.md

## Project Overview

**Habits** is a personal habit-tracking web app built with Next.js 15 (App Router). Users sign in via Clerk, create habits with emoji + color, and toggle daily completions on a 14-day grid. A scorecard page shows streaks, heatmaps, day-of-week stats, and milestones. The app is a PWA deployed on AWS Amplify.

## Tech Stack

- **Framework:** Next.js 15.4 (App Router, React 19, Turbopack dev server)
- **Language:** TypeScript (strict mode)
- **Auth:** Clerk (`@clerk/nextjs`)
- **Database:** PostgreSQL via Prisma ORM
- **State Management:** Zustand (with devtools middleware)
- **Styling:** Tailwind CSS 3 + CSS variables (dark-first theme), shadcn/ui components
- **Data Fetching:** Plain `fetch` wrappers in `lib/api.ts` with optimistic updates + debounced sync (`lib/sync.ts`)
- **PWA:** `next-pwa` with custom service worker (`public/sw.js`)
- **Icons:** Lucide React
- **Date Utilities:** date-fns
- **Deployment:** AWS Amplify (see `amplify.yml`)
- **Package Manager:** Yarn

## Commands

```bash
yarn install          # Install dependencies
yarn dev              # Start dev server (Turbopack) on port 3000
yarn build            # Production build
yarn lint             # ESLint (next/core-web-vitals + next/typescript)
npx prisma generate   # Regenerate Prisma client after schema changes
npx prisma migrate dev # Apply pending migrations in development
```

## Verify Build After Changes

After making any code changes, always verify the build succeeds before committing:

```bash
yarn build
```

If `yarn build` fails, fix all type errors, lint issues, and build warnings before proceeding. The build must pass cleanly — do not commit code that breaks the production build.

## Project Structure

```
app/
  layout.tsx              # Root layout (ClerkProvider, ThemeProvider, PWA)
  page.tsx                # Main page — auth gate, habit grid, scorecard routing
  globals.css             # Tailwind + CSS variable theme (dark-first)
  api/
    habits/
      route.ts            # CRUD for habits (GET/POST/PUT/DELETE)
      toggle-completion/
        route.ts          # Toggle habit completion for a date (POST)
      sort-order/
        route.ts          # Batch-update habit sort order (PUT)
    quote/
      route.ts            # Daily quote with DB caching (GET)

components/
  habit-list.tsx          # Main habit grid with drag-and-drop reordering
  habit-modal.tsx         # Create/edit habit modal (emoji, color picker)
  header.tsx              # Top bar (sync status, user avatar, navigation)
  sidebar.tsx             # Slide-out navigation drawer
  scorecard.tsx           # Stats dashboard (streaks, heatmap, milestones)
  daily-quote.tsx         # Motivational quote footer
  pwa-install-prompt.tsx  # PWA install banner
  pwa-update-prompt.tsx   # Auto-update service worker handler
  theme-provider.tsx      # next-themes wrapper
  ui/                     # shadcn/ui primitives (button, card)

lib/
  store.ts                # Zustand store — all client state + actions
  api.ts                  # Typed fetch wrappers for all API endpoints
  sync.ts                 # Debounced optimistic sync engine for toggles
  utils.ts                # cn(), toDateString(), getCurrentDate(), streak helpers
  emoji.ts                # Single-emoji validation (Intl.Segmenter)
  scorecard-stats.ts      # Derived stats: streaks, heatmap, day-of-week, milestones
  db.ts                   # Prisma client singleton
  use-swipe-edge.ts       # Edge swipe hook for opening sidebar on mobile

prisma/
  schema.prisma           # Habit, HabitCompletion, Quote models
  migrations/             # PostgreSQL migration history

public/
  manifest.json           # PWA manifest
  sw.js                   # Service worker
  *.png, *.svg            # App icons and assets
```

## Architecture & Key Patterns

### Optimistic Updates with Debounced Sync
The app uses an optimistic UI pattern. When a user toggles a habit completion:
1. `toggleCompletionInStore()` immediately updates Zustand state
2. `scheduleToggleSync()` debounces the API call (300ms) — rapid toggles on the same habit+date are coalesced
3. The final desired state is read from the store when the API fires, guaranteeing consistency
4. On error, `safeRefetch()` reloads all habits from the server (deduplicated)

### 4am Day Boundary
`getCurrentDate()` in `lib/utils.ts` treats hours before 4am as the previous day. This affects the habit grid, streak calculation, and scorecard stats.

### Auth Pattern
All `/api/habits/*` routes are protected by Clerk middleware (`middleware.ts`). API route handlers call `await auth()` to get the `userId` and scope all DB queries to that user.

### State Management
All UI state lives in a single Zustand store (`lib/store.ts`): habits array, loading/error state, pending operation count, drag state, current page, sidebar visibility, and modal state. Habit ordering is persisted to localStorage as a fallback.

### Component Conventions
- All components are client components (`"use client"`) except the root layout
- No `pages/` directory — App Router only
- shadcn/ui components use the `@/components/ui` path with `components.json` config
- Path alias: `@/*` maps to project root

### Database
- PostgreSQL with Prisma ORM
- Three models: `Habit`, `HabitCompletion`, `Quote`
- `HabitCompletion` has a composite unique constraint on `[habitId, userId, date]`
- Cascade deletes: deleting a Habit removes its HabitCompletions
- Dates are stored as UTC midnight (`@db.Date`)

### Styling Conventions
- Dark theme by default (pure black `#000000` background)
- HSL CSS variables for all theme tokens (defined in `globals.css`)
- Tailwind utility classes — no CSS modules
- Habit colors are applied inline as hex values with transparency suffixes (e.g., `${color}15`)

## Environment Variables

Required (not committed — see `.gitignore`):
- `DATABASE_URL` — PostgreSQL connection string
- `CLERK_SECRET_KEY` — Clerk backend key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk frontend key

## Coding Conventions

- **Tabs for indentation** (visible in all source files)
- **TypeScript strict mode** — no `any` unless unavoidable
- **Imports:** Use `@/` path alias for all project imports
- **API routes:** Return `NextResponse.json()` with appropriate status codes
- **Error handling:** API routes wrap in try/catch, log to console, return structured error JSON
- **No test suite** — there are no tests in this project currently
- **Formatting:** Double quotes for JSX attributes, template literals for dynamic strings
