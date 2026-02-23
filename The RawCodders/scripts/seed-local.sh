#!/bin/bash
# Seed the local Convex database

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

if [ ! -f .env.local ]; then
    echo "Error: .env.local not found in $PROJECT_ROOT."
    exit 1
fi

# Load variables
echo "Loading variables from .env.local..."
export $(grep -v '^#' .env.local | xargs)

CONVEX_URL=${CONVEX_SELF_HOSTED_URL:-http://localhost:3210}
ADMIN_KEY=${CONVEX_SELF_HOSTED_ADMIN_KEY:-admin}

echo "Seeding database at $CONVEX_URL..."

# Check if the backend is reachable
if ! curl -s --head "$CONVEX_URL/version" > /dev/null; then
    echo "Error: Backend at $CONVEX_URL is not reachable."
    echo "Please ensure the backend service is running (e.g. ./scripts/dev.sh up)"
    exit 1
fi

echo "Running seed function..."
npx convex run seed:seed --url "$CONVEX_URL" --admin-key "$ADMIN_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully."
else
    echo "❌ Seeding failed."
    exit 1
fi
