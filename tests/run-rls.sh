#!/usr/bin/env bash
# Row Level Security tests against a LOCAL Postgres test server.
# NEVER point this at a production database: it creates fresh databases with a fake auth schema.
# Connection uses the standard libpq variables, e.g.:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres bash tests/run-rls.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
run() {
  local db=$1; shift
  psql -d postgres -v ON_ERROR_STOP=1 -q -c "drop database if exists $db" -c "create database $db"
  psql -d "$db" -v ON_ERROR_STOP=1 -q -f "$DIR/supabase/test-stub.sql" -f "$DIR/supabase/schema.sql" -f "$DIR/supabase/courses.sql" -f "$DIR/supabase/roles.sql" -f "$DIR/supabase/course-access.sql" -f "$DIR/supabase/reports.sql" -f "$DIR/supabase/hardening.sql" 2>&1 | grep -v NOTICE || true
  for f in "$@"; do psql -d "$db" -v ON_ERROR_STOP=1 -f "$DIR/supabase/$f"; done
}
run nalar_test_rls test-rls.sql
run nalar_test_rls2 test-rls-courses.sql
run nalar_test_rls3 test-rls-roles.sql
run nalar_test_rls4 test-rls-reports.sql
run nalar_test_rls5 test-rls-hardening.sql
