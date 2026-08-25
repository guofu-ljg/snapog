#!/usr/bin/env bash
# SnapOG — write Cloudflare secrets to GitHub Actions, then trigger deploy.
# Never prints or commits token values.
#
# Usage:
#   export CLOUDFLARE_API_TOKEN="..."
#   export CLOUDFLARE_ACCOUNT_ID="..."
#   bash scripts/set-github-secrets.sh
#
# Optional:
#   REPO=guofu-ljg/snapog          # default
#   SKIP_WORKFLOW_RUN=1           # set secrets only
#   WATCH=1                       # gh run watch after dispatch
set -euo pipefail

REPO="${REPO:-guofu-ljg/snapog}"
WORKFLOW="${WORKFLOW:-deploy}"

red()  { printf '\033[31m%s\033[0m\n' "$*"; }
green(){ printf '\033[32m%s\033[0m\n' "$*"; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    red "缺少命令: $1"
    exit 1
  }
}

need_cmd gh

if ! gh auth status >/dev/null 2>&1; then
  red "gh 未登录。先跑: gh auth login"
  exit 1
fi

# Accept common aliases
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" && -n "${CF_API_TOKEN:-}" ]]; then
  CLOUDFLARE_API_TOKEN="$CF_API_TOKEN"
fi
if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" && -n "${CF_ACCOUNT_ID:-}" ]]; then
  CLOUDFLARE_ACCOUNT_ID="$CF_ACCOUNT_ID"
fi

prompt_if_empty() {
  local var_name="$1"
  local hint="$2"
  local current="${!var_name:-}"
  if [[ -n "$current" ]]; then
    return 0
  fi
  if [[ ! -t 0 ]]; then
    red "未设置 ${var_name}，且非交互环境。请 export 后重跑。"
    exit 1
  fi
  bold "${hint}"
  # -s for token; account id is not secret-level but still avoid shell history via read
  if [[ "$var_name" == *TOKEN* ]]; then
    read -r -s -p "${var_name}: " value
    echo ""
  else
    read -r -p "${var_name}: " value
  fi
  if [[ -z "$value" ]]; then
    red "${var_name} 为空"
    exit 1
  fi
  printf -v "$var_name" '%s' "$value"
}

prompt_if_empty CLOUDFLARE_API_TOKEN "粘贴 Cloudflare API Token（Edit Cloudflare Workers）"
prompt_if_empty CLOUDFLARE_ACCOUNT_ID "粘贴 Cloudflare Account ID"

bold "=== SnapOG set-github-secrets → ${REPO} ==="

printf '%s' "${CLOUDFLARE_API_TOKEN}" | gh secret set CLOUDFLARE_API_TOKEN --repo "${REPO}"
green "✓ CLOUDFLARE_API_TOKEN set"

printf '%s' "${CLOUDFLARE_ACCOUNT_ID}" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo "${REPO}"
green "✓ CLOUDFLARE_ACCOUNT_ID set"

# Clear locals (best-effort; does not wipe caller shell exports)
CLOUDFLARE_API_TOKEN=""
CLOUDFLARE_ACCOUNT_ID=""

if [[ "${SKIP_WORKFLOW_RUN:-}" == "1" ]]; then
  green "Secrets 已写入。跳过 workflow（SKIP_WORKFLOW_RUN=1）。"
  echo "手动触发: gh workflow run ${WORKFLOW} --repo ${REPO}"
  exit 0
fi

bold "触发 workflow: ${WORKFLOW}"
gh workflow run "${WORKFLOW}" --repo "${REPO}"
green "✓ workflow_dispatch 已发送"
echo "Actions: https://github.com/${REPO}/actions/workflows/${WORKFLOW}.yml"

if [[ "${WATCH:-}" == "1" ]]; then
  echo "等待 run 出现…"
  sleep 3
  RUN_ID="$(gh run list --repo "${REPO}" --workflow "${WORKFLOW}" --limit 1 --json databaseId --jq '.[0].databaseId' || true)"
  if [[ -n "${RUN_ID}" && "${RUN_ID}" != "null" ]]; then
    gh run watch "${RUN_ID}" --repo "${REPO}"
  else
    red "未能解析 run id；请打开 Actions 页面查看。"
  fi
fi

echo ""
bold "PASS 判据"
echo "  Actions 全绿 → 记下 workers.dev Base URL"
echo "  curl \"\$BASE/health\"           # 200 + ok:true"
echo "  curl \"\$BASE/og?title=hi\" -o /tmp/og.png && file /tmp/og.png  # PNG"
