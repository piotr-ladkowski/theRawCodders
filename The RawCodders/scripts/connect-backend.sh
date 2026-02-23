#!/bin/bash
# Sources .env.local and exports environment for local convex CLI use

# Ensure we are in the script's directory's parent (project root)
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

# Set deployment variables for convex CLI
export CONVEX_DEPLOYMENT="local:$(echo $CONVEX_SELF_HOSTED_URL | sed 's|^https*://||')"
export CONVEX_URL="$CONVEX_SELF_HOSTED_URL"
export ADMIN_KEY="$CONVEX_SELF_HOSTED_ADMIN_KEY"

echo "---------------------------------------------------"
echo "Convex CLI Environment Configured for LOCALHOST"
echo "URL: $CONVEX_URL"
echo "Deployment: $CONVEX_DEPLOYMENT"
echo "---------------------------------------------------"

# If arguments are provided, run that command
if [ "$#" -gt 0 ]; then
    exec "$@"
else
    # Otherwise spawn a shell
    echo "Spawning new shell with these variables set..."
    exec $SHELL
fi
