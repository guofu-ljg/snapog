#!/usr/bin/env bash
# SnapOG — temporary public demo (NON-PRODUCTION).
# Starts local wrangler + a reverse tunnel so the internet can curl /og.
#
# Usage:
#   bash scripts/public-demo.sh
#   PORT=8799 bash scripts/public-demo.sh
#
# Prefer cloudflared (TryCloudflare) when installed; else localhost.run via SSH.
# Do NOT put the printed URL in launch kit / Show HN — wait for workers.dev.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8799}"
LOG_DIR="${TMPDIR:-/tmp}/snapog-public-demo"
mkdir -p "$LOG_DIR"
WRANGLER_LOG="$LOG_DIR/wrangler.log"
TUNNEL_LOG="$LOG_DIR/tunnel.log"
URL_FILE="$LOG_DIR/public-url.txt"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    red "缺少命令: $1"
    exit 1
  }
}

need_cmd curl
need_cmd npm

bold "=== SnapOG public-demo (临时 / 非生产) ==="
echo "项目: $ROOT"
echo "端口: $PORT"
echo ""

cd "$ROOT"

if [[ ! -d node_modules ]]; then
  bold "npm install…"
  npm install
fi

npm run db:local >/dev/null

# Already listening?
if curl -fsS -m 2 "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
  green "✓ wrangler 已在 :${PORT} 运行"
else
  bold "启动 wrangler dev…"
  # shellcheck disable=SC2086
  npx wrangler dev --port "$PORT" --ip 127.0.0.1 --local >"$WRANGLER_LOG" 2>&1 &
  echo $! >"$LOG_DIR/wrangler.pid"
  for i in $(seq 1 40); do
    if curl -fsS -m 1 "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
      green "✓ wrangler Ready on http://127.0.0.1:${PORT}"
      break
    fi
    if [[ "$i" -eq 40 ]]; then
      red "wrangler 未在时限内就绪；见 $WRANGLER_LOG"
      exit 1
    fi
    sleep 0.5
  done
fi

start_cloudflared() {
  local bin=""
  if command -v cloudflared >/dev/null 2>&1; then
    bin="$(command -v cloudflared)"
  elif [[ -x "$HOME/.local/bin/cloudflared" ]]; then
    bin="$HOME/.local/bin/cloudflared"
  else
    return 1
  fi
  bold "隧道: cloudflared TryCloudflare ($bin)"
  "$bin" tunnel --url "http://127.0.0.1:${PORT}" >"$TUNNEL_LOG" 2>&1 &
  echo $! >"$LOG_DIR/tunnel.pid"
  for i in $(seq 1 40); do
    if grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1 >"$URL_FILE"; then
      [[ -s "$URL_FILE" ]] && return 0
    fi
    sleep 0.5
  done
  return 1
}

start_localhost_run() {
  need_cmd ssh
  bold "隧道: localhost.run (ssh reverse)"
  # -n: no stdin; -T: no tty
  ssh -n -T \
    -o StrictHostKeyChecking=accept-new \
    -o UserKnownHostsFile=/dev/null \
    -o ServerAliveInterval=30 \
    -o ExitOnForwardFailure=yes \
    -R "80:127.0.0.1:${PORT}" \
    nokey@localhost.run >"$TUNNEL_LOG" 2>&1 &
  echo $! >"$LOG_DIR/tunnel.pid"
  for i in $(seq 1 40); do
    if grep -Eo 'https://[a-zA-Z0-9.-]+\.(lhr\.life|localhost\.run)' "$TUNNEL_LOG" 2>/dev/null | head -1 >"$URL_FILE"; then
      [[ -s "$URL_FILE" ]] && return 0
    fi
    sleep 0.5
  done
  return 1
}

PUBLIC_URL=""
if start_cloudflared || start_localhost_run; then
  PUBLIC_URL="$(tr -d '[:space:]' <"$URL_FILE")"
else
  red "未能解析公网 URL。隧道日志: $TUNNEL_LOG"
  exit 1
fi

green "✓ 公网临时 URL: $PUBLIC_URL"
echo "$PUBLIC_URL" >"$URL_FILE"

bold "验收中…"
HEALTH="$(curl -fsS -m 20 "${PUBLIC_URL}/health" || true)"
echo "  /health → $HEALTH"
echo "$HEALTH" | grep -q '"ok":true\|"ok": true' || {
  red "公网 /health 失败"
  exit 1
}

OG_OUT="$(mktemp "${TMPDIR:-/tmp}/snapog-og.XXXXXX")"
OG_CODE="$(curl -sS -m 60 -o "$OG_OUT" -w "%{http_code}" "${PUBLIC_URL}/og?title=hi" || echo 000)"
OG_SIZE="$(wc -c <"$OG_OUT" | tr -d ' ')"
if [[ "$OG_CODE" != "200" || "$OG_SIZE" -lt 1000 ]]; then
  red "公网 /og 失败 HTTP=$OG_CODE size=$OG_SIZE"
  exit 1
fi
if ! xxd -p -l 8 "$OG_OUT" | grep -qi '^89504e470d0a1a0a'; then
  red "公网 /og 不是 PNG"
  exit 1
fi
green "✓ 公网 /og → PNG (${OG_SIZE}B) → $OG_OUT"

echo ""
bold "PASS（AI 临时 demo）"
echo "  BASE=$PUBLIC_URL"
echo "  curl \"\$BASE/health\""
echo "  curl \"\$BASE/og?title=hi\" -o /tmp/og.png && file /tmp/og.png"
echo ""
red "禁：把此 URL 写入 launch kit / 发 Show HN（等 workers.dev）"
echo "停：kill \$(cat $LOG_DIR/tunnel.pid) ；可选 kill wrangler pid"
echo "真生产：export CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… && bash scripts/set-github-secrets.sh"
