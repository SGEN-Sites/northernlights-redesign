// shot.mjs: serve dist/ locally and screenshot pages past the 21+ gate, reporting console errors and sideways overflow.
//   node tools/shot.mjs /about/ /location/albany/ [--w 1440,390] [--full] [--motion] [--dir dist] [--out private/shots]
// --full captures the whole document under reduced motion (reveals settled, loops off); default is the first viewport.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from './pw.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIR = path.resolve(ROOT, val('--dir', 'dist'));
const OUT = path.resolve(ROOT, val('--out', 'private/shots'));
const WIDTHS = val('--w', '1440,390').split(',').map(Number);
const FULL = args.includes('--full');
const MOTION = args.includes('--motion');
const paths = args.filter((a, i) => !a.startsWith('--') && !['--w', '--dir', '--out'].includes(args[i - 1]));
fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIR, p);
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch();
const report = [];
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: (FULL && !MOTION) ? 'reduce' : 'no-preference', hasTouch: w < 600, isMobile: w < 600 });
  await ctx.addInitScript(() => { try { localStorage.setItem('nl.age', '1'); localStorage.setItem('nl.store', localStorage.getItem('nl.store') || 'whitehall'); } catch (e) {} });
  for (const p of paths) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://localhost:${port}${p}`, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('nav: ' + e.message));
    await page.waitForTimeout(FULL ? 600 : 1600);
    if (FULL) { await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in')); }); await page.waitForTimeout(500); }
    const m = await page.evaluate(() => {
      const de = document.documentElement; const over = de.scrollWidth - de.clientWidth;
      let culprit = null;
      if (over > 1) { for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > de.clientWidth + 1 && !el.closest('.band__clip, .tapes, .crate__row, .shouts__row, [aria-hidden="true"]')) { culprit = el.tagName + '.' + String(el.className).slice(0, 60); break; } } }
      const txt = document.body.innerText; const bad = (txt.match(/\bundefined\b|\bNaN\b|\[object Object\]/g) || []).length;
      return { h: de.scrollHeight, over, culprit, bad, title: document.title, h1: (document.querySelector('h1') || {}).innerText };
    });
    const slug = (p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home') + '.' + w + (FULL ? '.full' : '') + '.png';
    await page.screenshot({ path: path.join(OUT, slug), fullPage: FULL });
    report.push({ path: p, w, ...m, errors, shot: path.relative(ROOT, path.join(OUT, slug)) });
    console.log(`${errors.length || m.over > 1 || m.bad ? 'WARN' : 'ok  '} ${w} ${p} h=${m.h} over=${m.over}${m.culprit ? ' (' + m.culprit + ')' : ''} bad=${m.bad} err=${errors.length}${errors.length ? ' ' + errors.slice(0, 2).join(' | ').slice(0, 220) : ''} -> ${path.relative(ROOT, path.join(OUT, slug))}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
