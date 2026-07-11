#!/bin/sh
set -e

export DATABASE_URL="${DATABASE_URL:-file:/data/prod.db}"

echo "[boot] DATABASE_URL=$DATABASE_URL"
npx prisma db push --skip-generate

exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
