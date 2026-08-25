#!/usr/bin/env bash
# SnapOG — quick API smoke (requires a running server: local or deployed)
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8787}"
KEY="${API_KEY:-}"

echo "=== SnapOG API smoke test ==="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: health
echo "[1] GET /health"
HEALTH_JSON="$(curl -sS -f "$BASE_URL/health")"
echo "  $HEALTH_JSON"
echo "$HEALTH_JSON" | grep -q '"ok":true\|"ok": true' || {
  echo "  ✗ health missing ok:true"
  exit 1
}
echo "  ✓ health"

# Test 2: demo /og (no key) — landing path
echo "[2] GET /og (demo, no key)"
DEMO_OUT="$(mktemp "${TMPDIR:-/tmp}/snapog-demo.XXXXXX")"
DEMO_CODE="$(curl -sS -o "$DEMO_OUT" -w "%{http_code}" \
  "$BASE_URL/og?title=Hello+Demo&domain=test.com")"
DEMO_CT="$(file -b --mime-type "$DEMO_OUT" 2>/dev/null || file -b "$DEMO_OUT")"
DEMO_SIZE="$(wc -c < "$DEMO_OUT" | tr -d ' ')"
echo "  HTTP $DEMO_CODE · $DEMO_CT · ${DEMO_SIZE}B"
if [[ "$DEMO_CODE" != "200" ]]; then
  echo "  ✗ demo /og expected 200"
  head -c 400 "$DEMO_OUT"; echo
  exit 1
fi
if [[ "$DEMO_SIZE" -lt 1000 ]]; then
  echo "  ✗ demo PNG too small"
  exit 1
fi
case "$DEMO_CT" in
  image/png*|PNG*|*"PNG image"*) ;;
  *)
    # file(1) may say "PNG image data" — accept if magic OK
    if ! xxd -p -l 8 "$DEMO_OUT" | grep -qi '^89504e470d0a1a0a'; then
      echo "  ✗ not a PNG (content-type/file: $DEMO_CT)"
      exit 1
    fi
    ;;
esac
echo "  ✓ demo /og PNG"

# Test 3: auth /og (optional)
if [[ -n "$KEY" ]]; then
  echo "[3] GET /og?key=… (auth)"
  OUT="$(mktemp "${TMPDIR:-/tmp}/snapog-test.XXXXXX")"
  HTTP_CODE="$(curl -sS -o "$OUT" -w "%{http_code}" \
    "$BASE_URL/og?title=Hello+World&description=Test&domain=test.com&key=$KEY")"
  SIZE="$(wc -c < "$OUT" | tr -d ' ')"
  echo "  HTTP $HTTP_CODE · ${SIZE}B → $OUT"
  if [[ "$HTTP_CODE" != "200" || "$SIZE" -lt 1000 ]]; then
    echo "  ✗ auth /og failed"
    exit 1
  fi
  echo "  ✓ auth /og PNG"
else
  echo "[3] Skipped auth /og (API_KEY not set)"
fi

# Test 4: upgrade CTA visible on /
echo "[4] GET / — Upgrade CTA"
HOME_HTML="$(curl -sS -f "$BASE_URL/")"
echo "$HOME_HTML" | grep -q 'Upgrade to Pro\|/upgrade\|Upgrade' || {
  echo "  ✗ upgrade CTA not found on landing"
  exit 1
}
echo "  ✓ upgrade CTA present"

echo ""
echo "✓ Smoke test passed"
