# Manus Office - Phase 0 Plan (for approval)

## 1. Folder structure (confirmed, with small changes)

```
manus-office/
  app/
    (auth)/login, change-password
    (staff)/home, drinks/new, meals, history, settings, install
    (helper)/board, drink-menu, meal-menu, meal-summary
    (admin)/users, settings
    api/health, api/push/register, api/cron/[job]
    manifest.ts, layout.tsx, offline/page.tsx
  actions/            server actions (orders, meals, users, menu) - zod + role re-check
  components/ (ui, drinks, meals, board, layout)
  lib/ (supabase/{client,server,admin,middleware}, auth, push, i18n, dates, validators, ratelimit)
  messages/ bn.ts, en.ts   (typed dictionaries)
  public/ icons, sw.js (PWA), firebase-messaging-sw.js
  supabase/migrations/001..006_*.sql
  supabase/tests/rls.test.sql
  scripts/seed-admin.ts
  docs/ OPERATIONS.md, GUIDE-STAFF-BN.md, GUIDE-HELPER-BN.md
  Dockerfile, .dockerignore, .env.example, README.md
```
Change: a separate `actions/` folder, `offline` page, and `supabase/tests`.

## 2. Key decisions

| Topic | Decision | Why |
|---|---|---|
| i18n | Typed dictionary + tiny provider (no next-intl) | Language is per-user (profile), no URL routing needed. Zero extra bundle weight, type-safe keys. |
| Push triggers | Server actions call `lib/push.ts` (no DB webhooks) | Simplest, one place for logic, easy to debug. |
| Orders/meals writes | Via server actions using the user's own session (RLS still enforced) | zod validation + rate limit + push, while DB stays the final gate. |
| Cron | pg_cron + pg_net -> `/api/cron/[job]`; jobs compute "minutes to lock" so they stay correct if lock time changes | Schedule never needs editing. |
| Synthetic email | `username@manus-office.app` style domain; confirmations OFF, no mail ever sent | Verified in Phase 1 against your Supabase project. |
| Supabase keys | New-style keys: `sb_publishable_...` (anon) and `sb_secret_...` (replaces service_role). Both work with @supabase/ssr. | Your project uses the new key format. |

## 3. Schema review - what I changed / added vs. your brief

The brief's SQL parses fine (FK on `(menu_item_id, menu_day_id)` with the composite unique is valid; the lock trigger works because BEFORE triggers run before NOT NULL checks). Problems found and fixes:

1. **Max 3 pending orders is not enforced in DB** -> add `BEFORE INSERT` trigger on `drink_orders` (counts pending, raises error).
2. **Staff could forge columns on insert/update** (`delivered_at`, `delivered_by`, or change `drink_id` while "cancelling") -> add guard trigger: staff may only flip `pending -> cancelled`; insert forces defaults. Helper update sets `delivered_by = auth.uid()`, `delivered_at = now()` automatically on `delivered`.
3. **Drink must be active**, sugar/milk must be null if drink does not support them -> validated in the same trigger.
4. **`meal_responses`**: add trigger to set `updated_at`, `updated_by = auth.uid()` always (cannot be forged), and require `menu_item_id` when `choice='in'` and the day has items. Staff cannot change another user's row (already by RLS).
5. **`profiles_guard`** also blocks changes to `id`; `must_change_password` can be cleared only by the user via the password-change server action (RPC), not by a raw update.
6. **Function privileges**: `revoke execute ... from public, anon` on all SECURITY DEFINER functions, grant only to `authenticated`.
7. **`meal_summary`** only returns "In" counts per item. Added `meal_overview(menu_day)` returning total In / Out / Not answered (active staff without a row) and a `meal_responses_detail(menu_day)` list (name, desk, choice, item) for helpers/admins.
8. **Realtime**: `replica identity full` on `drink_orders` and `meal_responses` so UPDATE events carry the old row. Realtime respects RLS, so staff only receive their own rows.
9. **Indexes**: `meal_responses(user_id)`, `menu_items(menu_day_id)`, `push_tokens(user_id)`.
10. **`app_settings`** value validation for `meal_lock_time` (HH:MM) via a check trigger.
11. **Cron idempotency helper**: SQL function `claim_job(job_name, run_key)` doing `insert ... on conflict do nothing` and returning whether this call won (atomic, service role only).
12. **Deactivated users (R6)**: all policies already rely on `app_role()` which returns null for inactive users; app additionally signs them out in middleware.

Migration files: `001_schema`, `002_guards_triggers`, `003_rls`, `004_realtime`, `005_seed`, `006_functions_rpc`.

## 4. RLS proof plan
`supabase/tests/rls.test.sql` runs inside a transaction using `set local role authenticated` + `set local request.jwt.claims` for staff / helper / admin / inactive / anon, and proves: staff cannot read others' orders, cannot change own role, cannot write a meal response after `lock_at` (test row with past `lock_at`), cannot exceed 3 pending, inactive user sees nothing.

## 5. Assumptions (defaults from the brief)
- UI is ENGLISH ONLY (owner decision, overrides brief): no Bangla, no language toggle, no `lang` column, English push text and English guides.
- Working days Sun-Thu (confirmed by owner); no backup job needed; Supabase free plan (health-check monitor required); lock 22:30 the previous day; reminders 21:30 / 22:15; summary 22:31.
- Drink defaults: Milk Tea, Red Tea, Green Tea, Lemon Tea, Coffee, Black Coffee.
- Brand: warm coffee-brown/amber placeholder; logo placeholder icons.
- Next.js latest stable, Tailwind, motion, lucide-react, zod, @supabase/ssr, firebase + firebase-admin. No shadcn dependency except hand-written minimal primitives (keeps bundle small).

## 6. Questions for the owner (not blocking Phase 1)
1. App domain / subdomain (e.g. order.yourdomain.com)? Needed for the synthetic email domain and cron URL. Placeholder until then.
2. Working days = Sat-Thu correct?
3. Nightly pg_dump backup to your VPS wanted?
4. Supabase plan (free or pro)? Free plan pauses after inactivity -> health-check monitor recommended.
5. I need the Supabase **secret key** (`sb_secret_...`) later for the seed-admin script and server actions. Put it only in `.env.local` yourself; never paste it in chat.
