#!/bin/sh
set -eu

if [ "${NODE_ENV:-production}" = "production" ] && [ -z "${NEXTAUTH_SECRET:-}" ]; then
  echo "NEXTAUTH_SECRET must be set when NODE_ENV=production." >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:/data/trackmeprivately.db"
fi

case "$DATABASE_URL" in
  file:*)
    ;;
  *)
    echo "The current Prisma schema supports SQLite only. Set DATABASE_URL to a file: URL." >&2
    exit 1
    ;;
esac

mkdir -p /data

if [ ! -w /data ]; then
  echo "/data is not writable. Check the container volume configuration." >&2
  exit 1
fi

npx prisma db push --skip-generate

exec "$@"
