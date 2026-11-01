# Security staging tests (synthetic data only)

Nothing here connects to production. All people, ID numbers, salaries, documents and signatures are fake.

## 1. Local database staging (`apply-local.sh` + `run-db-tests.mjs`)
Builds an isolated PostgreSQL database with a Supabase-compatible bootstrap (roles `anon` / `authenticated` / `service_role`, `auth.uid()` from JWT claims, `storage.objects` + `storage.foldername`). It then applies every production migration in production order and seeds synthetic users: Customer A, Customer B, Admin, Operations, Mortgage advisor, Supervisor, plus Borrower 2 inside A's case.

Each scenario runs inside `BEGIN … ROLLBACK` as a specific user, the same way PostgREST applies a JWT. This makes the RLS, storage policy and RPC results real for the database layer.

```bash
PGHOST=<socket dir> PGPORT=<port> ./apply-local.sh                    # with SECURITY-B (0007)
SKIP_SECURITY=1 PGHOST=<socket dir> PGPORT=<port> ./apply-local.sh    # pre-fix baseline
PGHOST=<socket dir> PGPORT=<port> node run-db-tests.mjs after
```

- The cron jobs in `drizzle/migrations/0006` call the **production** function URL, so they are stripped from the local build.
- Results (2026-11-01): **baseline 19/29, after 29/29.**

## 2. Hosted staging (`run-hosted-tests.mjs`)
For behavior that only a real Supabase project shows: signed-URL expiry, logout, deployed Edge Functions, and end-to-end uploads.

**Setup:**
- Create a **separate** Supabase project.
- Apply the migrations and deploy the functions.
- Set `STAGING_SUPABASE_URL`, `STAGING_ANON_KEY` and `STAGING_SERVICE_ROLE_KEY` as environment secrets. Never paste them in chat or commit them.
- Never copy production data or secrets.

```bash
node run-hosted-tests.mjs
```

The script refuses to run against the production project ref.

## Known behavior (do not claim otherwise publicly)
- **A signed URL stays valid until it expires (5 minutes),** even after logout or a permission change. Logout does not revoke an already-issued link.
- **Uploaded documents use `cacheControl: 60`.** A deleted object may still be served from cache for up to about a minute.
