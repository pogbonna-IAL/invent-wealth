#!/bin/sh
set -e

echo "🚀 Starting application..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until npx prisma db execute --command "SELECT 1" > /dev/null 2>&1; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "✅ Database is ready!"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed database if SEED_DATABASE is set
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed
fi

echo "✅ Setup complete! Starting application..."

# Start the application
exec "$@"

