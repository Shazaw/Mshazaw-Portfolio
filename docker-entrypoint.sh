#!/bin/sh
set -e

# Bring the mounted database up to the current schema before serving. Safe to
# run on every boot: Payload skips migrations it has already applied.
echo "· applying migrations to ${DATABASE_URI}"
npx payload migrate

exec "$@"
