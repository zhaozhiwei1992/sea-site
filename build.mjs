#!/usr/bin/env node
/**
 * Sea Tools 静态站生成器
 * 用法: node build.mjs
 * 读取 site.json + src/tools/{slug} → 渲染 dist/（页面 + sitemap + robots + 404）
 * 后期迁 Spring Boot + Thymeleaf 时：本脚本的渲染层换成 Thymeleaf，
 * meta.json 转为 DB/yml，app.html 转为 templates/tools/，app.js 转 static/（结构 1:1）。
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const stamp = new Date().toISOString().slice(0, 10);

const site = JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8'));
const domain = site.domain.replace(/\/+$/, '');

/* ---------- helpers ---------- */
const render = (tpl, data) => {
  let out = tpl;
  for (const [k, v] of Object.entries(data)) out = out.split(`{{${k}}}`).join(String(v));
  return out;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = (p) => readFileSync(p, 'utf8');

/* ---------- tools ---------- */
const loaded = [];
for (const slug of site.tools) {
  const dir = join(SRC, 'tools', slug);
  if (!existsSync(dir)) { console.error(`✗ 工具目录不存在: ${dir}`); process.exit(1); }
  const meta = JSON.parse(read(join(dir, 'meta.json')));
  const appHtml = read(join(dir, 'app.html'));
  loaded.push({ ...meta, appHtml });
}

/* ---------- partials ---------- */
const navLinks = loaded.map((t) => `<a href="/tools/${t.slug}/">${esc(t.name)}</a>`).join('\n      ');
const headerTpl = read(join(SRC, 'partials', 'header.html'));
const footerTpl = read(join(SRC, 'partials', 'footer.html'));
const header = render(headerTpl, { siteName: site.siteName, navLinks });
const footer = render(footerTpl, { siteName: site.siteName, year: new Date().getFullYear() });

const ga4 = site.ga4Id
  ? `\n<script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4Id}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.ga4Id}');</script>`
  : '';

/* ---------- tool pages ---------- */
mkdirSync(join(DIST, 'assets', 'js'), { recursive: true });
const pages = [];

function toolJsonld(t) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: t.name,
        url: `${domain}/tools/${t.slug}/`,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        description: t.description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: t.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${domain}/` },
          { '@type': 'ListItem', position: 2, name: t.name, item: `${domain}/tools/${t.slug}/` },
        ],
      },
    ],
  });
}

for (const t of loaded) {
  const tpl = read(join(SRC, 'templates', 'tool.template.html'));
  mkdirSync(join(DIST, 'tools', t.slug), { recursive: true });
  const related = loaded
    .filter((o) => o.slug !== t.slug)
    .map((o) => `<a href="/tools/${o.slug}/">${esc(o.name)}</a>`)
    .join(', ');
  const html = render(tpl, {
    siteName: site.siteName,
    domain,
    header,
    footer,
    ga4,
    title: t.title,
    description: t.description,
    keywords: t.keywords.join(', '),
    slug: t.slug,
    name: esc(t.name),
    tagline: esc(t.tagline),
    appHtml: t.appHtml,
    howToItems: t.howTo.map((h) => `<li>${esc(h)}</li>`).join('\n        '),
    faqItems: t.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n      '),
    relatedLinks: related,
    jsonld: toolJsonld(t),
  });
  writeFileSync(join(DIST, 'tools', t.slug, 'index.html'), html);
  copyFileSync(join(SRC, 'tools', t.slug, 'app.js'), join(DIST, 'assets', 'js', `${t.slug}.js`));
  pages.push(`/tools/${t.slug}/`);
  console.log(`✓ /tools/${t.slug}/`);
}

/* ---------- index ---------- */
const indexTpl = read(join(SRC, 'templates', 'index.template.html'));
const toolCards = loaded
  .map((t) => `<a class="card" href="/tools/${t.slug}/"><h2>${esc(t.name)}</h2><p>${esc(t.tagline)}</p></a>`)
  .join('\n      ');
const indexJsonld = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: site.siteName, url: `${domain}/` },
    {
      '@type': 'ItemList',
      itemListElement: loaded.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: t.name,
        url: `${domain}/tools/${t.slug}/`,
      })),
    },
  ],
});
writeFileSync(join(DIST, 'index.html'), render(indexTpl, {
  siteName: site.siteName, description: site.description, domain, header, footer, ga4,
  toolCards, indexJsonld,
}));
console.log('✓ /index.html');

/* ---------- static pages ---------- */
for (const name of ['about', 'privacy', '404']) {
  const tpl = read(join(SRC, 'templates', `${name}.template.html`));
  const out = name === '404' ? '404.html' : `${name}/index.html`;
  mkdirSync(dirname(join(DIST, out)), { recursive: true });
  writeFileSync(join(DIST, out), render(tpl, {
    siteName: site.siteName, domain, header, footer, contactEmail: site.contactEmail,
    today: stamp,
  }));
  console.log(`✓ /${out}`);
}

/* ---------- assets ---------- */
copyFileSync(join(SRC, 'assets', 'style.css'), join(DIST, 'assets', 'style.css'));
console.log('✓ /assets/style.css');

/* ---------- sitemap + robots ---------- */
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [`${domain}/`, ...pages].map((u) => `  <url><loc>${u}</loc><lastmod>${stamp}</lastmod></url>`).join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(DIST, 'sitemap.xml'), sitemap);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml\n`);
console.log('✓ /sitemap.xml + /robots.txt');

/* ---------- summary ---------- */
console.log(`\n构建完成: ${loaded.length} 个工具, ${pages.length + 4} 个静态页 → ${DIST}`);
console.log(`提示: site.json 的 domain 当前为 ${domain}，部署后请改成实际域名再重新 build`);