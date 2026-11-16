// smoke-preview.mjs: prove the DEPLOYED preview loads and its store system works on a phone.
//   node tools/smoke-preview.mjs [--url https://sgen-sites.github.io/northernlights-redesign/] [--dir dist-preview]
// 1. Every page of the local preview build is requested from the live host at its directory URL: each must answer 200,
//    be the same page (its <title>) and carry noindex. Also the CSS, JS, a font and robots.txt.
// 2. A phone (390x844, touch) on the live host: the 21+ gate shows, "Yes" leads to the store step (Whitehall first),
//    picking Menands closes it and points the sticky bar's Shop now, Call, Directions and today's hours at Menands; the
//    bar is hidden over the hero and shown past it, inside a 390px screen; category tiles follow the store (and a
//    category only Whitehall carries still points at Whitehall); no script errors.
// Writes audit/preview-smoke.json. One request at a time; the browser contacts nothing but the preview host.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, sleep } from './pw.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const URL0 = opt('--url', 'https://sgen-sites.github.io/northernlights-redesign/').replace(/\/?$/, '/');
const DIR = path.join(ROOT, opt('--dir', 'dist-preview'));
const host = new URL(URL0).origin;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' | ' + String(detail).slice(0, 240) : '')); };
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

// 1. every page, at the URL the site links it by
const files = walk(DIR).filter((f) => f.endsWith('index.html'));
let okPages = 0, redirects = 0;
const bad = [];
for (const f of files) {
  const rel = path.relative(DIR, f).split(path.sep).join('/').replace(/index\.html$/, '');
  const local = fs.readFileSync(f, 'utf8');
  if (/http-equiv="refresh"/.test(local)) { redirects++; continue; }
  const want = (/<title>([^<]*)<\/title>/.exec(local) || [])[1];
  try {
    const r = await fetch(URL0 + rel, { redirect: 'follow' });
    const body = await r.text();
    const title = (/<title>([^<]*)<\/title>/.exec(body) || [])[1];
    const good = r.status === 200 && title === want && /<meta name="robots" content="noindex, nofollow">/.test(body);
    if (good) okPages++; else bad.push(`${rel || '/'} ${r.status} ${title === want ? '' : 'title differs'}`);
  } catch (e) { bad.push(`${rel || '/'} ${e.message}`); }
}
const pagesTotal = files.length - redirects;
check(`every page answers 200 with its own title and noindex (${pagesTotal} pages, ${redirects} redirect stubs skipped)`, okPages === pagesTotal, bad.slice(0, 5).join(' ; '));
for (const asset of ['assets/css/site.css', 'assets/js/site.js', 'assets/fonts/jost-normal.woff2', 'robots.txt']) {
  const r = await fetch(URL0 + asset);
  const body = asset === 'robots.txt' ? await r.text() : '';
  check(`${asset} answers 200`, r.status === 200 && (asset !== 'robots.txt' || /Disallow:\s*\/\s*$/m.test(body)), r.status + (body ? ' ' + body.replace(/\s+/g, ' ') : ''));
}

// 2. the phone path
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, timezoneId: 'America/New_York' });
await ctx.route((u) => !String(u).startsWith(host), (r) => r.abort());
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(URL0, { waitUntil: 'load' }); await sleep(600);
// the intro splash (option 2, once per session) plays first, then hands off to the gate with focus on "Yes"
const splashOn = await p.isVisible('.spl');
await p.waitForSelector('.spl', { state: 'detached', timeout: 20000 }).catch(() => {});
await sleep(700);
const handoff = await p.evaluate(() => ({ gone: !document.querySelector('.spl'), focus: document.activeElement && document.activeElement.hasAttribute('data-gate-yes') }));
check('intro splash plays on first visit, then hands off to the 21+ gate (focus on Yes)', splashOn && handoff.gone && handoff.focus, JSON.stringify({ splashOn, ...handoff }));
check('21+ gate shows on first visit', await p.isVisible('#gate'));
const first = await p.evaluate(() => { const b = document.querySelector('#gate [data-gate-step="2"] [data-set-store]'); return b && b.getAttribute('data-set-store'); });
await p.click('[data-gate-yes]'); await sleep(400);
check('"Yes" leads to the store step, Whitehall listed first', await p.isVisible('[data-gate-step="2"]') && first === 'whitehall', first);
await p.click('#gate [data-set-store="menands"]'); await sleep(500);
check('picking a store closes the gate', !(await p.isVisible('#gate')));
const atTop = await p.evaluate(() => document.querySelector('[data-sbar]').classList.contains('is-on'));
await p.evaluate(() => scrollTo(0, innerHeight * 1.8)); await sleep(1100);
const bar = await p.evaluate(() => {
  const b = document.querySelector('[data-sbar]'); const r = b.querySelector('.sbar__in').getBoundingClientRect();
  return { on: b.classList.contains('is-on'), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, vh: innerHeight, store: document.documentElement.getAttribute('data-store'),
    city: b.querySelector('[data-store-city]').textContent, shop: b.querySelector('[data-store-href="menu"]').getAttribute('href'), call: b.querySelector('[data-store-tel]').getAttribute('href'), maps: b.querySelector('[data-store-directions]').getAttribute('href'),
    hours: (b.querySelector('.sbar__hours .status__txt') || {}).textContent || '', labels: [...b.querySelectorAll('.sbar__btn span')].map((x) => x.textContent.trim()) };
});
check('sticky bar hidden over the hero, shown past it, inside the 390px screen', !atTop && bar.on && bar.bottom <= bar.vh + 1 && bar.top > bar.vh * 0.6 && bar.left >= 0 && bar.right <= bar.vw, JSON.stringify({ on: bar.on, top: bar.top, bottom: bar.bottom, left: bar.left, right: bar.right }));
check('sticky bar: Shop now, Call, Directions and today\'s hours, all for Menands', bar.store === 'menands' && /\/menands\/$/.test(bar.shop) && bar.call === 'tel:+15184720278' && /Menands/.test(bar.maps) && bar.city === 'Menands' && /(Open now|Closed)/.test(bar.hours) && bar.labels.join(',') === 'Shop now,Call,Directions', JSON.stringify(bar));
const cats = await p.evaluate(() => ({ flower: (document.querySelector('a[data-cat="flower"]') || {}).getAttribute && document.querySelector('a[data-cat="flower"]').getAttribute('href'), orals: (document.querySelector('a[data-cat="orals"]') || null) && document.querySelector('a[data-cat="orals"]').getAttribute('href') }));
check('category tiles follow the store (Flower -> Menands; Orals, a Whitehall-only shelf, -> Whitehall)', /\/menands\/flower\/$/.test(cats.flower || '') && /\/whitehall\/orals\/$/.test(cats.orals || ''), JSON.stringify(cats));
check('no script errors on the live preview (phone)', errs.length === 0, errs.slice(0, 2).join(' | '));
await browser.close();

const out = { at: new Date().toISOString(), url: URL0, pass: results.filter((r) => r.ok).length, total: results.length, results };
fs.writeFileSync(path.join(ROOT, 'audit/preview-smoke.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`\n${out.pass}/${out.total} PASS -> audit/preview-smoke.json`);
process.exit(out.pass === out.total ? 0 : 1);
