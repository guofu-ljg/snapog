// SnapOG — Dashboard & landing HTML
// Aesthetic: Signal Board — 浅底信号板，深蓝墨 + 信号黄绿

import type { ApiKey } from '../types';

export type PaymentLinks = {
  proHref: string;
  businessHref?: string;
  proExternal?: boolean;
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #F2F4F6;
    --ink:      #0C2340;
    --signal:   #B8E62E;
    --surface:  #FFFFFF;
    --line:     #D5DBE3;
    --muted:    #5A6B7D;
    --mute-2:   #8A97A6;
    --danger:   #B42318;
    --ok:       #1B6B3A;
    --font-display: 'Syne', sans-serif;
    --font-body: 'IBM Plex Sans', sans-serif;
    --r: 2px;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.55;
    min-height: 100vh;
    background-image:
      linear-gradient(180deg, rgba(12,35,64,0.03) 0%, transparent 42%),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 47px,
        rgba(12,35,64,0.04) 47px,
        rgba(12,35,64,0.04) 48px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 47px,
        rgba(12,35,64,0.04) 47px,
        rgba(12,35,64,0.04) 48px
      );
  }

  a { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
  a:hover { color: var(--ink); opacity: 0.75; }

  /* 入场 stagger */
  @keyframes rise {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes floatY {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-8px); }
  }
  .anim { opacity: 0; animation: rise 0.7s ease forwards; }
  .d1 { animation-delay: 0.05s; }
  .d2 { animation-delay: 0.15s; }
  .d3 { animation-delay: 0.28s; }
  .d4 { animation-delay: 0.42s; }
  .d5 { animation-delay: 0.55s; }

  .nav {
    position: sticky; top: 0; z-index: 50;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 28px;
    background: rgba(242,244,246,0.92);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .nav-logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 22px;
    color: var(--ink);
    letter-spacing: -0.03em;
    text-decoration: none;
  }
  .nav-logo em {
    font-style: normal;
    background: var(--signal);
    color: var(--ink);
    padding: 0 6px;
    margin-left: 1px;
  }
  .nav-links { display: flex; gap: 20px; align-items: center; }
  .nav-links a {
    color: var(--muted); font-size: 14px; font-weight: 500;
    text-decoration: none;
  }
  .nav-links a:hover { color: var(--ink); opacity: 1; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    font-family: var(--font-body); font-size: 14px; font-weight: 600;
    padding: 10px 22px; border-radius: var(--r);
    border: 2px solid var(--ink); cursor: pointer;
    text-decoration: none; transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    color: var(--ink);
  }
  .btn:hover { text-decoration: none; opacity: 1; transform: translateY(-2px); }
  .btn-primary {
    background: var(--signal);
    box-shadow: 3px 3px 0 var(--ink);
  }
  .btn-primary:hover {
    background: #c8f04a;
    box-shadow: 4px 4px 0 var(--ink);
  }
  .btn-ghost {
    background: transparent;
  }
  .btn-ghost:hover {
    background: var(--surface);
    box-shadow: 3px 3px 0 var(--ink);
  }

  .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
  .container-wide { max-width: 1120px; margin: 0 auto; padding: 0 24px; }

  /* Hero — 品牌为主信号 */
  .hero {
    padding: 72px 0 0;
    text-align: left;
  }
  .hero-brand {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(56px, 12vw, 112px);
    letter-spacing: -0.05em;
    line-height: 0.92;
    color: var(--ink);
    margin-bottom: 28px;
  }
  .hero-brand .mark {
    display: inline-block;
    background: var(--signal);
    padding: 0 0.08em;
  }
  .hero-headline {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(22px, 3.2vw, 32px);
    letter-spacing: -0.03em;
    line-height: 1.2;
    max-width: 28ch;
    margin-bottom: 14px;
  }
  .hero-support {
    font-size: 17px;
    color: var(--muted);
    max-width: 42ch;
    margin-bottom: 28px;
  }
  .hero-cta { display: flex; flex-wrap: wrap; gap: 12px; }

  /* 全宽 OG 预览平面 */
  .og-plane {
    margin-top: 56px;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    border-top: 2px solid var(--ink);
    border-bottom: 2px solid var(--ink);
    background: var(--ink);
    overflow: hidden;
  }
  .og-plane img {
    width: 100%;
    display: block;
    max-height: min(56vw, 520px);
    object-fit: cover;
    object-position: center;
    animation: floatY 6s ease-in-out infinite;
  }
  .og-plane-meta {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 24px;
    background: var(--ink);
    color: var(--signal);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .section { padding: 72px 0; }
  .section-label {
    font-size: 12px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--mute-2); margin-bottom: 10px;
  }
  .section-h2 {
    font-family: var(--font-display);
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 800; letter-spacing: -0.03em;
    margin-bottom: 12px; line-height: 1.1;
  }
  .section-sub { font-size: 16px; color: var(--muted); max-width: 48ch; }

  .code-block {
    background: var(--ink); color: #E8EDF2;
    border: 2px solid var(--ink);
    margin-top: 28px; overflow: hidden;
  }
  .code-block-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 18px; border-bottom: 1px solid rgba(255,255,255,0.12);
    font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--signal); font-weight: 600;
  }
  .code-block pre {
    padding: 22px 18px; font-family: ui-monospace, 'IBM Plex Mono', monospace;
    font-size: 13px; line-height: 1.7; overflow-x: auto; white-space: pre;
  }
  .c-comment { color: #7A8B9C; }
  .c-key { color: var(--signal); }
  .c-val { color: #9FDBB8; }
  .c-str { color: #F0E6A8; }
  .c-url { color: #FFFFFF; }

  .params-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  .params-table th, .params-table td {
    padding: 12px 14px; text-align: left;
    border-bottom: 1px solid var(--line); font-size: 14px;
  }
  .params-table th {
    font-size: 11px; color: var(--mute-2);
    letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
  }
  .params-table td:first-child {
    font-family: ui-monospace, monospace; font-weight: 600; color: var(--ink);
  }
  .tag-req, .tag-opt {
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 2px 7px; border: 1px solid;
  }
  .tag-req { border-color: var(--ink); background: var(--signal); }
  .tag-opt { border-color: var(--line); color: var(--mute-2); }

  .pricing-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 0; margin-top: 40px;
    border: 2px solid var(--ink);
  }
  .pricing-card {
    background: var(--surface);
    padding: 28px 24px;
    border-right: 1px solid var(--line);
    display: flex; flex-direction: column;
  }
  .pricing-card:last-child { border-right: none; }
  .pricing-card.featured {
    background: var(--ink);
    color: #F2F4F6;
  }
  .pricing-card.featured .pricing-period,
  .pricing-card.featured .pricing-limit,
  .pricing-card.featured .pricing-features li { color: rgba(242,244,246,0.72); }
  .pricing-card.featured .pricing-features li.dim { color: rgba(242,244,246,0.4); }
  .pricing-tier {
    font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; margin-bottom: 14px; color: var(--mute-2);
  }
  .pricing-card.featured .pricing-tier { color: var(--signal); }
  .pricing-price {
    font-family: var(--font-display);
    font-size: 44px; font-weight: 800; letter-spacing: -0.03em;
    line-height: 1; margin-bottom: 4px;
  }
  .pricing-card.featured .pricing-price { color: var(--signal); }
  .pricing-period { font-size: 14px; color: var(--muted); margin-bottom: 18px; }
  .pricing-limit {
    font-size: 13px; font-weight: 600; margin-bottom: 18px;
    padding-bottom: 18px; border-bottom: 1px solid var(--line);
  }
  .pricing-card.featured .pricing-limit { border-color: rgba(255,255,255,0.15); }
  .pricing-features { list-style: none; flex: 1; }
  .pricing-features li {
    font-size: 14px; color: var(--muted); padding: 5px 0;
    display: flex; gap: 10px;
  }
  .pricing-features li::before {
    content: ''; width: 8px; height: 8px; margin-top: 6px;
    background: var(--signal); flex-shrink: 0;
  }
  .pricing-features li.dim::before { background: var(--line); }
  .pricing-features li.dim { color: var(--mute-2); }
  .pricing-cta { margin-top: 24px; }
  .pricing-card.featured .btn-primary {
    background: var(--signal); color: var(--ink); border-color: var(--signal);
  }

  .features-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 0; margin-top: 36px;
    border: 2px solid var(--ink);
  }
  .feature-card {
    background: var(--surface);
    padding: 28px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .feature-card:nth-child(2n) { border-right: none; }
  .feature-card:nth-child(n+3) { border-bottom: none; }
  .feature-mark {
    display: inline-block;
    font-family: var(--font-display);
    font-weight: 800; font-size: 13px;
    letter-spacing: 0.06em;
    background: var(--signal);
    color: var(--ink);
    padding: 4px 8px;
    margin-bottom: 14px;
  }
  .feature-card h3 {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 700; margin-bottom: 8px;
  }
  .feature-card p { font-size: 14px; color: var(--muted); line-height: 1.6; }

  .vs-block {
    margin-top: 36px;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 0; border: 2px solid var(--ink);
  }
  .vs-col { padding: 28px; background: var(--surface); }
  .vs-col + .vs-col { border-left: 1px solid var(--line); background: var(--ink); color: #F2F4F6; }
  .vs-col h3 {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 700; margin-bottom: 10px;
  }
  .vs-col p { font-size: 14px; color: var(--muted); line-height: 1.65; }
  .vs-col + .vs-col p { color: rgba(242,244,246,0.72); }
  .vs-col + .vs-col h3 { color: var(--signal); }

  .dash-layout { padding: 40px 0 80px; }
  .dash-header { margin-bottom: 32px; }
  .dash-header h1 {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 800; margin-bottom: 6px;
  }
  .dash-header p { font-size: 14px; color: var(--muted); }
  .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
  .dash-grid-full { grid-column: 1 / -1; }

  .card {
    background: var(--surface);
    border: 2px solid var(--ink);
    padding: 24px;
  }
  .card-title {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--mute-2); margin-bottom: 16px;
  }

  .api-key-display {
    display: flex; align-items: center; gap: 8px;
    background: var(--bg); border: 1px solid var(--line);
    padding: 12px 14px; font-family: ui-monospace, monospace;
    font-size: 13px; color: var(--muted); flex: 1;
  }
  .api-key-display .key-val { flex: 1; word-break: break-all; color: var(--ink); }
  .api-key-row { display: flex; gap: 8px; align-items: stretch; }

  .usage-bar-wrap {
    background: var(--bg); height: 6px; margin: 12px 0 8px; overflow: hidden;
  }
  .usage-bar {
    height: 100%; background: var(--signal);
    transition: width 0.6s ease;
  }
  .usage-bar.warn { background: #E8A317; }
  .usage-bar.full { background: var(--danger); }
  .usage-meta { display: flex; justify-content: space-between; font-size: 13px; color: var(--mute-2); }
  .usage-count {
    font-family: var(--font-display);
    font-size: 36px; font-weight: 800;
  }
  .usage-limit { font-size: 13px; color: var(--mute-2); }

  .tier-badge {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 3px 10px;
    border: 1px solid var(--ink); background: var(--signal);
  }

  .form-group { margin-bottom: 18px; }
  .form-label {
    display: block; font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px;
  }
  .form-input {
    width: 100%; padding: 12px 14px;
    background: var(--bg); border: 2px solid var(--line);
    font-family: var(--font-body); font-size: 15px; color: var(--ink);
    outline: none; transition: border-color 0.15s;
  }
  .form-input:focus { border-color: var(--ink); }
  .form-hint { font-size: 12px; color: var(--mute-2); margin-top: 6px; }

  .alert { padding: 14px 16px; font-size: 14px; margin-bottom: 18px; border: 2px solid; }
  .alert-error { border-color: var(--danger); background: #FCEBEA; color: var(--danger); }
  .alert-success { border-color: var(--ok); background: #E8F5EC; color: var(--ok); }
  .alert-info { border-color: var(--ink); background: var(--surface); color: var(--ink); }

  .footer {
    border-top: 2px solid var(--ink);
    padding: 28px 0;
    text-align: center;
    font-size: 13px; color: var(--mute-2); font-weight: 500;
  }

  @media (max-width: 768px) {
    .pricing-grid, .features-grid, .vs-block, .dash-grid { grid-template-columns: 1fr; }
    .pricing-card { border-right: none; border-bottom: 1px solid var(--line); }
    .pricing-card:last-child { border-bottom: none; }
    .feature-card { border-right: none; }
    .feature-card:nth-child(n+3) { border-bottom: 1px solid var(--line); }
    .feature-card:last-child { border-bottom: none; }
    .vs-col + .vs-col { border-left: none; border-top: 1px solid var(--line); }
    .hero-brand { font-size: 56px; }
    .nav { padding: 12px 16px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .anim, .og-plane img { animation: none !important; opacity: 1; }
  }
`;

function layout(title: string, body: string, description?: string): string {
  const desc =
    description
    ?? 'Generate Open Graph images with one curl. Hosted OG image API for Hugo, Astro, Rails, and static sites — skip self-hosted Satori. Free trial, Pro from $19/mo.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="og image api, open graph image generator, og:image api, curl og image, satori alternative hosted" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <style>${CSS}</style>
</head>
<body>
  ${body}
</body>
</html>`;
}

function nav(): string {
  return `
  <nav class="nav">
    <a class="nav-logo" href="/">Snap<em>OG</em></a>
    <div class="nav-links">
      <a href="/#how-it-works">Docs</a>
      <a href="/#pricing">Pricing</a>
      <a href="/upgrade">Upgrade</a>
      <a href="/register" class="btn btn-primary">Get API Key</a>
    </div>
  </nav>`;
}

function footer(): string {
  return `
  <footer class="footer">
    <div class="container">snapog.dev — Open Graph image API at the edge</div>
  </footer>`;
}

export function landingPage(
  host: string,
  links: PaymentLinks
): string {
  const proHref = links.proHref;
  const proTarget = links.proExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const bizHref = links.businessHref || '/upgrade';

  const body = `
  ${nav()}

  <section class="hero">
    <div class="container">
      <h1 class="hero-brand anim d1">Snap<span class="mark">OG</span></h1>
      <p class="hero-headline anim d2">OG images. One curl.</p>
      <p class="hero-support anim d3">
        Drop a URL in your meta tags. Get a cached PNG from the Cloudflare edge —
        no Next.js, no Playwright farm, no weekend spent on Satori.
      </p>
      <div class="hero-cta anim d4">
        <a href="/register" class="btn btn-primary">Get free API key</a>
        <a href="/#how-it-works" class="btn btn-ghost">Read the API</a>
      </div>
    </div>

    <div class="og-plane anim d5">
      <div class="og-plane-meta">
        <span>Live preview · 1200×630</span>
        <span>demo mode · no key</span>
      </div>
      <img
        src="/og?title=How%20to%20Build%20a%20Billion-Dollar%20API&description=A%20deep%20dive%20into%20developer%20tools%20that%20compound&domain=myblog.dev&theme=dark&template=default"
        alt="SnapOG Open Graph image API live preview"
        width="1200"
        height="630"
      />
    </div>
  </section>

  <section class="section" id="how-it-works">
    <div class="container">
      <p class="section-label">API</p>
      <h2 class="section-h2">One endpoint. Infinite images.</h2>
      <p class="section-sub">GET → PNG. Cache it. Ship it. Demo works without a key (watermarked).</p>

      <div class="code-block">
        <div class="code-block-header"><span>HTTP GET</span><span>${host}</span></div>
        <pre><span class="c-url">GET https://${host}/og</span>
  <span class="c-comment">  ?title=</span><span class="c-str">Your Page Title Here</span>
  <span class="c-comment">  &amp;description=</span><span class="c-str">Optional subtitle</span>
  <span class="c-comment">  &amp;domain=</span><span class="c-str">yourdomain.com</span>
  <span class="c-comment">  &amp;template=</span><span class="c-str">default</span>  <span class="c-comment"># default | blog | article</span>
  <span class="c-comment">  &amp;theme=</span><span class="c-str">dark</span>      <span class="c-comment"># dark | light</span>
  <span class="c-comment">  &amp;key=</span><span class="c-str">sk_your_api_key</span>  <span class="c-comment"># optional for demo</span>

<span class="c-comment">← 200 OK  Content-Type: image/png</span></pre>
      </div>

      <h3 style="font-family:var(--font-display);font-size:18px;font-weight:700;margin:40px 0 0;">Parameters</h3>
      <table class="params-table">
        <thead>
          <tr><th>Param</th><th>Type</th><th></th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>title</td><td>string</td><td><span class="tag-req">required</span></td><td>Main headline (max 120)</td></tr>
          <tr><td>key</td><td>string</td><td><span class="tag-opt">optional</span></td><td>API key; omit for demo (watermark + IP limit)</td></tr>
          <tr><td>description</td><td>string</td><td><span class="tag-opt">optional</span></td><td>Subtitle (max 200)</td></tr>
          <tr><td>domain</td><td>string</td><td><span class="tag-opt">optional</span></td><td>Source label</td></tr>
          <tr><td>author</td><td>string</td><td><span class="tag-opt">optional</span></td><td>Footer author</td></tr>
          <tr><td>template</td><td>enum</td><td><span class="tag-opt">optional</span></td><td>default | blog | article</td></tr>
          <tr><td>theme</td><td>enum</td><td><span class="tag-opt">optional</span></td><td>dark | light</td></tr>
          <tr><td>tag</td><td>string</td><td><span class="tag-opt">optional</span></td><td>Category pill</td></tr>
        </tbody>
      </table>

      <h3 style="font-family:var(--font-display);font-size:18px;font-weight:700;margin:40px 0 16px;">HTML</h3>
      <div class="code-block">
        <div class="code-block-header"><span>meta tags</span></div>
        <pre><span class="c-key">&lt;meta</span> <span class="c-val">property=</span><span class="c-str">"og:image"</span>
      <span class="c-val">content=</span><span class="c-str">"https://${host}/og?title=My+Post&amp;key=YOUR_KEY"</span> <span class="c-key">/&gt;</span>
<span class="c-key">&lt;meta</span> <span class="c-val">property=</span><span class="c-str">"og:image:width"</span>  <span class="c-val">content=</span><span class="c-str">"1200"</span> <span class="c-key">/&gt;</span>
<span class="c-key">&lt;meta</span> <span class="c-val">property=</span><span class="c-str">"og:image:height"</span> <span class="c-val">content=</span><span class="c-str">"630"</span>  <span class="c-key">/&gt;</span></pre>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0;">
    <div class="container">
      <p class="section-label">Why</p>
      <h2 class="section-h2">Signal, not ceremony</h2>
      <div class="features-grid">
        <div class="feature-card">
          <span class="feature-mark">01</span>
          <h3>Edge-cached</h3>
          <p>Generate once, store on R2. Repeat hits under 50ms worldwide.</p>
        </div>
        <div class="feature-card">
          <span class="feature-mark">02</span>
          <h3>Three templates</h3>
          <p>Default, Blog, Article — dark and light. No design sprint.</p>
        </div>
        <div class="feature-card">
          <span class="feature-mark">03</span>
          <h3>Instant free key</h3>
          <p>Email in, key out. 100 images/month. No card for free tier.</p>
        </div>
        <div class="feature-card">
          <span class="feature-mark">04</span>
          <h3>Usage board</h3>
          <p>Count, reset date, tier — one dashboard URL with your key.</p>
        </div>
      </div>

      <div class="vs-block">
        <div class="vs-col">
          <h3>Build it yourself when…</h3>
          <p>You already run Next.js ImageResponse, own the design system, and want pixel-perfect brand control in-repo.</p>
        </div>
        <div class="vs-col">
          <h3>Use SnapOG when…</h3>
          <p>You are not on Next, hate maintaining a headless browser farm, or just need OG images shipping today — not next sprint.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="pricing">
    <div class="container">
      <p class="section-label">Pricing</p>
      <h2 class="section-h2">Start free. Scale when you publish.</h2>
      <div class="pricing-grid">
        <div class="pricing-card">
          <p class="pricing-tier">Free</p>
          <p class="pricing-price">$0</p>
          <p class="pricing-period">forever</p>
          <p class="pricing-limit">100 images / month</p>
          <ul class="pricing-features">
            <li>3 templates</li>
            <li>R2 cache</li>
            <li>API key + dashboard</li>
            <li class="dim">SnapOG watermark</li>
          </ul>
          <div class="pricing-cta">
            <a href="/register" class="btn btn-ghost" style="width:100%;">Get started</a>
          </div>
        </div>

        <div class="pricing-card featured">
          <p class="pricing-tier">Pro</p>
          <p class="pricing-price">$19</p>
          <p class="pricing-period">per month</p>
          <p class="pricing-limit">10,000 images / month</p>
          <ul class="pricing-features">
            <li>Everything in Free</li>
            <li>No watermark</li>
            <li>Custom fonts</li>
            <li>Priority support</li>
          </ul>
          <div class="pricing-cta">
            <a href="${proHref}" class="btn btn-primary" style="width:100%;"${proTarget}>Upgrade to Pro</a>
          </div>
        </div>

        <div class="pricing-card">
          <p class="pricing-tier">Business</p>
          <p class="pricing-price">$49</p>
          <p class="pricing-period">per month</p>
          <p class="pricing-limit">100,000 images / month</p>
          <ul class="pricing-features">
            <li>Everything in Pro</li>
            <li>Custom domain</li>
            <li>Team seats</li>
            <li>White-label</li>
          </ul>
          <div class="pricing-cta">
            <a href="${bizHref}" class="btn btn-ghost" style="width:100%;">Contact / upgrade</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  ${footer()}`;

  return layout(
    'SnapOG — OG Image API via curl | No Next.js, No Satori Setup',
    body,
    'Generate Open Graph images with one curl. Hosted OG image API for Hugo, Astro, Rails, and static sites — skip self-hosted Satori. Free trial, Pro from $19/mo.'
  );
}

export function registerPage(error?: string, _tier?: string): string {
  void _tier; // 注册永远 free；忽略 URL tier
  const body = `
  ${nav()}
  <section class="section">
    <div class="container" style="max-width:440px;">
      <p class="section-label">Register</p>
      <h1 class="section-h2">Get a free API key</h1>
      <p class="section-sub" style="margin-bottom:28px;">
        Free tier only via this form. Pro upgrades go through payment.
      </p>
      ${error ? `<div class="alert alert-error">${error}</div>` : ''}
      <div class="card">
        <form method="POST" action="/register">
          <input type="hidden" name="tier" value="free" />
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input class="form-input" type="email" name="email" id="email" placeholder="you@example.com" required autocomplete="email" />
            <p class="form-hint">Key shown once. One free key per email.</p>
          </div>
          <div class="form-group">
            <label class="form-label" for="keyname">Key name (optional)</label>
            <input class="form-input" type="text" name="keyname" id="keyname" placeholder="production" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;">Create free key</button>
        </form>
      </div>
      <p style="font-size:13px;color:var(--mute-2);margin-top:18px;text-align:center;">
        Already have a key? Open <a href="/dashboard">dashboard</a> with <code>?key=</code>
      </p>
    </div>
  </section>
  ${footer()}`;
  return layout('Get API Key — SnapOG', body);
}

export function existingKeyPage(opts: {
  email: string;
  keyPrefix: string;
  tier: string;
  proHref: string;
  contact: string;
}): string {
  const body = `
  ${nav()}
  <section class="section">
    <div class="container" style="max-width:520px;">
      <div class="alert alert-info">
        已有 free key，请用 dashboard；升级走支付。
      </div>
      <p class="section-label">Account</p>
      <h1 class="section-h2">Key already exists</h1>
      <p class="section-sub" style="margin-bottom:24px;">
        <strong>${opts.email}</strong> already has an API key
        (<code>${opts.keyPrefix}…</code>, tier: ${opts.tier}).
        We only store a hash — the full key cannot be shown again.
      </p>
      <div class="card">
        <p class="card-title">What you can do</p>
        <ul style="list-style:none;font-size:14px;color:var(--muted);line-height:1.8;">
          <li>→ Use your saved key with <code>/dashboard?key=…</code></li>
          <li>→ Upgrade via payment (not re-register)</li>
          <li>→ Forgot key: use a new email (not recommended)</li>
        </ul>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;">
          <a href="${opts.proHref}" class="btn btn-primary">Upgrade / pay</a>
          <a href="mailto:${opts.contact}" class="btn btn-ghost">Email support</a>
        </div>
      </div>
    </div>
  </section>
  ${footer()}`;
  return layout('Existing API Key — SnapOG', body);
}

export function upgradePage(opts: {
  proHref: string | null;
  businessHref: string | null;
  contact: string;
}): string {
  const proBlock = opts.proHref
    ? `<a href="${opts.proHref}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">Pay for Pro</a>`
    : `<p style="font-size:15px;color:var(--muted);margin-bottom:16px;">
         支付链路由运营配置中。配置 <code>STRIPE_PAYMENT_LINK</code> 后此处将直达 Stripe。
       </p>
       <a href="mailto:${opts.contact}?subject=SnapOG%20Pro%20upgrade" class="btn btn-primary">Email ${opts.contact}</a>`;

  const bizBlock = opts.businessHref
    ? `<a href="${opts.businessHref}" class="btn btn-ghost" target="_blank" rel="noopener noreferrer">Pay for Business</a>`
    : `<a href="mailto:${opts.contact}?subject=SnapOG%20Business" class="btn btn-ghost">Ask about Business</a>`;

  const body = `
  ${nav()}
  <section class="section">
    <div class="container" style="max-width:560px;">
      <p class="section-label">Upgrade</p>
      <h1 class="section-h2">Go Pro without self-serve tier hacks</h1>
      <p class="section-sub" style="margin-bottom:28px;">
        Registration always creates free. Paid tiers unlock after payment — no form checkbox for Pro.
      </p>
      <div class="card" style="margin-bottom:16px;">
        <p class="card-title">Pro — $19/mo · 10k images</p>
        ${proBlock}
      </div>
      <div class="card">
        <p class="card-title">Business — $49/mo · 100k images</p>
        ${bizBlock}
      </div>
      <p style="font-size:13px;color:var(--mute-2);margin-top:20px;">
        Still on free? <a href="/register">Get an API key</a> first, then upgrade.
      </p>
    </div>
  </section>
  ${footer()}`;
  return layout('Upgrade — SnapOG Open Graph image API', body);
}

export function keyCreatedPage(rawKey: string, email: string, tier: string): string {
  const body = `
  ${nav()}
  <section class="section">
    <div class="container" style="max-width:600px;">
      <div class="alert alert-success">API key created for ${email}</div>
      <p class="section-label">Your key</p>
      <h1 class="section-h2">Save this key now</h1>
      <p class="section-sub" style="margin-bottom:28px;">
        Shown once. We store only a hash.
      </p>
      <div class="card">
        <p class="card-title">API KEY — ${tier.toUpperCase()}</p>
        <div class="api-key-row">
          <div class="api-key-display"><span class="key-val" id="api-key">${rawKey}</span></div>
          <button class="btn btn-primary" data-copy="${rawKey}" style="white-space:nowrap;">Copy</button>
        </div>
        <p class="form-hint" style="margin-top:12px;">Free: 100 images/month · upgrade via /upgrade</p>
      </div>
      <div class="code-block" style="margin-top:24px;">
        <div class="code-block-header"><span>Quick start</span></div>
        <pre><span class="c-key">curl</span> <span class="c-str">"https://snapog.dev/og?title=Hello+World&amp;key=${rawKey}"</span> \\
  <span class="c-val">--output</span> og.png</pre>
      </div>
      <div style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap;">
        <a href="/dashboard?key=${rawKey}" class="btn btn-primary">Open Dashboard</a>
        <a href="/#how-it-works" class="btn btn-ghost">Docs</a>
      </div>
    </div>
  </section>
  ${footer()}
  <script>
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy || '');
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  </script>`;
  return layout('API Key Created — SnapOG', body);
}

export function dashboardPage(
  key: ApiKey,
  recentCount: number,
  links: { proHref: string }
): string {
  const pct = Math.round((key.usage_count / key.monthly_limit) * 100);
  const barClass = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : '';
  const resetDate = new Date(key.usage_reset_at);
  const nextReset = new Date(resetDate.getFullYear(), resetDate.getMonth() + 1, 1)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const body = `
  ${nav()}
  <div class="container">
    <div class="dash-layout">
      <div class="dash-header">
        <h1>Dashboard <span class="tier-badge">${key.tier}</span></h1>
        <p>Key: <code style="font-family:ui-monospace,monospace;">${key.key_prefix}••••••••••••••••••••</code></p>
      </div>
      <div class="dash-grid">
        <div class="card">
          <p class="card-title">Usage this month</p>
          <div class="usage-count">${key.usage_count.toLocaleString()}</div>
          <p class="usage-limit">of ${key.monthly_limit.toLocaleString()} images</p>
          <div class="usage-bar-wrap">
            <div class="usage-bar ${barClass}" style="width:${Math.min(pct, 100)}%"></div>
          </div>
          <div class="usage-meta">
            <span>${pct}% used</span>
            <span>Resets ${nextReset}</span>
          </div>
          ${
            key.tier === 'free'
              ? `<div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--line);">
                   <a href="${links.proHref}" class="btn btn-primary">Upgrade to Pro — $19/mo</a>
                 </div>`
              : ''
          }
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card">
            <p class="card-title">Last 24h</p>
            <p style="font-family:var(--font-display);font-size:32px;font-weight:800;">${recentCount}</p>
          </div>
          <div class="card">
            <p class="card-title">Cache hit rate</p>
            <p style="font-family:var(--font-display);font-size:32px;font-weight:800;color:var(--mute-2);">—</p>
            <p class="form-hint">Pro analytics soon</p>
          </div>
        </div>
        <div class="card dash-grid-full">
          <p class="card-title">Quick start</p>
          <div class="code-block">
            <div class="code-block-header"><span>cURL</span></div>
            <pre><span class="c-key">curl</span> <span class="c-str">"https://snapog.dev/og?title=My+Blog+Post&amp;key=${key.key_prefix}..."</span></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
  ${footer()}`;
  return layout('Dashboard — SnapOG', body);
}

export function errorPage(code: number, message: string): string {
  const body = `
  ${nav()}
  <section class="section">
    <div class="container" style="text-align:center;max-width:440px;">
      <p style="font-family:var(--font-display);font-size:72px;font-weight:800;color:var(--line);line-height:1;">${code}</p>
      <h1 style="font-family:var(--font-display);font-size:24px;margin:12px 0;">${message}</h1>
      <a href="/" class="btn btn-ghost" style="margin-top:24px;">Back home</a>
    </div>
  </section>
  ${footer()}`;
  return layout(`${code} — SnapOG`, body);
}
