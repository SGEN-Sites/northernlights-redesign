// ui-test.mjs: drive the built site's interactive parts in headless Chromium and record pass/fail per check.
//   node tools/ui-test.mjs [--dir dist] [--pages /,/location/albany/,/shop/]
// Writes audit/ui-test.json. Local only: a tiny static server over the build; live-site links are never followed.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from './pw.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const DIR = path.resolve(ROOT, val('--dir', 'dist'));
const PAGES = val('--pages', '/').split(',');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIR, p); if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail && !ok ? ' | ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 220) : '')); };
const browser = await chromium.launch();
const wait = (p, ms) => p.waitForTimeout(ms);

// ---- phone: gate, store step, drawer, pickup bar ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, timezoneId: 'America/New_York' });
  await ctx.route((u) => !String(u).startsWith(base), (r) => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(base + '/', { waitUntil: 'load' }); await wait(p, 700);
  check('phone: 21+ gate shows on first visit', await p.isVisible('#gate'));
  await p.click('[data-gate-no]'); await wait(p, 200);
  check('phone: "No, I\'m Not" shows the captured refusal line', await p.isVisible('[data-gate-msg]'));
  await p.click('[data-gate-yes]'); await wait(p, 300);
  check('phone: "Yes, I Am" opens the store step', await p.isVisible('[data-gate-step="2"]'));
  await p.click('#gate [data-set-store="schenectady"]'); await wait(p, 500);
  const st = await p.evaluate(() => ({ store: document.documentElement.getAttribute('data-store'), gate: !document.getElementById('gate').hidden, chip: document.querySelector('.chip [data-store-name]').textContent, sleeve: (document.querySelector('.sleeve[data-menu="flower"]') || {}).href || '' }));
  check('phone: picking Schenectady closes the gate and retargets the menu links', st.store === 'schenectady' && !st.gate && st.chip === 'Schenectady' && /cd-schenectady-ny\/products\/flower$/.test(st.sleeve), st);
  check('phone: pickup bar hidden over the hero', !(await p.evaluate(() => document.querySelector('[data-pickbar]').classList.contains('is-on'))));
  await p.evaluate(() => scrollTo(0, innerHeight * 2)); await wait(p, 900);
  const bar = await p.evaluate(() => { const b = document.querySelector('[data-pickbar]'); const r = b.querySelector('.pickbar__in').getBoundingClientRect(); return { on: b.classList.contains('is-on'), bottom: Math.round(r.bottom), vh: innerHeight, tel: b.querySelector('[data-store-tel]').getAttribute('href') }; });
  check('phone: pickup bar shows past the hero, inside the screen, with the chosen store\'s phone', bar.on && bar.bottom <= bar.vh && bar.tel === 'tel:5189017107', bar);
  await p.click('[data-pickbar-close]'); await wait(p, 300);
  check('phone: the pickup bar closes for the session', !(await p.evaluate(() => document.querySelector('[data-pickbar]').classList.contains('is-on'))));
  await p.evaluate(() => scrollTo(0, 0)); await wait(p, 300);
  await p.click('[data-drawer-btn]'); await wait(p, 400);
  check('phone: the menu button opens the drawer', await p.isVisible('#drawer'));
  await p.keyboard.press('Escape'); await wait(p, 200);
  check('phone: Escape closes the drawer', !(await p.isVisible('#drawer')));
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('phone: no sideways scroll on the home page', over <= 1, String(over));
  check('phone: no script errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// ---- desktop: mega menu, store switcher, hero sleeve, every listed page loads clean ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'America/New_York' });
  await ctx.route((u) => !String(u).startsWith(base), (r) => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('cdc.age', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(base + '/', { waitUntil: 'load' }); await wait(p, 600);
  check('desktop: the gate stays closed once answered', !(await p.isVisible('#gate')));
  await p.click('[data-mega-btn="shop"]'); await wait(p, 350);
  check('desktop: Shop opens its mega menu', await p.isVisible('#mega-shop'));
  await p.keyboard.press('Escape'); await wait(p, 200);
  check('desktop: Escape closes the mega menu', !(await p.isVisible('#mega-shop')));
  await p.click('.chip[data-open-store]'); await wait(p, 400);
  check('desktop: the store chip opens the switcher', await p.isVisible('[data-smodal]'));
  await p.click('[data-smodal] [data-set-store="clifton-park"]'); await wait(p, 400);
  const sw = await p.evaluate(() => ({ store: document.documentElement.getAttribute('data-store'), modal: !document.querySelector('[data-smodal]').hidden, shop: document.querySelector('.hdr__shop').getAttribute('href'), mine: (document.querySelector('.scard.is-mine') || {}).getAttribute ? document.querySelector('.scard.is-mine').getAttribute('data-store-card') : null }));
  check('desktop: switching to Clifton Park closes the switcher and moves Shop now', sw.store === 'clifton-park' && !sw.modal && /cd-clifton-park-ny$/.test(sw.shop), sw);
  const hasSleeve = await p.isVisible('.h-pick[data-set-store="albany"]').catch(() => false);
  if (hasSleeve) { await p.click('.h-pick[data-set-store="albany"]'); await wait(p, 300); check('desktop: the hero sleeve switches back to Albany', (await p.evaluate(() => document.documentElement.getAttribute('data-store'))) === 'albany'); }
  const spin = await p.evaluate(async () => { const d = document.querySelector('.h-vinyl .vinyl__disc'); if (!d) return null; const a = d.style.transform; await new Promise((r) => setTimeout(r, 400)); return a !== d.style.transform; });
  if (spin !== null) check('desktop: the record turns', spin);
  check('desktop: no script errors on the home page', errs.length === 0, errs.join(' | '));
  for (const pg of PAGES.filter((x) => x !== '/')) {
    const e2 = []; const q = await ctx.newPage(); q.on('pageerror', (e) => e2.push(String(e)));
    const r = await q.goto(base + pg, { waitUntil: 'load' }).catch(() => null); await wait(q, 400);
    const info = await q.evaluate(() => ({ h1: document.querySelectorAll('h1').length, over: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
    check(`desktop: ${pg} loads with one H1, no overflow, no errors`, r && r.status() === 200 && info.h1 === 1 && info.over <= 1 && e2.length === 0, { status: r && r.status(), ...info, errs: e2.slice(0, 2) });
    await q.close();
  }
  await ctx.close();
}
await browser.close(); server.close();
const out = { at: new Date().toISOString(), dir: path.relative(ROOT, DIR), pass: results.filter((r) => r.ok).length, total: results.length, results };
fs.writeFileSync(path.join(ROOT, 'audit/ui-test.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`\n${out.pass}/${out.total} PASS -> audit/ui-test.json`);
process.exit(out.pass === out.total ? 0 : 1);
