#!/bin/sh
set -e

MAX_WAIT=60
ELAPSED=0
INTERVAL=2

echo "Checking for DATABASE_URL..."

while [ -z "$DATABASE_URL" ] && [ $ELAPSED -lt $MAX_WAIT ]; do
  echo "Waiting for DATABASE_URL... (${ELAPSED}s/${MAX_WAIT}s)"
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not available after ${MAX_WAIT} seconds"
  echo ""
  echo "Railway Setup Checklist:"
  echo "1. Ensure PostgreSQL service exists in your Railway project"
  echo "2. Link PostgreSQL service to your app service:"
  echo "   - Go to app service → Settings → Variables"
  echo "   - Click 'New Variable' or use Railway's service linking"
  echo "   - Select your PostgreSQL service"
  echo "3. Railway will auto-generate DATABASE_URL when services are linked"
  exit 1
fi

echo "✓ DATABASE_URL found"
echo "Running database migrations..."
npx prisma migrate deploy

echo "✓ Migrations completed"

