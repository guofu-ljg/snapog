# SnapOG

Generate stunning Open Graph images via API — hosted on Cloudflare Workers, cached globally on R2, sub-100ms on cache hit.

## Quick Start

```bash
# Demo (no key) — watermarked, IP-limited:
curl "https://YOUR_WORKER.workers.dev/og?title=My+Blog+Post&domain=myblog.com" \
  --output og.png && open og.png

# Or get a free API key at /register, then:
curl "https://YOUR_WORKER.workers.dev/og?title=My+Blog+Post&domain=myblog.com&key=sk_YOUR_KEY" \
  --output og.png && open og.png
```

> Production host will be `*.workers.dev` until custom domain `snapog.dev` is attached.

## API

```
GET /og
  ?title=Your Page Title     # required, max 120 chars
  &key=sk_your_key           # required
  &description=Subtitle      # optional, max 200 chars
  &domain=yourdomain.com     # optional
  &author=Jane Doe           # optional
  &tag=Tutorial              # optional, shown as pill badge
  &template=default          # default | blog | article
  &theme=dark                # dark | light
```

Returns `image/png`, 1200×630.

Headers:
- `X-Cache: HIT|MISS` — whether served from R2 cache
- `X-SnapOG-Tier: free|pro|business`

## HTML Integration

```html
<meta property="og:image"
      content="https://snapog.dev/og?title=YOUR_TITLE&key=YOUR_KEY" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card"   content="summary_large_image" />
<meta name="twitter:image"  content="https://snapog.dev/og?title=YOUR_TITLE&key=YOUR_KEY" />
```

## Pricing

| Tier | Price | Images/month |
|------|-------|-------------|
| Free | $0 | 100 |
| Pro | $19/mo | 10,000 |
| Business | $49/mo | 100,000 |

Free tier images include "snapog.dev" watermark.

## Local Development

### Prerequisites
- Node.js 18+, npm
- Wrangler (`npm install` pulls it)

### Setup

```bash
cd projects/snapog   # or repo root if you cloned guofu-ljg/snapog
npm install
npm run db:local
npm run dev          # default wrangler port — or: npx wrangler dev --port 8799
```

### Temporary public demo (NON-PRODUCTION)

Secrets / workers.dev not ready yet? One command starts local Worker + a temporary reverse tunnel (cloudflared if present, else localhost.run):

```bash
bash scripts/public-demo.sh
```

Prints a temporary public BASE URL and verifies `/health` + `/og` PNG. **Do not** use that URL for Show HN or as the production Base URL — run `scripts/set-github-secrets.sh` for durable `*.workers.dev`.

### Test

```bash
BASE_URL=http://127.0.0.1:8799 bash sample/smoke-test.sh
# with key:
API_KEY=sk_your_key BASE_URL=http://127.0.0.1:8799 bash sample/smoke-test.sh
```

### Typecheck

```bash
npm run typecheck
```

## Deployment

### One command (recommended)

1. Create a Cloudflare API Token (**Edit Cloudflare Workers**) and copy Account ID.  
2. Run:

```bash
export CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=...
bash scripts/set-github-secrets.sh   # writes GitHub Secrets + triggers Actions deploy
```

PASS: Actions green → `/health` 200 → `curl "$BASE/og?title=hi"` returns PNG.

CI soft-skips on push when Secrets are missing (no red main). Manual **Run workflow** without Secrets still fails loudly.

### Local bootstrap (optional)

```bash
npm install
export CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=...
# or: npx wrangler login
bash scripts/bootstrap-prod.sh
```

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com/) — edge compute
- [Hono](https://hono.dev/) — HTTP framework
- [workers-og](https://github.com/nicholasgasior/workers-og) — OG image generation (Satori-based)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite for usage tracking
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — image cache storage
