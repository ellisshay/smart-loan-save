#!/bin/bash
# Builds an isolated local staging database: Supabase-compatible bootstrap + all production migrations
# (supabase/migrations, then drizzle/migrations) + synthetic seed. Never connects to production.
# Usage: PGHOST=<socket dir> PGPORT=<port> ./apply-local.sh
set -euo pipefail
cd "$(dirname "$0")"; ROOT=../..
PSQL="psql -U postgres -v ON_ERROR_STOP=1 -q"
$PSQL -d postgres -c "DROP DATABASE IF EXISTS em WITH (FORCE)" -c "CREATE DATABASE em"
sed 's/ALTER DATABASE postgres/ALTER DATABASE em/' bootstrap.sql | $PSQL -d em -f - >/dev/null
apply() {
  # pg_cron/pg_net are unavailable locally (a stub cron.job table stands in, see bootstrap.sql);
  # the drizzle 0006 statements that schedule jobs against the PRODUCTION URL are stripped.
  sed -E "/CREATE EXTENSION IF NOT EXISTS (pg_cron|pg_net)/d; /cron\\.schedule\\(/d; /cron\\.unschedule\\('/d" "$1" | $PSQL -d em -f - >/dev/null
}
# Lovable used supabase/migrations until 2026-10-06 and drizzle/migrations from 2026-10-08 on.
for f in $ROOT/supabase/migrations/*.sql; do apply "$f"; done
for f in $ROOT/drizzle/migrations/0*.sql; do
  [[ "${SKIP_SECURITY:-}" == 1 && "$f" == *0008_security_p0.sql ]] && continue
  apply "$f"
done   # 0000..0008 (0008 = SECURITY-B; SKIP_SECURITY=1 builds the pre-fix baseline)
$PSQL -d em -f seed_synthetic.sql
echo "staging database ready (synthetic data only)"
