
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

cd "$ROOT_DIR"


CMD="${1:-help}"
if [ $# -gt 0 ]; then
    shift
fi

case "$CMD" in
    up)
        echo "Starting services..."
        docker compose --env-file "$ENV_FILE" up -d --build "$@"
        echo "Services started:"
        echo "  - Backend: http://localhost:3210"
        echo "  - Dashboard: http://localhost:6791"
        echo "  - Frontend: http://localhost:5173"
        echo "  - AI Service: http://localhost:18020"
        ;;
    down)
        echo "Stopping services..."
        docker compose --env-file "$ENV_FILE" down "$@"
        ;;
    logs)
        docker compose --env-file "$ENV_FILE" logs -f "$@"
        ;;
    rebuild)
        echo "Rebuilding services..."
        docker compose --env-file "$ENV_FILE" build --no-cache "$@"
        ;;
    sync)
        echo "Syncing environment variables to Convex..."
        docker compose --env-file "$ENV_FILE" run --rm convex-deploy sh -lc '
set -euo pipefail

node - <<'"'"'NODE'"'"'
const fs = require("fs");

function parseEnv(path) {
  const txt = fs.readFileSync(path, "utf8");
  const out = {};
  let i = 0;

  while (i < txt.length) {
    while (i < txt.length && (txt[i] === "\n" || txt[i] === "\r")) i++;
    if (i >= txt.length) break;

    if (txt[i] === "#") {
      while (i < txt.length && txt[i] !== "\n") i++;
      continue;
    }

    let key = "";
    while (i < txt.length && /[A-Za-z0-9_]/.test(txt[i])) key += txt[i++];

    while (i < txt.length && (txt[i] === " " || txt[i] === "\t")) i++;

    if (txt[i] !== "=") {
      while (i < txt.length && txt[i] !== "\n") i++;
      continue;
    }
    i++;

    while (i < txt.length && (txt[i] === " " || txt[i] === "\t")) i++;

    let val = "";
    if (txt[i] === "\"") {
      i++;
      while (i < txt.length) {
        if (txt[i] === "\"" && txt[i - 1] !== "\\") {
          i++;
          break;
        }
        val += txt[i++];
      }
    } else {
      while (i < txt.length && txt[i] !== "\n" && txt[i] !== "\r") val += txt[i++];
      val = val.trim();
    }

    if (key) out[key] = val;

    while (i < txt.length && txt[i] !== "\n") i++;
  }

  return out;
}

(async () => {
  const env = parseEnv("/app/.env.local");
  const base = process.env.CONVEX_SELF_HOSTED_URL;
  const adminKey = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY;

  if (!base) throw new Error("Missing CONVEX_SELF_HOSTED_URL");
  if (!adminKey) throw new Error("Missing CONVEX_SELF_HOSTED_ADMIN_KEY");

  const changes = [];
  if (env.SITE_URL) changes.push({ name: "SITE_URL", value: env.SITE_URL });
  if (env.JWT_PRIVATE_KEY) changes.push({ name: "JWT_PRIVATE_KEY", value: env.JWT_PRIVATE_KEY });
  if (env.JWKS) changes.push({ name: "JWKS", value: env.JWKS });

  if (changes.length === 0) {
    console.log("No env vars to sync (SITE_URL, JWT_PRIVATE_KEY, JWKS missing in .env.local). Skipping.");
    return;
  }

  const res = await fetch(`${base}/api/v1/update_environment_variables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${adminKey}`,
    },
    body: JSON.stringify({ changes }),
  });

  if (!res.ok) {
    console.error("Failed:", res.status, await res.text());
    process.exit(1);
  }

  console.log("✅ Convex env vars synced.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
NODE
'
        ;;

    seed)
        echo "Seeding Convex database..."
        docker compose --env-file "$ENV_FILE" run --rm convex-deploy sh -lc '
set -euo pipefail

: "${CONVEX_SELF_HOSTED_URL:?Missing CONVEX_SELF_HOSTED_URL}"
: "${CONVEX_SELF_HOSTED_ADMIN_KEY:?Missing CONVEX_SELF_HOSTED_ADMIN_KEY}"

echo "Running seed:seed..."
npx convex run seed:seed --url "$CONVEX_SELF_HOSTED_URL" --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY"
echo "✅ Database seeded."
'
        ;;

    deploy-convex)
        echo "Syncing env vars, deploying Convex functions, and seeding DB..."
        docker compose --env-file "$ENV_FILE" run --rm convex-deploy sh -lc '
set -euo pipefail

# ---- Sync Convex Env Vars ----
node - <<'"'"'NODE'"'"'
const fs = require("fs");

function parseEnv(path) {
  const txt = fs.readFileSync(path, "utf8");
  const out = {};
  let i = 0;

  while (i < txt.length) {
    while (i < txt.length && (txt[i] === "\n" || txt[i] === "\r")) i++;
    if (i >= txt.length) break;
    if (txt[i] === "#") { while (i < txt.length && txt[i] !== "\n") i++; continue; }

    let key = "";
    while (i < txt.length && /[A-Za-z0-9_]/.test(txt[i])) key += txt[i++];
    while (i < txt.length && (txt[i] === " " || txt[i] === "\t")) i++;

    if (txt[i] !== "=") { while (i < txt.length && txt[i] !== "\n") i++; continue; }
    i++;
    while (i < txt.length && (txt[i] === " " || txt[i] === "\t")) i++;

    let val = "";
    if (txt[i] === "\"") {
      i++;
      while (i < txt.length) {
        if (txt[i] === "\"" && txt[i - 1] !== "\\") { i++; break; }
        val += txt[i++];
      }
    } else {
      while (i < txt.length && txt[i] !== "\n" && txt[i] !== "\r") val += txt[i++];
      val = val.trim();
    }

    if (key) out[key] = val;
    while (i < txt.length && txt[i] !== "\n") i++;
  }
  return out;
}

(async () => {
  const env = parseEnv("/app/.env.local");
  const base = process.env.CONVEX_SELF_HOSTED_URL;
  const adminKey = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY;

  for (const k of ["SITE_URL", "JWT_PRIVATE_KEY", "JWKS"]) {
    if (!env[k] || env[k].length === 0) throw new Error(`Missing ${k} in .env.local`);
  }
  if (!base) throw new Error("Missing CONVEX_SELF_HOSTED_URL");
  if (!adminKey) throw new Error("Missing CONVEX_SELF_HOSTED_ADMIN_KEY");

  const res = await fetch(`${base}/api/v1/update_environment_variables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${adminKey}`,
    },
    body: JSON.stringify({
      changes: [
        { name: "SITE_URL", value: env.SITE_URL },
        { name: "JWT_PRIVATE_KEY", value: env.JWT_PRIVATE_KEY },
        { name: "JWKS", value: env.JWKS },
      ],
    }),
  });

  if (!res.ok) {
    console.error("Failed:", res.status, await res.text());
    process.exit(1);
  }
  console.log("✅ Convex env vars synced.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
NODE

# ---- Deploy Convex Functions ----
npm install --prefer-offline --no-audit --no-fund
npx convex deploy --yes --url "$CONVEX_SELF_HOSTED_URL" --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY"

# ---- Seed Database ----
echo "Seeding database..."
npx convex run seed:seed --url "$CONVEX_SELF_HOSTED_URL" --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY"
echo "✅ Convex deploy + seed complete."
'
        ;;

    help|*)
        echo "Usage: $0 {up|down|logs|rebuild|sync|seed|deploy-convex}"
        exit 1
        ;;
esac