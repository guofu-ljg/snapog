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
- Wrangler (`npm install -g wrangler`)
- A Cloudflare account with Workers access

### Setup

```bash
cd projects/snapog
npm install

# 1. Create D1 database
wrangler d1 create snapog-db
# Copy the returned database_id into wrangler.toml [d1_databases]

# 2. Apply migrations locally
npm run db:local

# 3. Create R2 bucket (local R2 is simulated)
# No setup needed for local dev — wrangler simulates R2

# 4. Start dev server
npm run dev
```

Open http://127.0.0.1:8787

### Test

```bash
# Register a key via browser at http://127.0.0.1:8787/register
# Then test with:
API_KEY=sk_your_key bash sample/smoke-test.sh

# Or direct curl:
curl "http://127.0.0.1:8787/og?title=Hello+World&key=sk_your_key" --output og.png
```

### Typecheck

```bash
npm run typecheck
```

## Deployment

### Recommended: GitHub Actions (no local `wrangler login`)

1. Cloudflare → API Tokens → **Edit Cloudflare Workers** → copy token + Account ID  
2. GitHub repo Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`  
3. Actions → **deploy** → Run workflow  

CI creates D1/R2 if needed, applies migrations, sets `AUTH_SECRET`, deploys, then checks `/health` + demo `/og` PNG.

Full runbook: see Auto-Company `docs/devops/cycle-15-snapog-ci-deploy.md` (or this repo’s Actions logs).

### Local / token bootstrap

```bash
npm install
# either:
export CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=...
# or: npx wrangler login
bash scripts/bootstrap-prod.sh
# optional: printf '%s' 'https://buy.stripe.com/XXX' | npx wrangler secret put STRIPE_PAYMENT_LINK
```

### Manual

```bash
wrangler d1 create snapog-db   # paste database_id into wrangler.toml
npm run db:remote
wrangler r2 bucket create snapog-og-cache
wrangler deploy
```

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com/) — edge compute
- [Hono](https://hono.dev/) — HTTP framework
- [workers-og](https://github.com/nicholasgasior/workers-og) — OG image generation (Satori-based)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite for usage tracking
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — image cache storage
