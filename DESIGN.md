# ChessGuideX — System Design

Digital chess learning platform for a chess academy. Students log in, work through
level-based courses (Beginner / Intermediate / Advanced) made of interactive lessons,
solve puzzles, track progress, and earn a certificate at 100% completion.

---

## 1. Tech Stack

| Layer       | Choice                                  | Notes |
|-------------|------------------------------------------|-------|
| Framework   | Next.js 16 (App Router, TypeScript)      | Turbopack by default; `proxy` replaces `middleware`; async `params`/`cookies()` |
| Database    | Supabase (PostgreSQL 15+)                | Hosted Postgres with Auth, Storage, Realtime, RLS |
| ORM         | Prisma 7 + `@prisma/adapter-pg`          | Driver adapter connects through Supavisor pooler |
| Auth        | Supabase Auth (email/password + Google)  | JWTs + RLS; session cookies via `@supabase/ssr` |
| Chess UI    | `react-chessboard` + `chess.js`          | Board rendering + legal-move engine (FEN/PGN handling) |
| Certificates| `@react-pdf/renderer` (server-side PDF)  | Generated in a Route Handler, stored in Supabase Storage |
| Validation  | `zod`                                    | Server + client input validation |
| Styling     | Tailwind CSS v4 (+ shadcn/ui later)      | Scaffolded with Tailwind |

### Why this stack
- Next.js Server Components serve lesson content (fast, cacheable) while Client
  Components host the interactive board and quiz interactions.
- Supabase gives auth + Postgres + object storage in one managed product — no
  separate auth server or file server to operate.
- Prisma 7 with the `pg` driver adapter is the documented path for connecting to
  Supabase via the **transaction pooler** (scales with many concurrent users).
- Lichess data is used as a **seed source** (CC0 database), never a runtime
  dependency, so there is no rate-limit risk.

### Environment variables
See `.env.example`. Summary:

```
DATABASE_URL             Supavisor transaction pooler (Prisma Client, runtime)
DIRECT_URL               Supavisor direct connection (Prisma CLI: migrate/generate)
NEXT_PUBLIC_SUPABASE_URL Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  Public anon/publishable key
SUPABASE_SERVICE_ROLE_KEY       Server-only admin key (never in client code)
```

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Student Browser                       │
│  Landing │ Login │ Dashboard │ Course │ Lesson │ Puzzle       │
│  Quiz │ Progress │ Certificate download │ /verify/[code]      │
└────────────┬──────────────────────────────────────────────────┘
             │ HTTPS
┌────────────▼──────────────────────────────────────────┐
│                   Next.js 16 (Vercel)                  │
│  Server Components (content)   Client Components (UI)  │
│  Server Actions (mutations)    Route Handlers (PDF)    │
│  src/proxy.ts — auth guard + session refresh           │
└────────────┬───────────────────────────────────────────┘
             │ Prisma (adapter-pg, transaction pooler)
┌────────────▼───────────────────────────────────────────┐
│                      Supabase                           │
│  ├─ Auth:   email/password + Google OAuth (RLS)         │
│  ├─ Postgres: courses, lessons, quizzes, puzzles,       │
│  │             progress, certificates (managed by Prisma)│
│  └─ Storage: certificate PDFs, lesson images/videos     │
└─────────────────────────────────────────────────────────┘
```

**Data flow principles**
- Read-heavy content (lessons, courses) is served by Server Components; cache via
  Next.js ISR / `cacheTag` where appropriate. Authenticated, per-user data
  (progress) is always dynamic.
- All mutations go through Server Actions that verify the Supabase session server-side
  (`supabase.auth.getUser()`) before touching the DB.
- Never trust `getSession()` on the server; use `getUser()`.

---

## 3. Database Schema (Prisma Models)

```prisma
User 1──< LessonProgress >──1 Lesson >──1 Course (level: BEGINNER|INTERMEDIATE|ADVANCED)
User 1──< PuzzleAttempt   >──1 Puzzle  >──< CoursePuzzle >──1 Course
User 1──< Enrollment      >──1 Course
User 1──< Certificate     >──1 Course
Lesson 0..1── Quiz 1──< QuizQuestion (MULTIPLE_CHOICE | BOARD)
```

### Model responsibilities

| Model             | Purpose |
|-------------------|---------|
| `User`            | Profile mirror of `supabase.auth.users`; role `STUDENT` / `ADMIN` |
| `Course`          | A level. Sluggable, ordered, publishable (draft vs live) |
| `Lesson`          | Belongs to a Course. `content` = JSON block array of text + board demos; optional linked Quiz |
| `Quiz`            | Gates a lesson: `minScore`% to pass |
| `QuizQuestion`    | Multiple-choice (`options` + `correctAnswer`) or board-move (`fen` + `correctAnswer` UCI array) |
| `Puzzle`          | Imported from Lichess DB. FEN + UCI solution + rating + themes |
| `CoursePuzzle`    | Assignment of a Puzzle to a Course (a puzzle may be reused across courses) |
| `LessonProgress`  | Per user/lesson: quiz score, passed flag, completion timestamp (unique user+lesson) |
| `PuzzleAttempt`   | Per attempt: solved? time, attempts used (history rows) |
| `Enrollment`      | Links a student to a course they can access |
| `Certificate`     | Issued at 100% progress; unique `verificationCode` + `pdfUrl` |

### Progress calculation
Course progress % = `passed lessons / total published lessons × 100` for that course.
A lesson is **passed** when its quiz is completed with `score >= quiz.minScore`.
Courses without a quiz mark the lesson passed on "Mark complete".

Certificate is issued atomically when progress first reaches 100% (Server Action
executes `LessonProgress.upsert`, recomputes progress, and calls
`issueCertificateIfEligible` which generates the PDF and inserts the `Certificate` row).

---

## 4. Repository / App Structure (target)

```
src/
├─ app/
│  ├─ (marketing)/page.tsx          # landing
│  ├─ (auth)/login/page.tsx
│  ├─ (auth)/register/page.tsx
│  ├─ (auth)/auth/confirm/route.ts  # email confirmation callback
│  ├─ (student)/
│  │  ├─ dashboard/page.tsx         # progress overview
│  │  ├─ courses/page.tsx           # level cards
│  │  ├─ courses/[slug]/page.tsx    # lesson list + progress
│  │  ├─ courses/[slug]/lessons/[lessonSlug]/page.tsx
│  │  ├─ puzzles/page.tsx
│  │  └─ certificates/page.tsx
│  ├─ admin/                        # owner dashboard (protected ADMIN)
│  ├─ verify/[code]/page.tsx        # public certificate verification
│  └─ api/certificates/[id]/route.ts# PDF download/storage
├─ components/
│  └─ chess/Chessboard.tsx          # react-chessboard + chess.js wrapper
├─ lib/
│  ├─ db.ts                         # Prisma singleton (adapter-pg)
│  ├─ supabase/client.ts            # browser client
│  ├─ supabase/server.ts            # server client (cookies)
│  ├─ progress.ts                   # progress math + certificate eligibility
│  └─ validations/*.ts              # zod schemas
├─ actions/                         # 'use server' mutations
├─ generated/prisma/                # generated Prisma client (gitignored)
└─ proxy.ts                         # auth guard (root, not under src/app)
prisma/
├─ schema.prisma
├─ migrations/
└─ seed/
   ├─ courses.json                  # courses + lessons + quizzes
   └─ import-lichess-puzzles.ts     # Lichess DB → Puzzle rows
```

---

## 5. Lichess Puzzle Pipeline

Source: `https://database.lichess.org` → `lichess_db_puzzle.csv.zst` (CC0, ~6M puzzles)

CSV columns: `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags,DailyDate`

Import script (`prisma/seed/import-lichess-puzzles.ts`):
1. Download + decompress `.zst` (or reference the HuggingFace mirror).
2. Filter rows by theme + rating buckets → curriculum map:
   - BEGINNER    → mate-in-1, basic captures, rating ≤ 1000 (~1,500 puzzles)
   - INTERMEDIATE→ forks, pins, skewers, mate-in-2, rating 1000–1500 (~2,000 puzzles)
   - ADVANCED    → defended captures, endgames, zugzwang, rating 1500+ (~1,500 puzzles)
3. Upsert into `Puzzle`, insert `CoursePuzzle` assignments.
4. Run as an npm script (`npm run seed:puzzles`) — repeatable, batch via unique `lichessId`.

FEN from the CSV is the position **before the first opponent move**; store the full
solution `Moves` and replay validation with `chess.js` in the puzzle UI.

---

## 6. Auth & Security Model

- Supabase Auth issues JWT; `@supabase/ssr` stores session in cookies.
- `src/proxy.ts` protects `/dashboard`, `/courses`, `/admin` — refreshes session,
  redirects anonymous users to `/login?redirect=...`.
- Pages/actions additionally call `await supabase.auth.getUser()` server-side
  (never `getSession()`).
- Row Level Security (applied via Supabase migrations alongside Prisma):
  - `courses`, `lessons`, `puzzles`, `quizzes` → `SELECT` for `authenticated` (and
    public for `anon` if the marketing/guest view is enabled).
  - `lesson_progress`, `puzzle_attempts`, `certificates`, `enrollments` →
    `SELECT/INSERT/UPDATE` only where `auth.uid() = user_id`.
  - Admin routes checked via `User.role === 'ADMIN'` inside Server Components/Actions
    (set the role through the Supabase dashboard or a guarded script).
- Prisma Client runs server-side with the transaction-pooler `DATABASE_URL`; the
  service-role key is never exposed to the browser.

---

## 7. Certificate Flow

1. Student reaches 100% on a course → Server Action detects threshold.
2. Route Handler `/api/certificates` renders a PDF with `@react-pdf/renderer`
   (student name, course/level, issue date, unique verification code + QR).
3. PDF stored in Supabase Storage bucket `certificates` (private), URL saved on
   `Certificate.pdfUrl`.
4. Student downloads it from the dashboard; public `/verify/[code]` page shows the
   certificate details by `verificationCode` (no auth needed, proof-of-completion).

---

## 8. Build Phases

1. **Foundation (this scaffold)** — Next.js 16 app, Prisma schema, env placeholders,
   supabase clients, `proxy.ts`, landing page.
2. **Auth** — login/register pages, email confirmation, Google OAuth, protected routes.
3. **Content** — course/lesson seed files, lesson viewer with interactive board demos,
   quiz component.
4. **Puzzles** — Lichess import script, puzzle solve UI, `PuzzleAttempt` recording.
5. **Progress & certificates** — dashboard with percentage bars, certificate engine.
6. **Admin panel** — course/lesson CRUD, student roster, progress reports.
7. **Polish** — guest view, responsive/mobile, optional multi-language.

---

## 9. Scaling Notes

- Lesson content is static-ish → Next.js ISR/cache keeps DB reads cheap.
- Supabase transaction pooler (Supavisor) scales connections far beyond the Postgres
  direct limit; Prisma runs against the pooled URL.
- Puzzles live in Postgres (indexed on `rating`, `themes`) → fast filtered queries,
  no third-party dependency at runtime.
- Future additions (payments, real-time class boards, engine analysis) slot in
  without schema changes: add `Subscription`/`Payment`, use Supabase Realtime, or
  expose a Stockfish/WASM analysis service.