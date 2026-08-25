// SnapOG — Main Cloudflare Worker
// Routes: GET /og, GET /, GET/POST /register, GET /dashboard, GET /upgrade

import { Hono } from 'hono';
import { generateOGImage, buildCacheKey } from './og/render';
import {
  landingPage,
  registerPage,
  keyCreatedPage,
  dashboardPage,
  errorPage,
  upgradePage,
  existingKeyPage,
} from './dashboard/pages';
import type { ApiKey, Env, OGParams } from './types';
import { DEMO_DAILY_LIMIT, TIER_LIMITS } from './types';

const app = new Hono<{ Bindings: Env }>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateRawKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'sk_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/** Pro/Business CTA：有 Payment Link 外链，否则 /upgrade */
function proCtaHref(env: Env): string {
  return env.STRIPE_PAYMENT_LINK?.trim() || '/upgrade';
}

function businessCtaHref(env: Env): string {
  return env.STRIPE_PAYMENT_LINK_BUSINESS?.trim()
    || env.STRIPE_PAYMENT_LINK?.trim()
    || '/upgrade';
}

function contactEmail(env: Env): string {
  return env.CONTACT_EMAIL?.trim() || 'hello@snapog.dev';
}

async function resolveApiKey(
  db: D1Database,
  rawKey: string | null
): Promise<ApiKey | null> {
  if (!rawKey) return null;
  const hash = await sha256(rawKey);
  const row = await db
    .prepare('SELECT * FROM api_keys WHERE key_hash = ?')
    .bind(hash)
    .first<ApiKey>();
  return row ?? null;
}

async function maybeResetUsage(db: D1Database, key: ApiKey): Promise<ApiKey> {
  const resetAt = new Date(key.usage_reset_at);
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (resetAt < thisMonth) {
    const newResetAt = thisMonth.toISOString();
    await db
      .prepare(
        'UPDATE api_keys SET usage_count = 0, usage_reset_at = ? WHERE id = ?'
      )
      .bind(newResetAt, key.id)
      .run();
    return { ...key, usage_count: 0, usage_reset_at: newResetAt };
  }
  return key;
}

async function recordUsage(
  db: D1Database,
  key: ApiKey,
  template: string,
  cacheHit: boolean
): Promise<void> {
  const eventId = crypto.randomUUID();
  await db.batch([
    db
      .prepare('UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = ?')
      .bind(key.id),
    db
      .prepare(
        'INSERT INTO usage_events (id, api_key_id, template, cache_hit) VALUES (?, ?, ?, ?)'
      )
      .bind(eventId, key.id, template, cacheHit ? 1 : 0),
  ]);
}

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  return (
    c.req.header('cf-connecting-ip')
    || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  );
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Demo 配额：IP 哈希 + 日，≤ DEMO_DAILY_LIMIT */
async function checkAndBumpDemoQuota(
  db: D1Database,
  ip: string
): Promise<{ ok: true } | { ok: false; count: number }> {
  const ipHash = await sha256(ip);
  const day = utcDay();

  await db
    .prepare(
      `INSERT INTO demo_quota (ip_hash, day, count) VALUES (?, ?, 0)
       ON CONFLICT(ip_hash, day) DO NOTHING`
    )
    .bind(ipHash, day)
    .run();

  const row = await db
    .prepare('SELECT count FROM demo_quota WHERE ip_hash = ? AND day = ?')
    .bind(ipHash, day)
    .first<{ count: number }>();

  const count = row?.count ?? 0;
  if (count >= DEMO_DAILY_LIMIT) {
    return { ok: false, count };
  }

  await db
    .prepare(
      'UPDATE demo_quota SET count = count + 1 WHERE ip_hash = ? AND day = ?'
    )
    .bind(ipHash, day)
    .run();

  return { ok: true };
}

function parseOgParams(q: Record<string, string>): OGParams | Response {
  const title = (q['title'] ?? '').trim().slice(0, 120);
  if (!title) {
    return new Response(JSON.stringify({ error: 'title parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return {
    title,
    description: (q['description'] ?? '').trim().slice(0, 200) || undefined,
    domain: (q['domain'] ?? '').trim().slice(0, 100) || undefined,
    author: (q['author'] ?? '').trim().slice(0, 80) || undefined,
    tag: (q['tag'] ?? '').trim().slice(0, 40) || undefined,
    theme: (q['theme'] === 'light' ? 'light' : 'dark') as 'dark' | 'light',
    template: (['blog', 'article'].includes(q['template'] ?? '')
      ? q['template']
      : 'default') as OGParams['template'],
  };
}

async function serveOgPng(
  c: {
    env: Env;
    executionCtx: ExecutionContext;
  },
  params: OGParams,
  opts: {
    watermark: boolean;
    tierLabel: string;
    afterCacheHit?: () => Promise<void>;
    afterMiss?: () => Promise<void>;
  }
): Promise<Response> {
  const cacheKey = await buildCacheKey(params, opts.watermark);
  const r2Key = `og/${cacheKey}.png`;

  const cached = await c.env.OG_CACHE.get(r2Key);
  if (cached) {
    if (opts.afterCacheHit) {
      await opts.afterCacheHit();
    }
    const imageData = await cached.arrayBuffer();
    return new Response(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'X-Cache': 'HIT',
        'X-SnapOG-Tier': opts.tierLabel,
      },
    });
  }

  const imageResponse = await generateOGImage(params, opts.watermark);
  const imageBuffer = await imageResponse.arrayBuffer();

  c.executionCtx.waitUntil(
    c.env.OG_CACHE.put(r2Key, imageBuffer.slice(0), {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: {
        tier: opts.tierLabel,
        template: params.template ?? 'default',
      },
    })
  );

  if (opts.afterMiss) {
    c.executionCtx.waitUntil(opts.afterMiss());
  }

  return new Response(imageBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      'X-Cache': 'MISS',
      'X-SnapOG-Tier': opts.tierLabel,
    },
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', c => {
  const host = new URL(c.req.url).host;
  return htmlResponse(
    landingPage(host, {
      proHref: proCtaHref(c.env),
      businessHref: businessCtaHref(c.env),
      proExternal: Boolean(c.env.STRIPE_PAYMENT_LINK?.trim()),
    })
  );
});

app.get('/upgrade', c => {
  return htmlResponse(
    upgradePage({
      proHref: c.env.STRIPE_PAYMENT_LINK?.trim() || null,
      businessHref: c.env.STRIPE_PAYMENT_LINK_BUSINESS?.trim() || null,
      contact: contactEmail(c.env),
    })
  );
});

// ── OG image generation ────────────────────────────────────────────────────────
app.get('/og', async c => {
  const q = c.req.query();
  const rawKey = q['key'] ?? null;

  const parsed = parseOgParams(q);
  if (parsed instanceof Response) return parsed;
  const params = parsed;

  // 无 key → demo：强制水印 + IP 日限流
  if (!rawKey) {
    const quota = await checkAndBumpDemoQuota(c.env.DB, clientIp(c));
    if (!quota.ok) {
      return c.json(
        {
          error: 'Demo daily limit reached',
          limit: DEMO_DAILY_LIMIT,
          hint: 'Register a free API key at /register',
        },
        429
      );
    }

    return serveOgPng(c, params, {
      watermark: true,
      tierLabel: 'demo',
    });
  }

  let apiKey = await resolveApiKey(c.env.DB, rawKey);
  if (!apiKey) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  apiKey = await maybeResetUsage(c.env.DB, apiKey);

  if (apiKey.usage_count >= apiKey.monthly_limit) {
    return c.json(
      {
        error: 'Monthly image limit reached',
        tier: apiKey.tier,
        limit: apiKey.monthly_limit,
        upgrade_url: '/upgrade',
      },
      429
    );
  }

  const watermark = apiKey.tier === 'free';
  const keyRef = apiKey;

  return serveOgPng(c, params, {
    watermark,
    tierLabel: apiKey.tier,
    afterCacheHit: () =>
      recordUsage(c.env.DB, keyRef, params.template ?? 'default', true),
    afterMiss: () =>
      recordUsage(c.env.DB, keyRef, params.template ?? 'default', false),
  });
});

// ── Registration ──────────────────────────────────────────────────────────────
app.get('/register', c => {
  // tier query 仅作展示提示，POST 永远 free
  return htmlResponse(registerPage(undefined, c.req.query('tier')));
});

app.post('/register', async c => {
  let email: string, keyname: string;
  try {
    const form = await c.req.formData();
    email = (form.get('email') as string ?? '').trim().toLowerCase();
    keyname = (form.get('keyname') as string ?? '').trim() || 'default';
    // 忽略 form tier — 永远只建 free（CFO 红旗）
  } catch {
    return htmlResponse(registerPage('Invalid form data'), 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return htmlResponse(registerPage('Please enter a valid email address'), 400);
  }

  await c.env.DB
    .prepare(
      'INSERT INTO users (id, email) VALUES (?, ?) ON CONFLICT(email) DO NOTHING'
    )
    .bind(crypto.randomUUID(), email)
    .run();

  const user = await c.env.DB
    .prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string }>();
  if (!user) {
    return htmlResponse(registerPage('Database error — please try again'), 500);
  }

  // 已有任意 key → 不重发完整 key（只存 hash）
  const existing = await c.env.DB
    .prepare(
      `SELECT id, key_prefix, tier FROM api_keys
       WHERE user_id = ? ORDER BY created_at ASC LIMIT 1`
    )
    .bind(user.id)
    .first<{ id: string; key_prefix: string; tier: string }>();

  if (existing) {
    return htmlResponse(
      existingKeyPage({
        email,
        keyPrefix: existing.key_prefix,
        tier: existing.tier,
        proHref: proCtaHref(c.env),
        contact: contactEmail(c.env),
      }),
      409
    );
  }

  // 永远 free tier
  const rawKey = generateRawKey();
  const keyHash = await sha256(rawKey);
  const keyPrefix = rawKey.slice(0, 12);
  const keyId = crypto.randomUUID();
  const resetAt = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  await c.env.DB
    .prepare(
      `INSERT INTO api_keys
         (id, user_id, name, key_prefix, key_hash, tier, monthly_limit, usage_reset_at)
       VALUES (?, ?, ?, ?, ?, 'free', ?, ?)`
    )
    .bind(keyId, user.id, keyname, keyPrefix, keyHash, TIER_LIMITS.free, resetAt)
    .run();

  return htmlResponse(keyCreatedPage(rawKey, email, 'free'));
});

// ── Dashboard ─────────────────────────────────────────────────────────────────
app.get('/dashboard', async c => {
  const rawKey = c.req.query('key');
  if (!rawKey) {
    return htmlResponse(
      registerPage('Enter your API key or create a new one below'),
      400
    );
  }

  const apiKey = await resolveApiKey(c.env.DB, rawKey);
  if (!apiKey) {
    return htmlResponse(errorPage(404, 'API key not found'), 404);
  }

  const refreshed = await maybeResetUsage(c.env.DB, apiKey);

  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const recent = await c.env.DB
    .prepare(
      'SELECT COUNT(*) as cnt FROM usage_events WHERE api_key_id = ? AND generated_at > ?'
    )
    .bind(refreshed.id, yesterday)
    .first<{ cnt: number }>();

  return htmlResponse(
    dashboardPage(refreshed, recent?.cnt ?? 0, {
      proHref: proCtaHref(c.env),
    })
  );
});

app.get('/health', c => c.json({ ok: true, ts: new Date().toISOString() }));

app.notFound(_c => htmlResponse(errorPage(404, 'Page not found'), 404));
app.onError((err, _c) => {
  console.error('Unhandled error:', err);
  return htmlResponse(errorPage(500, 'Internal server error'), 500);
});

export default app;
