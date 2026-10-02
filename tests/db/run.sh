#!/usr/bin/env bash
# Runs schema + seed + security tests on a throwaway LOCAL Postgres database.
# Usage: PGHOST=/tmp PGUSER=postgres ./tests/db/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${TEST_DB:-levelup_rls_test}
psql -qc "drop database if exists $DB" -c "create database $DB" >/dev/null
P="psql -d $DB -q -v ON_ERROR_STOP=1"
$P -f tests/db/00_mock_supabase.sql
$P -f supabase/schema.sql 2>&1 | grep -v NOTICE || true
$P -f supabase/schema.sql 2>&1 | grep -v NOTICE || true   # must be re-runnable
$P -f supabase/seed_import.sql
$P -f supabase/seed_import.sql                             # must be re-runnable
$P -f tests/db/10_rls_tests.sql 2>&1 | grep -oE "(PASS|FAIL|ERROR).*|ALL SECURITY.*"
