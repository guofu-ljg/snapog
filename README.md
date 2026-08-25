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

**Fast path (≤5 min after browser login):**

```bash
npm install
npx wrangler login
bash scripts/bootstrap-prod.sh
# optional: npx wrangler secret put STRIPE_PAYMENT_LINK
```

**Manual:**

```bash
# 1. Create remote D1 database
wrangler d1 create snapog-db
# Update wrangler.toml with the database_id

# 2. Apply migrations to remote
npm run db:remote

# 3. Create R2 bucket
wrangler r2 bucket create snapog-og-cache

# 4. Deploy
wrangler deploy
```

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com/) — edge compute
- [Hono](https://hono.dev/) — HTTP framework
- [workers-og](https://github.com/nicholasgasior/workers-og) — OG image generation (Satori-based)
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite for usage tracking
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — image cache storage
