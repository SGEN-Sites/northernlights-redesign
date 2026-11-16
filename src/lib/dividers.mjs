// dividers.mjs: the section seams (lane D; glowing waves by lane W). build.mjs runs seams() on every rendered page: it
// walks the top-level <section>s inside <main> (and the step into <footer>) and, where two neighbours differ in tone,
// drops a GLOWING WAVE across the seam: a travelling crest drawn as a thin bright aurora line with a soft halo
// (src/scripts/waves.js, WebGL), the section above on one side of it and the section below on the other, so the two
// bands meet along the crest with no hard edge. Each wave is a <div class="wv"> holding a static SVG twin (the same
// crest at t = 0 with an aurora gradient stroke: what shows without WebGL, beyond the live-canvas cap, or before the
// script runs) and a <canvas data-wave> that waves.js takes over. The crest's phases are seeded from the page path +
// seam, so no two seams repeat. On the home page the shelves -> living-room wave also carries the aurora ribbon (the
// store's lines on a slow aurora wave), and two big dark -> dark seams get a wave as a chapter break (crest only).
//
// The band paints a section colour ONLY where the crest has crossed the seam (above the seam and below the crest: the
// colour the lower section starts on, --wv-b; below the seam and above the crest: the colour the upper section ends on,
// --wv-a). Everywhere else it is transparent, so each section's own background shows through untouched (even the
// lamp band's radial gradient). Colours, heights and placement live in src/styles/dividers.css.
//
// Seam rule table (from > to): where the band sits. "mid" = centred on the seam, half in each section's padding;
// "top" = inside the lower section's top padding (the upper colour drawn down to the crest); "bot" = inside the upper
// section's bottom padding (the lower colour drawn up to the crest).
//   dark  > lamp    top   (+ the aurora ribbon riding over it when the lamp band is #inside)
//   dark  > paper   mid
//   lamp  > paper   mid
//   dark  > white   bot   (menu pages: .mhead -> the white .menu embed, which starts flush at its top)
//   lamp  > dark    mid
//   paper > dark    mid
//   white > dark    mid
//   paper > footer  mid
//   white > footer  mid
//   lamp  > footer  mid
//   chapter breaks (home): hero > #choose (top, crest only), #deals > #rewards (mid, crest only)
//   dark  > dark, dark > footer: no divider (dividers.css fades every dark band to --night at both edges)
//   hero  > anything else: never touched (.hero, .phero, .shero already fade to --night)
// Any other pair is left alone and reported once by the build.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea', 'title']);
const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

const RULES = {
  'dark>lamp': 'top',
  'dark>paper': 'mid',
  'lamp>paper': 'mid',
  'dark>white': 'bot',
  'lamp>dark': 'mid',
  'paper>dark': 'mid',
  'white>dark': 'mid',
  'paper>footer': 'mid',
  'white>footer': 'mid',
  'lamp>footer': 'mid',
};
const QUIET = new Set(['dark>dark', 'dark>footer']);
// [from (a tone or #id), to (#id)]: dark seams that read as a chapter break get a crest-only wave
const CHAPTERS = [['hero', '#choose'], ['#deals', '#rewards']];
// waves.js keeps at most this many WebGL canvases alive per page (the rest show their static SVG)
export const MAX_LIVE = 5;

export const stats = { pages: 0, wave: 0, chapter: 0, ribbon: 0, ridge: 0, ripple: 0, most: 0, unruled: new Map(), unknown: new Map() };
// band modifiers this table knows; any other band--* on a section is reported (it may be a new tone that needs a rule)
const KNOWN = new Set(['band--tight', 'band--night', 'band--night-0', 'band--night-2', 'band--paper', 'band--lamp']);

// the build's log line (build.mjs prints its older "ridges/ripples" line; this one carries the wave counts)
export function summary() {
  stats.told = true;
  return `waves: ${stats.wave + stats.chapter} glowing waves (${stats.wave} tone changes, ${stats.chapter} chapter breaks), ${stats.ribbon} ribbon on ${stats.pages} pages; most on one page ${stats.most} (live WebGL cap ${MAX_LIVE}/page, the rest static SVG)`;
}
process.once('beforeExit', () => { if (!stats.told && stats.pages) console.log(summary()); });

// ---------- seeded noise ----------
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const n1 = (v) => (Math.round(v * 10) / 10).toString();
function auroraStops() {
  return '<stop offset="0" stop-color="#c25cff"/><stop offset=".26" stop-color="#8a6bff"/><stop offset=".5" stop-color="#4089ff"/><stop offset=".72" stop-color="#2ec4ff"/><stop offset="1" stop-color="#55ffd6"/>';
}

// ---------- the glowing wave: static SVG twin of src/scripts/waves.js at t = 0 ----------
// The crest, in units of the band's height H (x from the band's centre, y from its top, 0..1): a primary swell, a smaller
// ripple and two short terms that read as noise on the crest, each with a seeded phase. waves.js evaluates the SAME sum
// in its shader (keep CREST and the clamp in sync with crest() there); at t = 0 the two draw the same curve, so the
// canvas takes over with no jump. Long waves on wide screens, short ones on phones: everything scales with H.
const CREST = [[0.13, 0.8378], [0.034, 3.307], [0.0108, 5.7], [0.0072, 9.3]]; // [amplitude, wavenumber] in H units
export const crestY = (x, ph) => Math.min(0.8, Math.max(0.2, 0.5 + CREST.reduce((s, [a, k], i) => s + a * Math.sin(x * k + ph[i]), 0)));
// colour along the crest (as in the shader, less its slow swirl): s = 0.11 x + s0; violet at even s, teal at odd s,
// ping-pong between
const S_PER_X = 0.11;
const fmt = (v) => String(v).replace(/^(-?)0\./, '$1.');
// viewBox: y 0..100 = the band's height; x +-1200 = +-12 H, wider than any screen (xMidYMid slice crops the rest)
function waveSvg(id, ph, seam, fills) {
  let d = '', prev = 0;
  for (let xs = -1200; xs <= 1200; xs += 8) {
    const y = Math.round(crestY(xs / 100, ph) * 1000); // tenths of a viewBox unit
    d += xs === -1200 ? `M-1400 300L-1400 ${y / 10}L-1200 ${y / 10}` : `l8 ${fmt((y - prev) / 10)}`;
    prev = y;
  }
  d += `L1400 ${prev / 10}L1400 300Z`; // closed below the crest, the closing edges well outside the view
  const teal = ((1 - ph[4]) / S_PER_X) * 100, violet = (-ph[4] / S_PER_X) * 100;
  const seamY = seam * 100;
  // each fill overlaps 2 units past the seam onto its own colour, so a sub-pixel seam never shows a hairline
  const fb = fills && seam > 0.2, fa = fills && seam < 0.8;
  return `<svg class="wv__svg" viewBox="-1200 0 2400 100" preserveAspectRatio="xMidYMid slice" focusable="false"><defs>`
    + `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${n1(teal)}" y1="0" x2="${n1(violet)}" y2="0" spreadMethod="reflect"><stop offset="0" stop-color="#55ffd6"/><stop offset=".25" stop-color="#2ec4ff"/><stop offset=".5" stop-color="#4089ff"/><stop offset=".75" stop-color="#8a6bff"/><stop offset="1" stop-color="#c25cff"/></linearGradient>`
    + `<path id="${id}c" d="${d}" vector-effect="non-scaling-stroke"/>`
    + (fb ? `<clipPath id="${id}k"><use href="#${id}c"/></clipPath>` : '')
    + (fa ? `<mask id="${id}m" maskUnits="userSpaceOnUse" x="-1400" y="-100" width="2800" height="500"><rect x="-1400" y="-100" width="2800" height="500" fill="#fff"/><use href="#${id}c" fill="#000"/></mask>` : '')
    + `<filter id="${id}f" filterUnits="userSpaceOnUse" x="-1300" y="-60" width="2600" height="220" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`
    + (fb ? `<rect class="wv__fb" x="-1400" y="-100" width="2800" height="${n1(seamY + 102)}" clip-path="url(#${id}k)"/>` : '')
    + (fa ? `<rect class="wv__fa" x="-1400" y="${n1(seamY - 2)}" width="2800" height="400" mask="url(#${id}m)"/>` : '')
    + `<use href="#${id}c" class="wv__halo" stroke="url(#${id}g)" filter="url(#${id}f)"/><use href="#${id}c" class="wv__line" stroke="url(#${id}g)"/></svg>`;
}
const SEAM = { mid: 0.5, top: 0, bot: 1 };
function wave(id, rand, { place, from, to, chapter, tight }) {
  const tau = 2 * Math.PI;
  // four crest phases + the colour offset, rounded so the SVG and the shader read the very same numbers
  const ph = [rand() * tau, rand() * tau, rand() * tau, rand() * tau, rand() * 2].map((v) => Math.round(v * 1000) / 1000);
  const cls = ['wv', `wv--${place}`, `wv--from-${from}`, `wv--to-${to}`, chapter && 'wv--chapter', tight && 'wv--tight'].filter(Boolean).join(' ');
  return `<div class="${cls}" aria-hidden="true">${waveSvg(id, ph, SEAM[place], !chapter)}<canvas class="wv__gl" data-wave data-ph="${ph.join(',')}"></canvas></div>`;
}

// ---------- the aurora ribbon (home: shelves -> living room) ----------
export const RIBBON = ['Price match guarantee', 'Same-day delivery', 'Open every day 10am–8pm', 'Family-owned', '21+ with valid ID', 'LGBTQ+ friendly', 'Whitehall', 'Menands', 'South tip of Lake Champlain'];
// advance widths in Jost SemiBold, em (measured in Chromium; the size-matched Arial fallback is within 5%)
const EM = { 'Price match guarantee': 10.103, 'Same-day delivery': 8.26, 'Open every day 10am–8pm': 12.782, 'Family-owned': 6.092, '21+ with valid ID': 7.696, 'LGBTQ+ friendly': 7.612, 'Whitehall': 4.308, 'Menands': 4.102, 'South tip of Lake Champlain': 12.744 };
// The run is one wave, periodic over LOOP units, slid left by exactly LOOP with a CSS transform (compositor only, no
// per-frame text layout), so the loop is seamless whatever the font: the phrases sit in fixed slots along the path.
export const RB = { W: 5200, H: 128, LOOP: 2400, F: 24, mid: 64, base: 8.2 };
const ry = (x, p) => RB.mid + 11 * Math.sin((2 * Math.PI * x) / 800 + p[0]) + 5 * Math.sin((2 * Math.PI * x) / 480 + p[1]);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function ribbon(seed = 7) {
  const rand = rng(seed), p = [rand() * 6.283, rand() * 6.283];
  const x0 = -40, x1 = RB.W + 40, step = 40;
  const pts = []; for (let x = x0; x <= x1; x += step) pts.push([x, ry(x, p) + RB.base]);
  // Catmull-Rom -> cubic Bezier through the samples (the samples repeat every LOOP, so the path does too)
  let d = `M${x0} ${n1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i - 1] || pts[i], b = pts[i], c = pts[i + 1], e = pts[i + 2] || c;
    d += `C${n1(b[0] + (c[0] - a[0]) / 6)} ${n1(b[1] + (c[1] - a[1]) / 6)} ${n1(c[0] - (e[0] - b[0]) / 6)} ${n1(c[1] - (e[1] - b[1]) / 6)} ${c[0]} ${n1(c[1])}`;
  }
  // arc length along the curve, 1-unit steps: arc(x) and its inverse
  const arcAt = [0]; for (let x = x0 + 1; x <= x1; x++) arcAt.push(arcAt[arcAt.length - 1] + Math.hypot(1, ry(x, p) - ry(x - 1, p)));
  const xAt = (s) => { let lo = 0, hi = arcAt.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arcAt[m] < s) lo = m; else hi = m; } return x0 + lo + (s - arcAt[lo]) / ((arcAt[hi] - arcAt[lo]) || 1); };
  const loopArc = arcAt[RB.LOOP] - arcAt[0];
  const widths = RIBBON.map((t) => (EM[t] || t.length * 0.5) * RB.F);
  const gap = (loopArc - widths.reduce((s, w) => s + w, 0)) / RIBBON.length;
  const total = arcAt[arcAt.length - 1];
  let tp = '', stars = '';
  for (let s0 = 0; s0 < total; s0 += loopArc) {
    let cur = s0 + gap / 2;
    RIBBON.forEach((t, i) => {
      if (cur < total) tp += `<textPath href="#rb-p" startOffset="${n1(cur + widths[i] / 2)}">${esc(t)}</textPath>`;
      cur += widths[i];
      const sx = cur + gap / 2;
      if (sx < total) {
        const x = xAt(sx), ang = (Math.atan2(ry(x + 1, p) - ry(x - 1, p), 2) * 180) / Math.PI;
        stars += `<use href="#rb-s" transform="translate(${n1(x)} ${n1(ry(x, p))}) rotate(${n1(ang)})"/>`;
      }
      cur += gap;
    });
  }
  const shift = -(RB.LOOP / RB.W) * 100;
  const svg = `<svg class="dv-rb__svg" viewBox="0 0 ${RB.W} ${RB.H}" style="aspect-ratio:${RB.W}/${RB.H};--rb-shift:${shift.toFixed(4)}%" focusable="false">`
    + `<defs><linearGradient id="rb-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${RB.LOOP / 2}" y2="0" spreadMethod="reflect">${auroraStops()}</linearGradient>`
    + `<filter id="rb-f" filterUnits="userSpaceOnUse" x="-80" y="0" width="${RB.W + 160}" height="${RB.H}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="9"/></filter>`
    + `<path id="rb-p" d="${d}"/><path id="rb-s" d="M0-7Q.9-.9 7 0Q.9 .9 0 7Q-.9 .9-7 0Q-.9-.9 0-7Z"/></defs>`
    + `<g fill="none" stroke="url(#rb-g)" stroke-linecap="round" transform="translate(0 ${-RB.base})"><use href="#rb-p" class="dv-rb__glow" filter="url(#rb-f)"/><use href="#rb-p" class="dv-rb__band"/></g>`
    + `<g class="dv-rb__stars">${stars}</g><text class="dv-rb__t" text-anchor="middle">${tp}</text></svg>`;
  return `<div class="dv-rb"><p class="sr-only">${RIBBON.map((t) => esc(t)).join('. ')}.</p><div class="dv-rb__run" aria-hidden="true">${svg}</div></div>`;
}

// ---------- the page walk ----------
const classesOf = (attrs) => ((attrs.match(/\bclass\s*=\s*"([^"]*)"/) || [])[1] || '').trim().split(/\s+/).filter(Boolean);
const idOf = (attrs) => (attrs.match(/\bid\s*=\s*"([^"]*)"/) || [])[1] || '';
function toneOf(tag, cls) {
  if (tag === 'footer') return 'footer';
  if (cls.some((c) => c === 'hero' || c === 'phero' || c === 'shero')) return 'hero';
  if (cls.includes('menu')) return 'white';
  if (cls.includes('band--paper')) return 'paper';
  if (cls.includes('band--lamp')) return 'lamp';
  return 'dark';
}
// the top-level elements between two offsets (comments, raw-text elements, void and self-closed tags handled)
function children(html, from, to) {
  const out = [], stack = [];
  TAG.lastIndex = from;
  let m;
  while ((m = TAG.exec(html)) && m.index < to) {
    if (m[0].startsWith('<!--')) continue;
    const tag = m[2].toLowerCase(), attrs = m[3] || '';
    if (m[1] === '/') {
      let i = stack.length - 1; while (i >= 0 && stack[i].tag !== tag) i--;
      if (i < 0) continue;
      const el = stack[i]; stack.length = i;
      if (i === 0) { el.closeStart = m.index; out.push(el); }
      continue;
    }
    const el = { tag, attrs, start: m.index, openEnd: m.index + m[0].length };
    if (VOID.has(tag) || /\/\s*$/.test(attrs)) { if (!stack.length) { el.closeStart = el.openEnd; out.push(el); } continue; }
    stack.push(el);
    if (RAW.has(tag)) { const e = html.toLowerCase().indexOf('</' + tag, TAG.lastIndex); if (e > 0) TAG.lastIndex = e; }
  }
  return out;
}

export function seams(html, page = {}) {
  const mo = html.search(/<main[\s>]/);
  const mc = mo < 0 ? -1 : html.indexOf('</main>', mo);
  if (mc < 0) return html;
  const mOpen = html.indexOf('>', mo) + 1;
  const blocks = children(html, mOpen, mc).filter((e) => e.tag === 'section');
  const fo = html.slice(mc).search(/<footer[\s>]/);
  if (fo >= 0) { const at = mc + fo, end = html.indexOf('>', at) + 1; blocks.push({ tag: 'footer', attrs: html.slice(at + 7, end - 1), start: at, openEnd: end, footer: true }); }
  const where = page.path || page.file || '?';
  for (const b of blocks) {
    b.cls = classesOf(b.attrs); b.id = idOf(b.attrs); b.tone = toneOf(b.tag, b.cls);
    for (const c of b.cls) if (c.startsWith('band--') && !KNOWN.has(c)) stats.unknown.set(c, (stats.unknown.get(c) || []).concat(where));
  }
  stats.pages++;
  const edits = [], hostCls = new Map(), mark = (el, ...c) => { const s = hostCls.get(el) || new Set(); c.forEach((x) => s.add(x)); hostCls.set(el, s); };
  let count = 0;
  for (let i = 0; i + 1 < blocks.length; i++) {
    const a = blocks[i], b = blocks[i + 1], key = `${a.tone}>${b.tone}`;
    const chapter = CHAPTERS.some(([x, y]) => (x === a.tone || x === '#' + a.id) && y === '#' + b.id);
    let place;
    if (chapter) place = a.tone === 'hero' ? 'top' : 'mid';
    else {
      if (a.tone === 'hero' || b.tone === 'hero' || a.tone === b.tone) continue;
      place = RULES[key];
      if (!place) { if (!QUIET.has(key)) stats.unruled.set(key, (stats.unruled.get(key) || []).concat(where)); continue; }
    }
    if (place === 'top' && b.footer) place = 'mid';
    const tight = a.cls.includes('band--tight') || b.cls.includes('band--tight');
    const rand = rng(hash(`${where}#${i}:${key}`));
    // "mid": in front of the lower section (inside <main>, or between </main> and <footer>), pulled across the seam
    // by negative margins (dividers.css), so it never changes the page's height. "top" / "bot": the last child of the
    // section whose padding holds it, behind that section's content (anything that floats up into the padding, like
    // the living room's guitar, stays in front of it)
    const at = place === 'top' ? b.closeStart : place === 'bot' ? a.closeStart : b.start;
    edits.push({ at, del: 0, ins: wave(`wv${i}`, rand, { place, from: a.tone, to: b.tone, chapter, tight }) });
    mark(a, 'wv-a', `wv-a--${place}`); mark(b, 'wv-b', `wv-b--${place}`);
    if (chapter) stats.chapter++; else stats.wave++;
    count++;
    // the ribbon goes in at the same spot (it lands just before the wave; its z-index keeps it over the crest)
    if (b.tone === 'lamp' && b.id === 'inside' && a.tone === 'dark') { edits.push({ at: b.start, del: 0, ins: ribbon(hash(where) % 997) }); stats.ribbon++; }
  }
  stats.most = Math.max(stats.most, count);
  for (const [el, set] of hostCls) {
    const open = html.slice(el.start, el.openEnd), add = [...set].join(' ');
    const next = /\bclass\s*=\s*"/.test(open) ? open.replace(/\bclass\s*=\s*"([^"]*)"/, (_, c) => `class="${c.trim()} ${add}"`) : open.replace(/^<(\w+)/, `<$1 class="${add}"`);
    edits.push({ at: el.start, del: open.length, ins: next });
  }
  edits.sort((x, y) => y.at - x.at || y.del - x.del);
  for (const e of edits) html = html.slice(0, e.at) + e.ins + html.slice(e.at + e.del);
  return html;
}
