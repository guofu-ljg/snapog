#!/usr/bin/env bash
# SnapOG — production bootstrap (D1 + R2 + migrate + secret + deploy + health)
# Prerequisite: `npx wrangler login` (browser once). Does NOT claim success if health fails.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WRANGLER=(npx --yes wrangler)
DB_NAME="snapog-db"
R2_BUCKET="snapog-og-cache"
TOML="wrangler.toml"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    red "缺少命令: $1"
    exit 1
  }
}

need_cmd jq
need_cmd curl
need_cmd openssl
need_cmd npm
need_cmd sed

bold "=== SnapOG bootstrap-prod ==="
echo "cwd: $ROOT"
echo ""

# ── 0. deps ───────────────────────────────────────────────────────────────────
if [[ ! -d node_modules ]]; then
  echo "[0] npm install"
  npm install
fi

# ── 1. whoami ─────────────────────────────────────────────────────────────────
echo "[1] wrangler whoami"
WHOAMI_OUT="$("${WRANGLER[@]}" whoami 2>&1)" || true
echo "$WHOAMI_OUT"
if echo "$WHOAMI_OUT" | grep -qiE 'not authenticated|Please run .*login'; then
  red "未登录 Cloudflare。先在本机执行（浏览器一次）："
  echo "  cd $ROOT && npx wrangler login"
  exit 1
fi
green "✓ 已认证"

# ── helpers ───────────────────────────────────────────────────────────────────
write_database_id() {
  local id="$1"
  if [[ -z "$id" || "$id" == "null" ]]; then
    red "无效 database_id"
    exit 1
  fi
  if sed --version >/dev/null 2>&1; then
    sed -i "s/database_id = \".*\"/database_id = \"${id}\"/" "$TOML"
  else
    sed -i '' "s/database_id = \".*\"/database_id = \"${id}\"/" "$TOML"
  fi
  green "✓ 已写入 wrangler.toml database_id=${id}"
}

prompt_database_id() {
  if [[ -n "${DATABASE_ID:-}" ]]; then
    echo "$DATABASE_ID"
    return
  fi
  red "无法自动拿到 database_id。请粘贴 UUID（或重跑前设 DATABASE_ID=...）："
  read -r -p "database_id> " _id
  echo "$_id"
}

list_database_id() {
  local list_json
  list_json="$("${WRANGLER[@]}" d1 list --json 2>/dev/null || true)"
  [[ -z "$list_json" ]] && return 0
  echo "$list_json" | jq -r --arg n "$DB_NAME" '
    (if type=="array" then . else (.result // .databases // []) end)
    | map(select(.name==$n))
    | .[0].uuid // .[0].database_id // .[0].id // empty
  '
}

# ── 2. D1 create / database_id ────────────────────────────────────────────────
CURRENT_ID="$(grep -E '^\s*database_id\s*=' "$TOML" | head -1 | sed -E 's/.*"([^"]+)".*/\1/' || true)"

if [[ -n "${CURRENT_ID}" ]] && ! echo "${CURRENT_ID}" | grep -qiE 'placeholder|CHANGE_ME|^$'; then
  green "✓ D1 database_id 已配置: ${CURRENT_ID}"
else
  echo "[2] wrangler d1 create ${DB_NAME}"
  DB_ID=""

  # Try JSON create
  if CREATE_JSON="$("${WRANGLER[@]}" d1 create "$DB_NAME" --json 2>/dev/null)"; then
    DB_ID="$(echo "$CREATE_JSON" | jq -r '.uuid // .database_id // .id // empty')"
  else
    # Human output or already-exists
    set +e
    CREATE_TXT="$("${WRANGLER[@]}" d1 create "$DB_NAME" 2>&1)"
    CREATE_RC=$?
    set -e
    echo "$CREATE_TXT"
    DB_ID="$(echo "$CREATE_TXT" | grep -Eo '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1 || true)"
    if [[ -z "$DB_ID" ]]; then
      bold "create 未解析到 UUID（rc=${CREATE_RC}）。尝试 d1 list…"
      DB_ID="$(list_database_id)"
    fi
  fi

  if [[ -z "$DB_ID" ]]; then
    DB_ID="$(prompt_database_id)"
  fi
  write_database_id "$DB_ID"
fi

# ── 3. R2 bucket ──────────────────────────────────────────────────────────────
echo "[3] wrangler r2 bucket create ${R2_BUCKET}"
set +e
R2_OUT="$("${WRANGLER[@]}" r2 bucket create "$R2_BUCKET" 2>&1)"
R2_RC=$?
set -e
echo "$R2_OUT"
if [[ "$R2_RC" -eq 0 ]]; then
  green "✓ R2 bucket 已创建"
else
  bold "R2 create 非零退出（常见：已存在）— 继续"
fi

# ── 4. migrations ─────────────────────────────────────────────────────────────
echo "[4] d1 migrations apply --remote"
"${WRANGLER[@]}" d1 migrations apply "$DB_NAME" --remote
green "✓ migrations applied"

# ── 5. AUTH_SECRET ────────────────────────────────────────────────────────────
echo "[5] wrangler secret put AUTH_SECRET"
if [[ -n "${AUTH_SECRET:-}" ]]; then
  SECRET="$AUTH_SECRET"
else
  SECRET="$(openssl rand -hex 32)"
fi
printf '%s' "$SECRET" | "${WRANGLER[@]}" secret put AUTH_SECRET
green "✓ AUTH_SECRET 已设置"

if [[ -n "${STRIPE_PAYMENT_LINK:-}" ]]; then
  echo "[5b] wrangler secret put STRIPE_PAYMENT_LINK"
  printf '%s' "$STRIPE_PAYMENT_LINK" | "${WRANGLER[@]}" secret put STRIPE_PAYMENT_LINK
  green "✓ STRIPE_PAYMENT_LINK 已设置"
else
  bold "跳过 STRIPE_PAYMENT_LINK（可选）。需要时："
  echo "  echo 'https://buy.stripe.com/XXXX' | npx wrangler secret put STRIPE_PAYMENT_LINK"
fi

# ── 6. deploy ─────────────────────────────────────────────────────────────────
echo "[6] wrangler deploy"
DEPLOY_OUT="$("${WRANGLER[@]}" deploy 2>&1)"
echo "$DEPLOY_OUT"
BASE_URL="$(echo "$DEPLOY_OUT" | grep -Eo 'https://[a-zA-Z0-9._-]+\.workers\.dev' | head -1 || true)"
if [[ -z "$BASE_URL" && -n "${SNAPOG_BASE_URL:-}" ]]; then
  BASE_URL="$SNAPOG_BASE_URL"
fi
if [[ -z "$BASE_URL" ]]; then
  red "未能从 deploy 输出解析 workers.dev URL。"
  echo "请设置 SNAPOG_BASE_URL=https://snapog.<account>.workers.dev 后手动 curl /health。"
  exit 1
fi
green "✓ deployed → $BASE_URL"

# ── 7. health ─────────────────────────────────────────────────────────────────
echo "[7] curl /health"
HTTP_CODE="$(curl -sS -o /tmp/snapog-health.json -w '%{http_code}' "$BASE_URL/health" || true)"
echo "HTTP $HTTP_CODE"
cat /tmp/snapog-health.json 2>/dev/null || true
echo ""
if [[ "$HTTP_CODE" != "200" ]]; then
  red "✗ /health 未返回 200 — 部署未验证成功。查: npx wrangler tail"
  exit 1
fi
if ! jq -e '.ok == true' /tmp/snapog-health.json >/dev/null 2>&1; then
  red "✗ /health JSON 无 ok:true — 部署未验证成功"
  exit 1
fi
green "✓ /health OK"

bold ""
bold "下一步（OG PNG 成功判据，需 API key）："
cat <<EOF
  # 注册 key
  curl -sS -X POST "$BASE_URL/register" \\
    -H 'Content-Type: application/x-www-form-urlencoded' \\
    --data-urlencode "email=ops@example.com" \\
    --data-urlencode "keyname=smoke" \\
    --data-urlencode "tier=free" -o /tmp/snapog-reg.html
  API_KEY=\$(grep -oE 'sk_[a-f0-9]{64}' /tmp/snapog-reg.html | head -1)

  # 期望 HTTP 200 + PNG
  curl -sS -o /tmp/snapog-hi.png -w "HTTP %{http_code}\\n" \\
    "$BASE_URL/og?title=hi&key=\${API_KEY}"
  file /tmp/snapog-hi.png
EOF

green ""
green "bootstrap 完成：Worker 已部署且 /health=200。OG PNG 请按上方命令验证（未自动宣称 /og 成功）。"
echo "BASE_URL=$BASE_URL"
