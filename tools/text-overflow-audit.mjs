// text-overflow-audit.mjs: text that spills out of its box or leaves the screen, and text laid out badly (cramped columns,
// a short word stranded on its own last line, a button label breaking onto two lines).
//   node tools/text-overflow-audit.mjs [--dir dist] [--w 320,360,390,430,768,900,1100,1180,1280,1600,1920]
//                                      [--pages /,/about/,...] [--no-overlays] [--self-test]
// For every visible element with its own text, the text's rendered box is compared with the nearest boxed ancestor
// (one with a background, a border or clipping): sticking out by more than 2px is a finding. Also reported: text or
// any control (link, button, field) past the screen edge, and a page that scrolls sideways.
// Pass 1 audits each page as it loads. Pass 2 opens each overlay (age gate, store modal, mega menus, phone drawer) on
// the home page, and checks the header and the pickup bar with each store picked (the chip carries the store's city).
// Exempt by design: text inside a horizontal scroll row (the row scrolls), marquee text leaving the screen (it is a
// marquee), stickers overhanging a card edge, text set to truncate with an ellipsis, and aria-hidden duplicates.
// A pass that measured nothing is itself a failure. --self-test plants one overflow and one off-screen button and
// fails unless both are caught. Writes audit/text-overflow.json; exit 1 on any finding.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from './pw.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const JSON_OUT = path.resolve(ROOT, val('--json', 'audit/text-overflow.json'));
const DIR = path.resolve(ROOT, val('--dir', 'dist'));
const WIDTHS = val('--w', '320,360,390,430,768,900,1100,1180,1280,1600,1920').split(',').map(Number);
const first = (dir) => { const d = path.join(DIR, dir); return fs.existsSync(d) ? '/' + dir + '/' + fs.readdirSync(d).filter((x) => fs.existsSync(path.join(d, x, 'index.html')) && x !== 'category')[0] + '/' : null; };
const DEFAULT = ['/', '/location/', '/location/albany/', '/visit-us/', first('visit-us'), '/store-locator/', '/shop/', '/deals/', '/how-to-order/', '/pickup/', '/brands/', '/our-brands/', '/our-brands/ayrloom/', '/blog/', first('blog'), '/learn/', '/events/', first('event'), '/about/', '/loyalty-program/', '/careers/', '/contact/', '/faq/', '/reviews/', '/terms-conditions/', '/sitemap/', '/lab/reviews/', '/lab/specials/'].filter(Boolean);
const PAGES = val('--pages', DEFAULT.join(',')).split(',');
const OVERLAYS = !args.includes('--no-overlays');
const SELF_TEST = args.includes('--self-test');
const STORES = ['albany', 'clifton-park', 'schenectady'];
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(DIR, p); if (!f.startsWith(DIR) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

// runs in the page: audit every own-text element and every control under `root`, skipping anything inside `skip`
function audit({ root, skip }) {
  const out = []; let checked = 0, controls = 0; const VH = new WeakMap();
  const boxed = (el) => { const cs = getComputedStyle(el); const bg = cs.backgroundColor; return (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') || cs.backgroundImage !== 'none' || parseFloat(cs.borderLeftWidth) > 0 || cs.overflowX !== 'visible'; };
  const scrolls = (el) => ['auto', 'scroll'].includes(getComputedStyle(el).overflowX);
  const inScroller = (n) => { for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) if (scrolls(a)) return true; return false; };
  const vw = document.documentElement.clientWidth;
  const MARQUEE = '.tape__track, .rv-a__track';
  const name = (e, n) => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, n).join('.') : '');
  const top = document.querySelector(root); if (!top) return { out: [{ kind: 'no-root', el: root, px: 0, text: 'nothing matched ' + root }], checked, controls };
  if (root === 'body' && document.documentElement.scrollWidth > vw + 1) out.push({ kind: 'page-hscroll', el: 'html', px: document.documentElement.scrollWidth - vw, text: 'the page scrolls sideways' });
  // any visible control past the screen edge, text or not (an icon-only menu button is the classic casualty)
  for (const c of top.querySelectorAll('a, button, input, select, textarea, summary')) {
    if (skip && c.closest(skip)) continue;
    if (c.closest(MARQUEE) || inScroller(c)) continue;
    const r = c.getBoundingClientRect(); const cs = getComputedStyle(c);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || !r.height) continue;
    if (!r.width && !(c.scrollWidth > 2)) continue; // truly empty; a zero-width control with visible content is checked below
    controls++;
    if (vhidden(c)) continue;
    const label = (c.getAttribute('aria-label') || c.textContent).trim().replace(/\s+/g, ' ').slice(0, 40);
    // a control squeezed narrower than its own content (a badge crushed under the next button, a clipped label).
    // Measured by in-flow text and drawn icon shapes, so a rotated icon's box or a deliberate overlay is not a squeeze.
    if (cs.display !== 'inline' && !['auto', 'scroll'].includes(cs.overflowX) && (c.scrollWidth > c.clientWidth + 2 || c.clientWidth === 0)) {
      const px = overhang(c);
      if (px > 2) out.push({ kind: 'control-squeezed', el: name(c, 1), px: Math.round(px), text: (c.clientWidth === 0 ? 'collapsed to 0px wide: ' : '') + label });
    }
    if (r.right > vw + 1 || r.left < -1) out.push({ kind: 'control-off', el: name(c, 1), px: Math.round(Math.max(r.right - vw, -r.left)), text: label });
  }
  // visually hidden on purpose (screen-reader text): a clip, or a 1px clipped box
  function vhidden(n) { // memoised per node: each element is looked at once however many texts sit inside it
    if (!n || n === document.body || n === document.documentElement) return false;
    if (VH.has(n)) return VH.get(n);
    const s = getComputedStyle(n);
    let v = (s.clipPath && s.clipPath.startsWith('inset(50%')) || s.clip === 'rect(0px, 0px, 0px, 0px)';
    if (!v && s.position === 'absolute' && s.overflow !== 'visible') { const q = n.getBoundingClientRect(); v = q.width <= 1 || q.height <= 1; }
    if (!v) v = vhidden(n.parentElement);
    VH.set(n, v); return v;
  }
  function outOfFlow(d, c) { for (let a = d; a && a !== c; a = a.parentElement) if (['absolute', 'fixed'].includes(getComputedStyle(a).position)) return true; return false; }
  function overhang(c) {
    const cr = c.getBoundingClientRect(); let worst = 0;
    const tw = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest('svg') || outOfFlow(n.parentElement, c) || vhidden(n.parentElement)) continue;
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) if (q.width) worst = Math.max(worst, cr.left - q.left, q.right - cr.right);
    }
    const SHAPES = ['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse'];
    for (const d of c.querySelectorAll('*')) {
      const tag = d.tagName.toLowerCase();
      if (tag === 'svg' || (d.closest('svg') && !SHAPES.includes(tag))) continue;
      if (outOfFlow(d.closest('svg') || d, c)) continue;
      if (!d.closest('svg') && getComputedStyle(d).display === 'none') continue;
      const q = d.getBoundingClientRect(); if (!q.width && !q.height) continue;
      worst = Math.max(worst, cr.left - q.left, q.right - cr.right);
    }
    return worst;
  }
  for (const el of top.querySelectorAll('*')) {
    if (skip && el.closest(skip)) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const r0 = el.getBoundingClientRect(); if (!r0.width || !r0.height) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (cs.textOverflow === 'ellipsis' && cs.overflowX !== 'visible') continue; // truncates by design
    const range = document.createRange(); range.selectNodeContents(el); const t = range.getBoundingClientRect();
    if (!t.width) continue;
    if (el.closest('.sr, .sr-only') || vhidden(el)) continue;
    checked++;
    // nearest boxed ancestor; the search stops at a marquee track (the strip clipping a marquee is not the text's box)
    let box = el.parentElement;
    while (box && box !== document.body && box !== document.documentElement && !boxed(box) && !box.matches(MARQUEE)) box = box.parentElement;
    if (box && box.matches && box.matches(MARQUEE)) box = null;
    const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60);
    const overhang = el.closest('.sticker'); // stickers are slapped across a card's edge on purpose
    if (box && !overhang && box !== document.body && box !== document.documentElement && !scrolls(box)) {
      const b = box.getBoundingClientRect();
      const over = Math.max(b.left - t.left, t.right - b.right);
      if (over > 2) out.push({ kind: 'out-of-box', el: name(el, 2), box: name(box, 1), px: Math.round(over), text });
    }
    if (!inScroller(el) && !el.closest(MARQUEE) && (t.right > vw + 1 || t.left < -1)) out.push({ kind: 'off-screen', el: name(el, 2), px: Math.round(Math.max(t.right - vw, -t.left)), text });

    // ---- how the text wraps (text leaves only: an element with block-level children is measured child by child) ----
    const leaf = ![...el.querySelectorAll('*')].some((d) => { const ds = getComputedStyle(d).display; return !/^inline/.test(ds) && ds !== 'none' && ds !== 'contents'; });
    if (!leaf || el.closest(MARQUEE)) continue;
    const fsz = parseFloat(cs.fontSize);
    const lines = cluster([...range.getClientRects()].filter((q) => q.width > 0.5).map((q) => (q.top + q.bottom) / 2), fsz * 0.6);
    const full = el.textContent.replace(/\s+/g, ' ').trim();
    // a button or tab label that breaks onto a second line (labels are often inline: judged before the inline skip)
    if (lines >= 2 && el.closest('.btn, .chipbtn, .pickbar__ic, .nav__btn, .nav__link, .chip, .h-pick')) out.push({ kind: 'label-wraps', el: name(el, 2), px: lines, text });
    // a link or span running inside a paragraph wraps with the paragraph: only block-level text is judged below
    if (cs.display === 'inline') continue;
    // cramped: a column so narrow the text runs 3+ lines at under 14 characters a line (body/UI text), or 4+ lines at
    // under 10 (display titles, which are meant to stack short: a poster title of three 15-character lines is fine)
    const avg = full.length / lines, display = fsz >= 17;
    if (!el.closest('.dh') && (display ? lines >= 4 && avg < 10 : lines >= 3 && avg < 14)) out.push({ kind: 'cramped', el: name(el, 2), px: lines, text: `${lines} lines of ~${Math.round(avg)} chars: ${text}` });
    // stranded: a short word alone on the last line of a short text ("AM", "NY")
    if (lines >= 2) {
      const words = [];
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n && words.length <= 14; n = tw.nextNode()) {
        const re = /\S+/g; let m;
        while ((m = re.exec(n.textContent))) { const wr = document.createRange(); wr.setStart(n, m.index); wr.setEnd(n, m.index + m[0].length); const rr = wr.getClientRects(); if (rr.length) words.push({ w: m[0], y: (rr[rr.length - 1].top + rr[rr.length - 1].bottom) / 2 }); }
      }
      if (words.length >= 2 && words.length <= 14) {
        const lastY = Math.max(...words.map((x) => x.y));
        const onLast = words.filter((x) => Math.abs(x.y - lastY) < fsz * 0.6);
        const core = onLast.length === 1 ? onLast[0].w.replace(/[^\p{L}\p{N}]/gu, '') : '';
        if (onLast.length === 1 && core.length > 0 && core.length <= 4) out.push({ kind: 'stranded', el: name(el, 2), px: lines, text: `"${onLast[0].w}" alone on the last line: ${text}` });
      }
    }
  }
  return { out, checked, controls };
  function cluster(ys, tol) { ys.sort((a, b) => a - b); let n = 0, last = -1e9; for (const y of ys) { if (y - last > tol) { n++; last = y; } } return n; }
}
// marquee tracks are audited for text leaving its card, never for leaving the screen (that is what a marquee does)
const SKIP = '[aria-hidden="true"], .sr, .sr-only, .skip, .gate, .smodal, .drawer, .mega, .pickbar, svg, .vinyl, .float, .ftr__record';

const browser = await chromium.launch();
const findings = [];
let measured = 0, passes = 0;
const prep = async (p) => { await p.evaluate(async () => { await document.fonts.ready; document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in')); }); await p.waitForTimeout(250); };
// run one pass; a pass that measured no text at all is a blind probe and is reported as such
async function pass(p, page, w, root, skip) {
  const { out, checked, controls } = await p.evaluate(audit, { root, skip });
  passes++; measured += checked;
  for (const f of out) findings.push({ page, w, ...f });
  if (!checked && !controls && !out.length) findings.push({ page, w, kind: 'no-coverage', el: root, px: 0, text: 'measured 0 text elements and 0 controls' });
  return out;
}

if (SELF_TEST) {
  // positive control: one planted overflow and one planted off-screen button must both be caught; negative: a fitting card must not be
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('cdc.age', '1'); sessionStorage.setItem('cdc.bar', 'off'); } catch (e) {} });
  const p = await ctx.newPage(); await p.goto(base + '/about/', { waitUntil: 'networkidle' }); await prep(p);
  await p.evaluate(() => {
    const m = document.querySelector('main');
    m.insertAdjacentHTML('afterbegin', '<div id="st-bad" style="width:120px;background:#123;padding:8px"><span style="white-space:nowrap">PLANTEDOVERFLOWINGWORD</span></div><div id="st-ok" style="width:300px;background:#123;padding:8px"><span>fits fine</span></div><button id="st-off" type="button" style="position:fixed;top:200px;left:360px;width:90px">Off</button>'
      + '<p id="st-cramp" style="width:64px;font-size:15px;line-height:1.4">Planted cramped column of words here</p>'
      + '<p id="st-strand" style="font-size:16px">Planted order at 9:00<br>AM</p>'
      + '<p id="st-prose" style="width:320px;font-size:16px;line-height:1.5">Planted normal paragraph that wraps over a couple of comfortable lines and ends well.</p>'
      + '<a id="st-btn" class="btn" href="#" style="width:96px">Planted long label</a>'
      + '<span id="st-vh" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">Planted hidden text that overflows its box</span>');
  });
  const out = await pass(p, '/about/ [self-test]', 390, 'body', SKIP);
  const has = (kind, start) => out.some((f) => f.kind === kind && f.text.includes(start));
  const checks = {
    'planted overflow caught': out.some((f) => f.kind === 'out-of-box' && f.text === 'PLANTEDOVERFLOWINGWORD'),
    'planted off-screen button caught': out.some((f) => f.kind === 'control-off' && f.text === 'Off'),
    'planted cramped column caught': has('cramped', 'Planted cramped'),
    'planted stranded "AM" caught': has('stranded', 'Planted order'),
    'planted wrapped button label caught': has('label-wraps', 'Planted long label'),
    'fitting card left alone': !out.some((f) => f.text.includes('fits fine')),
    'normal paragraph left alone': !out.some((f) => f.text.includes('Planted normal paragraph')),
    'visually hidden text left alone': !out.some((f) => f.text.includes('Planted hidden text')),
  };
  await browser.close(); server.close();
  for (const [k, v] of Object.entries(checks)) console.log(`self-test: ${v ? 'PASS' : 'FAIL'} ${k}`);
  process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
}

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('cdc.age', '1'); sessionStorage.setItem('cdc.bar', 'off'); } catch (e) {} });
  for (const pg of PAGES) {
    const p = await ctx.newPage();
    await p.goto(base + pg, { waitUntil: 'networkidle' }).catch(() => {});
    await prep(p);
    await pass(p, pg, w, 'body', SKIP);
    await p.close();
  }
  await ctx.close();

  if (!OVERLAYS) continue;
  // ---- pass 2: overlays, opened the way a visitor opens them ----
  const oc = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  const p = await oc.newPage();
  await p.goto(base + '/', { waitUntil: 'networkidle' }); await prep(p);
  const gateOn = await p.evaluate(() => { const g = document.querySelector('.gate'); return !!g && !g.hidden && g.getBoundingClientRect().height > 0; });
  if (gateOn) await pass(p, '/ [age gate]', w, '.gate', 'svg');
  else findings.push({ page: '/ [age gate]', w, kind: 'no-coverage', el: '.gate', px: 0, text: 'the gate did not show on a first visit' });
  await p.evaluate(() => { try { localStorage.setItem('cdc.age', '1'); } catch (e) {} });
  await p.reload({ waitUntil: 'networkidle' }); await prep(p);
  await p.evaluate(() => document.querySelector('[data-open-store]').click()); await p.waitForTimeout(600);
  await pass(p, '/ [store modal]', w, '.smodal', 'svg');
  await p.keyboard.press('Escape'); await p.evaluate(() => { const x = document.querySelector('.smodal__x'); if (x && !document.querySelector('.smodal').hidden) x.click(); }); await p.waitForTimeout(300);
  const megas = await p.evaluate(() => [...document.querySelectorAll('[data-mega-btn]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.getAttribute('data-mega-btn')));
  for (const key of megas) {
    try { await p.click(`[data-mega-btn="${key}"]`, { timeout: 3000 }); } catch (e) { findings.push({ page: `/ [mega ${key}]`, w, kind: 'no-coverage', el: 'mega', px: 0, text: 'could not open: ' + e.message.split('\n')[0] }); continue; }
    await p.waitForTimeout(450);
    await pass(p, `/ [mega ${key}]`, w, '#mega-' + key, 'svg');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  }
  const burger = await p.evaluate(() => { const b = document.querySelector('[data-drawer-btn]'); return !!b && b.getBoundingClientRect().width > 0; });
  if (burger) {
    await p.evaluate(() => document.querySelector('[data-drawer-btn]').click()); await p.waitForTimeout(500); // a script click: an off-screen burger is reported by the header pass, not fatal here
    await pass(p, '/ [drawer]', w, '[data-drawer]', 'svg');
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  }
  await oc.close();
  // header + pickup bar with each store picked: the chip and the bar carry the store's city, up to "Schenectady"
  for (const store of STORES) {
    const sc = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    await sc.addInitScript((s) => { try { localStorage.setItem('cdc.age', '1'); localStorage.setItem('cdc.store', s); } catch (e) {} }, store);
    const q = await sc.newPage();
    await q.goto(base + '/', { waitUntil: 'networkidle' }); await prep(q);
    await pass(q, `/ [header, ${store}]`, w, 'header', 'svg, .mega');
    await q.evaluate(() => window.scrollTo(0, 1600)); await q.waitForTimeout(900);
    const barOn = await q.evaluate(() => { const b = document.querySelector('.pickbar'); return !!b && !b.hidden && b.classList.contains('is-on') && b.getBoundingClientRect().height > 0; });
    if (barOn) await pass(q, `/ [pickup bar, ${store}]`, w, '.pickbar', 'svg');
    else findings.push({ page: `/ [pickup bar, ${store}]`, w, kind: 'no-coverage', el: '.pickbar', px: 0, text: 'the bar did not appear after scrolling' });
    await sc.close();
  }
}
await browser.close(); server.close();
// collapse duplicates (same page, element and text across widths)
const key = (f) => `${f.page}|${f.kind}|${f.el}|${f.text}`;
const merged = Object.values(findings.reduce((a, f) => { const k = key(f); (a[k] = a[k] || { ...f, widths: [], pxs: [] }).widths.push(f.w); a[k].pxs.push(f.px); return a; }, {}));
fs.writeFileSync(JSON_OUT, JSON.stringify({ at: new Date().toISOString(), widths: WIDTHS, pages: PAGES, overlays: OVERLAYS, passes, measured, findings: merged }, null, 2));
for (const f of merged) console.log(`${f.kind.padEnd(11)} ${f.page.padEnd(32)} ${f.widths.join('/').padEnd(30)} ${String(Math.max(...f.pxs)).padStart(4)}px  ${f.el}${f.box ? ' in ' + f.box : ''}  "${f.text}"`);
console.log(`${PAGES.length} pages x ${WIDTHS.length} widths${OVERLAYS ? ' + overlays' : ''}: ${passes} passes, ${measured} text measurements, ${merged.length} finding(s)`);
process.exit(merged.length ? 1 : 0);
