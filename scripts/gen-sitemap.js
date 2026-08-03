/* 生成 sitemap.xml（仅中文页面）。用法：node scripts/gen-sitemap.js */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://zymyshadow.github.io';
const TODAY = new Date().toISOString().slice(0, 10);

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === 'en' || name === 'partials' || name === '.git' || name === 'node_modules') continue;
      walk(p, out);
    } else if (name.endsWith('.html')) {
      out.push(p);
    }
  }
  return out;
}

function lastmod(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: ROOT }).toString().trim();
    return d || TODAY;
  } catch (e) {
    return TODAY;
  }
}

function meta(rel) {
  if (rel === 'index.html') return { p: '1.0', c: 'weekly' };
  if (/^(articles|news|games|tools)\/index\.html$/.test(rel) || rel === 'nav.html' || rel === 'search.html' || rel === 'about.html')
    return { p: '0.8', c: 'weekly' };
  if (rel === 'articles/series.html' || /^games\/[^/]+\/index\.html$/.test(rel))
    return { p: '0.7', c: 'monthly' };
  return { p: '0.6', c: 'monthly' };
}

const files = walk(ROOT, []).sort();
const urls = files.map((f) => {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const urlPath = rel === 'index.html' ? '/' : '/' + rel;
  const m = meta(rel);
  return [
    '  <url>',
    `    <loc>${SITE}${urlPath}</loc>`,
    `    <lastmod>${lastmod(rel)}</lastmod>`,
    `    <changefreq>${m.c}</changefreq>`,
    `    <priority>${m.p}</priority>`,
    '  </url>',
  ].join('\n');
});

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.join('\n') +
  `\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log('sitemap.xml written,', files.length, 'urls');
