#!/usr/bin/env bash
# Uji kebijakan keamanan (Row Level Security) di server Postgres LOKAL untuk pengujian.
# JANGAN jalankan ke database produksi: skrip ini membuat database baru berisi skema auth tiruan.
# Koneksi memakai variabel standar libpq, misalnya:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres bash tests/run-rls.sh
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
run() {
  local db=$1; shift
  psql -d postgres -v ON_ERROR_STOP=1 -q -c "drop database if exists $db" -c "create database $db"
  psql -d "$db" -v ON_ERROR_STOP=1 -q -f "$DIR/supabase/test-stub.sql" -f "$DIR/supabase/schema.sql" -f "$DIR/supabase/courses.sql" -f "$DIR/supabase/roles.sql" -f "$DIR/supabase/course-access.sql" -f "$DIR/supabase/reports.sql" -f "$DIR/supabase/hardening.sql" 2>&1 | grep -v NOTICE || true
  for f in "$@"; do psql -d "$db" -v ON_ERROR_STOP=1 -f "$DIR/supabase/$f"; done
}
run nalar_uji_rls test-rls.sql
run nalar_uji_rls2 test-rls-courses.sql
run nalar_uji_rls3 test-rls-roles.sql
run nalar_uji_rls4 test-rls-reports.sql
run nalar_uji_rls5 test-rls-hardening.sql
