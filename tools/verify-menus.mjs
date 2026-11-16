// verify-menus.mjs: every page that sells must open the right store's live menu on the right shelf.
//   node tools/verify-menus.mjs [--url http://127.0.0.1:8787/] [--dir dist]
// For every menu page in <dir>/pages.json (both stores' menus, each category, specials, brands, /shop/ and /deals/ for
// both stores) a browser loads the page and reads the src of the menu frame the store's own embed script injects:
// it must be that store's menu, opened on that page's category / specials / brands. Product counts per shelf come from
// the stores' menus read in a real browser (facts/client-facts.json, 2026-11-16) and the real-browser cart checks are
// recorded alongside (realBrowser). Writes audit/menu-verification.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, sleep } from './pw.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const URL0 = opt('--url', 'http://127.0.0.1:8787/').replace(/\/?$/, '/');
const DIR = path.join(ROOT, opt('--dir', 'dist'));
const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'facts/client-facts.json'), 'utf8'));
const CNAME = Object.fromEntries(facts.stores.map((s) => [s.id, s.dutchie.cName]));
const COUNTS = Object.fromEntries(facts.stores.map((s) => [s.id, s.categories]));
const pages = JSON.parse(fs.readFileSync(path.join(DIR, 'pages.json'), 'utf8')).filter((p) => p.type === 'menu');
const jobs = [];
for (const p of pages) {
  if (p.store) jobs.push({ page: p.path, store: p.store, shelf: p.category });
  else for (const s of Object.keys(CNAME)) jobs.push({ page: p.path + '?store=' + s, store: s, shelf: p.category });
}
const expectPath = (j) => `/embedded-menu/${CNAME[j.store]}` + (j.shelf === 'all' ? '' : j.shelf === 'specials' ? '/specials' : j.shelf === 'brands' ? '/brands' : `/products/${j.shelf}`);

const browser = await chromium.launch({ headless: true });
const results = [];
for (const j of jobs) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('nl.age', '1'); } catch (e) {} });
  const pg = await ctx.newPage();
  let src = null, err = null;
  try {
    await pg.goto(URL0 + j.page.replace(/^\//, ''), { waitUntil: 'domcontentloaded', timeout: 45000 });
    await pg.waitForSelector('#dutchie--embed__iframe', { state: 'attached', timeout: 25000 });
    src = await pg.evaluate(() => document.getElementById('dutchie--embed__iframe').src);
  } catch (e) { err = e.message.split('\n')[0]; }
  const got = src ? new URL(src).pathname.replace(/\/$/, '') : null;
  const want = expectPath(j);
  const products = j.shelf === 'all' || j.shelf === 'specials' || j.shelf === 'brands' ? null : (COUNTS[j.store] || {})[j.shelf] ?? 0;
  const ok = got === want && (products === null || products > 0);
  results.push({ page: j.page, store: j.store, shelf: j.shelf, menuFrame: got, expected: want, productsOnShelf20261116: products, ok, error: err });
  console.log((ok ? 'PASS ' : 'FAIL ') + j.page.padEnd(28) + ' -> ' + (got || err));
  await ctx.close();
  await sleep(300);
}
await browser.close();
const prev = fs.existsSync(path.join(ROOT, 'audit/menu-verification.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/menu-verification.json'), 'utf8')) : {};
const out = { at: new Date().toISOString(), base: URL0, method: 'headless page load: the menu frame the store’s embed script injects is read and compared to the expected store + shelf; product counts per shelf from the stores’ own menus in a real browser (facts/client-facts.json)', results, realBrowser: prev.realBrowser || [] };
fs.mkdirSync(path.join(ROOT, 'audit'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'audit/menu-verification.json'), JSON.stringify(out, null, 2) + '\n');
const pass = results.filter((r) => r.ok).length;
console.log(`\n${pass}/${results.length} PASS -> audit/menu-verification.json`);
process.exit(pass === results.length ? 0 : 1);
