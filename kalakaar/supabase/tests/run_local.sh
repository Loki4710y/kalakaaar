#!/usr/bin/env bash
# Runs migrations + RLS tests against a LOCAL scratch Postgres (never a real project).
# Usage: PGHOST=... PGPORT=... PGUSER=postgres ./supabase/tests/run_local.sh
set -e
cd "$(dirname "$0")/.."
psql -q -c "drop database if exists kalakaar_test" -c "create database kalakaar_test" 2>&1 | grep -v NOTICE || true
for f in tests/00_shim.sql migrations/001_schema.sql migrations/002_rls.sql migrations/003_storage.sql migrations/004_reports.sql migrations/005_rate_limits.sql migrations/006_contact_clicks.sql migrations/007_scale.sql migrations/008_account_and_stats.sql migrations/009_artist_analytics.sql; do
  psql -q -d kalakaar_test -v ON_ERROR_STOP=1 -f "$f" 2>&1 | grep -v NOTICE || true
done
psql -q -d kalakaar_test -f tests/rls_test.sql 2>&1 | grep -E "FAIL|passed|failed|^ *[0-9]+ \||ERROR"
