# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev       # Start dev server (PWA service worker disabled in dev)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

There are no automated tests in this project.

## Architecture

**Next.js 14 App Router** SPA for ViñoPlastic's employee training platform (Vertx).

### Path alias
`@/` maps to `./src/` (configured in `jsconfig.json`).

### Global providers (src/app/layout.js)
All pages are wrapped in: `ThemeProvider → AuthProvider → ToastProvider → MaintenanceGuard`

### Authentication (src/contexts/AuthContext.js)
Firebase Auth with three login methods:
- Email/password (`signIn`)
- Username lookup — resolves `username` field in Firestore `users` collection to email, then auth (`signInWithUsername`)
- Google OAuth (`signInWithGoogle`) — only pre-existing Firestore users allowed

**User roles** stored in `users/{uid}.rol`: `super_admin`, `rh`, `instructor`, `demo`
- Anonymous Firebase login → `rol: 'demo'`
- `canWrite()` returns true only for `super_admin`

### Route structure
| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login` | Unified login (email or username) |
| `/induccion` | Induction module — landing for demo users |
| `/induccion/cursos/[id]/editar` | Slide editor for induction courses |
| `/candidatos/dashboard` | Candidate self-service dashboard |
| `/capacitacion/*` | Admin training management (blocked for `demo` users via `DemoGuard`) |
| `/dashboard/*` | Admin overview dashboard |
| `/employees` | Employee directory |
| `/iluo-manager` | ILUO skill matrix management |
| `/mural` | Public recognition wall |
| `/presentacion` | Slide presentation viewer |
| `/training/*` | Trainer-facing dashboard |
| `/profile` | User profile / MFA setup |
| `/offline` | PWA offline fallback |

### Key Firestore collections
- `users` — authenticated admin/staff accounts with `rol` field
- `employees` — worker records (candidates and active employees)
- `employees_programacion` — employees in training schedules
- `cursos` + `cursos/{courseId}/slides` — interactive native courses
- `induction_courses` / `cursos_induccion` — induction-specific courses
- `programacion` — training schedule events
- `training_records` — completed training logs
- `promotions` / `promotion_rules` — promotion tracking
- `groups` — audit groups / brigades
- `exam_questions` — question bank
- `mural_exams` — recognition wall exam results (public `get`, no `list`)
- `audit_logs` — append-only activity log (any authenticated user can create)
- `app_config` — runtime configuration readable by all

### Styling
- **No Tailwind directives** — the project uses pure CSS with CSS custom properties.
- Global design tokens are in `src/styles/globals.css` (`:root` variables: `--color-primary`, `--bg-primary`, `--text-primary`, etc.).
- Component styles use **CSS Modules** (`.module.css` files co-located with components).
- Theme is forced to **light only** — `ThemeContext` has `setTheme`/`toggleTheme` disabled.
- Fonts are declared **only in `src/app/layout.js`** and exposed as CSS variables: `--font-body` (Roboto), `--font-serif` (Montserrat, used for headings), `--font-mono` (Roboto Mono). Always use these variables in CSS, never hardcode font families.

### Guards
- `DemoGuard` (`src/components/guards/DemoGuard/`) — redirects `demo` role users to `/induccion`. Wraps the entire `/capacitacion` layout.
- `MaintenanceGuard` — wraps root layout; can disable the app globally via `app_config`.

### PWA
Configured via `next-pwa` in `next.config.js`. Service worker is disabled in development (`NODE_ENV === 'development'`). Offline fallback page at `/offline`.

### Environment variables
Firebase config requires `.env.local` with:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Service layer
`src/lib/firebaseService.js` — `FirebaseService` class with generic CRUD methods. Most feature modules import `db` from `src/lib/firebase.js` directly and compose their own Firestore queries.
