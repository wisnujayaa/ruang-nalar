#!/usr/bin/env bash
# Uji kebijakan keamanan (Row Level Security) di Postgres LOKAL yang kosong.
# JANGAN jalankan ke database produksi: skrip ini membuat skema auth tiruan.
# Pemakaian: PGURL=postgres://user:pass@localhost:5432/ujirls bash tests/run-rls.sh
set -euo pipefail
: "${PGURL:?Set PGURL ke database Postgres uji yang kosong}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$DIR/supabase/test-stub.sql"
psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$DIR/supabase/schema.sql"
psql "$PGURL" -v ON_ERROR_STOP=1 -f "$DIR/supabase/test-rls.sql"
