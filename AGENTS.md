<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## 0. Scope and current state

- Work in **this repo only**: `wedplan-client`.
- A sibling `../wedplan-server` exists, but it is a **separate repo and out of scope**. Never edit it here.
- The working tree has intentional uncommitted work: `app/api/auth/[...all]/route.ts`, `lib/auth.ts`, `lib/auth-client.ts`, and package changes. **Refactor these; do not delete them.**
- `.env` exists and is gitignored. It currently contains `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
- `CLAUDE.md` contains `@AGENTS.md`, so this file is the single source of instructions for all agents.

## 1. Verified stack facts (check `package.json` before changing)

- Next.js **16.4.5**, React **19.3.1**, TypeScript strict, Tailwind CSS **4**, shadcn **4** (`components.json`), Better Auth **1.7.26**, `next-themes`, `lucide-react`, `sonner` (toasts to add), `motion` (add for animation), `mongodb` and `jose` (add for adapter + JWT), `zod` (add for validation).
- Install UI primitives with `npx shadcn@latest add <component>` — do not hand-roll shadcn components.
- Next 16 notes: Middleware is now **`proxy.ts`** (read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Dynamic route `params`/`searchParams` are async. Use `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx`, `app/global-error.tsx`.
- Add remote image hosts to `next.config.ts` (`images.remotePatterns`) before rendering ImgBB/placeholder images with `next/image`.

## 2. Architecture (already agreed)

- **Better Auth lives in the Next app.** MongoDB adapter with `usePlural: true` so its user collection is `users`, shared with Express.
- User extra fields: `role` (`customer | vendor | admin`, default `customer`), `isBlocked` (default `false`), `businessName`, `subscriptionPlan` (`free | premium`), `subscriptionExpiresAt`.
- Public signup must **never** create an admin: enforce in a `databaseHooks.user.create.before` hook and validate again in the form.
- `/api/auth/token` exchanges a valid Better Auth session for a short-lived HS256 JWT (`jose`, secret from `JWT_SECRET`). Express verifies it and re-checks the DB — the client never trusts its own role for authorization.
- Browser keeps the JWT in memory only (module-scoped store), attaches `Authorization: Bearer`, refreshes on `401`. No `localStorage` auth state.
- `NEXT_PUBLIC_USE_MOCK=true` enables a **dev-only** mock API so all screens work before the server exists. Mock is disabled in production. Remote mode is the default.
- Stripe premium is activated **only by server webhook**. The success page displays server state; it never flips the plan client-side.

## 3. Design system — ivory, rose gold, serif

- Background `#FDFBF7`, surface `#FFFFFF`, ink `#2B2321`, muted `#7A6F6A`, border `#EADDD8`.
- Primary rose `#B76E79`, hover `#9A5663`, accent gold `#C9A227`, success green, error rose-red.
- Headings: elegant serif via `next/font/google` (Playfair Display or Cormorant Garamond); body: Geist/Inter.
- Radii 16–24px, soft shadows, generous whitespace, responsive grid.
- Motion: fade + 12px translate, ~0.4s, small stagger; respect `prefers-reduced-motion`. No animation on forms/tables.

## 4. Structure to build

```
app/
  api/auth/[...all]/route.ts        (refactor existing)
  api/auth/token/route.ts
  api/upload/route.ts               (ImgBB proxy, key stays server-side)
  api/mock/[[...path]]/route.ts     (dev-only fixtures)
  page.tsx                          home
  services/page.tsx, services/[id]/page.tsx
  sign-in/page.tsx, sign-up/page.tsx
  payment/success/page.tsx, payment/cancel/page.tsx
  dashboard/layout.tsx, dashboard/page.tsx
  dashboard/vendor/{services,services/new,services/[id]/edit,bookings,subscription}/page.tsx
  dashboard/customer/bookings/page.tsx
  dashboard/admin/{users,services,transactions}/page.tsx
  dashboard/profile/page.tsx
  not-found.tsx, error.tsx, loading.tsx, global-error.tsx
  layout.tsx, globals.css
components/
  layout/{navbar,footer,user-menu,dashboard-sidebar}.tsx
  services/{service-card,service-filters,service-gallery,booking-form}.tsx
  auth/{sign-in-form,sign-up-form}.tsx
  dashboard/{stat-card,status-badge,data-table}.tsx
  common/{loader,empty-state,error-state,section-heading}.tsx
  providers/{auth-provider,toaster}.tsx
lib/
  auth.ts, auth-client.ts, api.ts, jwt.ts, env.ts, types.ts, utils.ts
  mock/{services,bookings,users,transactions}.ts
proxy.ts                            (optimistic redirects only, Next 16 name)
```

## 5. Environment variables (all secrets env-only)

Server: `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `IMGBB_API_KEY`.
Client: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_MOCK`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

Rules: add every key to `.env.example` with empty placeholders. Never commit `.env`. Never log secret values. Google/Stripe/ImgBB UI degrades gracefully when keys are absent.

## 6. API contract the client codes against

- Public: `GET /services?q=&category=&location=&sort=price_asc|price_desc`, `GET /services/:id`
- Auth: `GET /auth/me`
- Vendor: `GET|POST /vendor/services`, `PATCH|DELETE /vendor/services/:id`, `PATCH /vendor/services/:id/availability`, `GET /vendor/bookings`, `PATCH /vendor/bookings/:id` (`accept|reject`)
- Customer: `POST /bookings`, `GET /customer/bookings`, `PATCH /customer/bookings/:id/cancel`
- Admin: `GET /admin/users`, `PATCH /admin/users/:id/block`, `GET /admin/services`, `PATCH /admin/services/:id/status`, `DELETE /admin/services/:id`, `GET /admin/transactions`
- Payments: `POST /subscription/checkout` → returns Stripe Checkout URL
- Shared types in `lib/types.ts`: `User`, `VendorSummary`, `Service`, `Booking`, `Transaction`, `ApiError`.

## 7. Business rules (enforce in UI, never assume the API will)

- Public lists show only `status === "approved" && isActive`.
- Free vendor: max **3 active** services; premium: unlimited.
- Booking: customer only; not own service; admins cannot book; block duplicate active requests for same service + event date.
- Only `pending` bookings can be accepted, rejected, or cancelled.
- Vendors only see/modify their own services and bookings; customers only their own.
- Profile update excludes `role`, `isBlocked`, `subscriptionPlan`, `subscriptionExpiresAt`.
- Invalid service ID → proper error UI; failed API calls → toast, never `alert()`.

## 8. Step-by-step build order — one meaningful commit per step

| # | Work | Commit message |
|---|------|----------------|
| 1 | Theme tokens, globals, base styles | `chore: set up ivory and rose gold theme tokens` |
| 2 | Root layout metadata, fonts, providers | `feat: add serif headings and global providers to root layout` |
| 3 | Navbar with auth-aware state | `feat: build responsive navbar with auth-aware navigation` |
| 4 | Footer | `feat: add footer with navigation, contact and social links` |
| 5 | Better Auth config | `feat: configure Better Auth with MongoDB adapter and role fields` |
| 6 | JWT minting route | `feat: mint short-lived JWT from Better Auth session` |
| 7 | Typed API client | `feat: add typed API client with Bearer injection and error normalization` |
| 8 | Toasts + shared states | `feat: add toast provider and shared loading, empty and error states` |
| 9 | Dev mock API | `feat: add dev-only mock API for local UI development` |
| 10 | Home hero | `feat: build wedding hero banner with CTA` |
| 11 | Featured services | `feat: render approved featured services on home` |
| 12 | Categories | `feat: add category exploration section` |
| 13 | Why/how + motion | `feat: add Why Choose WedPlan and animated How It Works sections` |
| 14 | Browse page | `feat: build browse services page with search, filter and sort` |
| 15 | Service details | `feat: build service details page with gallery and vendor info` |
| 16 | Booking form | `feat: add validated booking request form` |
| 17 | Sign in | `feat: build sign-in page with credential and Google options` |
| 18 | Sign up | `feat: build sign-up page with role selection and validation` |
| 19 | Auth provider + guards + `proxy.ts` | `feat: add auth provider, proxy redirects and dashboard guard` |
| 20 | Dashboard shell | `feat: build role-based dashboard layout and sidebar` |
| 21 | Vendor overview + services | `feat: build vendor overview and service management` |
| 22 | Add service + booking actions | `feat: add service form with image upload and booking actions` |
| 23 | Subscription | `feat: build subscription page with premium checkout entry` |
| 24 | Customer dashboard | `feat: build customer overview and bookings management` |
| 25 | Admin dashboard | `feat: build admin users, services and transactions screens` |
| 26 | Profile settings | `feat: add profile settings with protected role and plan fields` |
| 27 | Payment pages | `feat: add payment success and cancel pages` |
| 28 | README | `docs: add full WedPlan client README` |
| 29 | QA polish | `fix: polish responsive layout and route reload behavior` |

Acceptance per step: typecheck + lint pass, no console errors, responsive at desktop/tablet/mobile, real loading/empty/error states, commit message matches work done.

## 9. Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npx shadcn@latest add button card input label select textarea dialog dropdown-menu sonner
```

## 10. Definition of done

- All public + private routes render and **reload correctly**.
- Role URL swaps redirect; blocked users cannot reach dashboards.
- Navbar reflects auth changes immediately.
- Search/filter/sort, booking rules, and free-plan cap behave correctly in mock and remote modes.
- No `.env` or secret tracked; no `alert()`; no fake premium activation.
- README includes features, stack, install, local run, live/repo links, env table, deployment notes, and admin test credentials placeholder.
