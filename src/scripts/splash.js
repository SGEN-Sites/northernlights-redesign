/* splash.js (round 3, lane S): three splash intros for the owner to compare. A splash is the short brand intro on a
   visitor's first page load; it hands off to the 21+ gate, or straight to the page for a visitor who has already
   answered it. The markup is built here, so any page can play one; styles: src/styles/splash.css; the lab page:
   src/pages/lab-splash.mjs (/splash-options/).
     ?splash=1|2|3   try one on any page; it is remembered for the session while browsing (sessionStorage nl.splash)
                     and plays on every page load; ?splash=off or the switcher's close clears it.
     LIVE (below)    set to 1, 2 or 3 to ship one: it then plays once per session (sessionStorage nl.splashed).
   1 Aurora Ignition  the badge's aurora spikes rise one by one from a horizon in the brand gradient and shimmer over
                      their reflection in the lake, the crescent moon and stars come on, the wordmark resolves under a
                      sweep of light and "· DISPENSARY ·" letter-spaces in; then the curtain lifts away, its glowing
                      aurora hem sweeping up over the page.
   2 Two Lights       a dark map of the North Country (the living map's own geography): Whitehall ignites in teal, a
                      thread of aurora runs down the canal and the Hudson to Menands in orchid, both bloom into a
                      full-screen aurora wash with the wordmark and "Whitehall · Menands", and the wash dissolves into
                      the page.
   3 Badge Reveal     over a slow starfield drift the round badge draws itself (ring, aurora spikes left to right,
                      moon and stars, mountains, lake ripples), the NL monogram glows at its heart, and an iris opens
                      from the badge onto the page; when the gate is next, the monogram flies into the gate's own.
   Never under prefers-reduced-motion (the visitor goes straight to the gate). Skip: a click or tap anywhere, any key
   (Esc), the wheel, or the Skip button. Motion is CSS keyframes on transform and opacity, all timed from one class
   (the badge's strokes are SVG dash offsets); option 2's aurora wash is the one rAF loop, stopped when it ends. The gate
   is kept invisible under the splash (html.splash-on, its card's entrance held) and rises as the splash leaves; focus
   then goes to its first button. */
(() => {
  'use strict';
  const d = document, W = window, root = d.documentElement;
  const dataEl = d.getElementById('nl-data');
  if (!dataEl) return;
  let BASE = '/';
  try { BASE = JSON.parse(dataEl.textContent).base || '/'; } catch (e) { /* keep "/" */ }
  const RMQ = W.matchMedia('(prefers-reduced-motion: reduce)');
  const ss = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode: no memory */ } },
    del: (k) => { try { sessionStorage.removeItem(k); } catch (e) { /* private mode */ } },
  };
  const LIVE = 0; // ship one: 1, 2 or 3 (every visitor, once per session, never under reduced motion)
  const KEY = 'nl.splash', SEEN = 'nl.splashed';
  const NAMES = ['', 'Aurora Ignition', 'Two Lights', 'Badge Reveal'];
  // when each splash starts to leave (ms after it starts) and how long leaving takes; a skip leaves at once, faster
  const T = [null, { exit: 2480, out: 640 }, { exit: 2350, out: 780 }, { exit: 2430, out: 740 }]; // ends 3.12, 3.13, 3.17 s
  const FAST = 0.62;
  const valid = (v) => v === '1' || v === '2' || v === '3';
  let uid = 0; // SVG ids stay unique when several splashes share a page (the lab's cards)

  /* ---------------- shared drawing ---------------- */
  const rnd = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const COLS = [[194, 92, 255], [138, 107, 255], [64, 137, 255], [46, 196, 255], [85, 255, 214]];
  const col = (t) => { // the brand gradient (violet, blue, teal) at t in 0..1, as "r,g,b"
    const f = Math.max(0, Math.min(1, t)) * (COLS.length - 1), i = Math.min(COLS.length - 2, Math.floor(f)), k = f - i;
    return [0, 1, 2].map((j) => Math.round(COLS[i][j] + (COLS[i + 1][j] - COLS[i][j]) * k)).join(',');
  };
  const STAR4 = '<svg viewBox="-1 -1 2 2"><path d="M0-1C.08-.2.2-.08 1 0 .2.08.08.2 0 1-.08.2-.2.08-1 0-.2-.08-.08-.2 0-1Z"/></svg>';
  const MOON = '<svg viewBox="0 0 44 44"><path d="M25.3 2.3A20 20 0 1 1 2.8 27.6 17 17 0 0 0 25.3 2.3Z"/></svg>';
  // a few large four-point stars and small round ones, placed by a seeded random so every play is the same sky
  function sparkles(big, small, seed, y0, y1) {
    const r = rnd(seed); let h = '';
    for (let i = 0; i < big + small; i++) {
      const b = i < big, x = 4 + r() * 92, y = y0 + r() * (y1 - y0), s = b ? 0.7 + r() * 0.7 : 0.25 + r() * 0.45;
      h += `<i class="spl__star${b ? ' spl__star--4' : ''}" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--s:${s.toFixed(2)};--i:${i}">${b ? STAR4 : ''}</i>`;
    }
    return h;
  }
  // a static starfield on a canvas (drawn once; any drift is a CSS transform)
  function starfield(cv, seed, density, near) {
    const ctx = cv && cv.getContext('2d'); if (!ctx) return;
    const r = cv.getBoundingClientRect(), k = Math.min(1.5, W.devicePixelRatio || 1);
    const w = cv.width = Math.max(1, Math.round(r.width * k)), h = cv.height = Math.max(1, Math.round(r.height * k));
    const rand = rnd(seed), n = Math.round(r.width * r.height * density);
    for (let i = 0; i < n; i++) {
      const x = rand() * w, y = rand() * h, s = (near ? 0.7 + rand() * 1.1 : 0.35 + rand() * 0.7) * k, a = near ? 0.55 + rand() * 0.45 : 0.18 + rand() * 0.5, t = rand();
      ctx.fillStyle = t < 0.1 ? `rgba(85,255,214,${a})` : t < 0.18 ? `rgba(211,105,255,${a})` : `rgba(242,246,255,${a})`;
      ctx.beginPath(); ctx.arc(x, y, s, 0, 6.2832); ctx.fill();
    }
  }

  /* ---------------- 1: Aurora Ignition ---------------- */
  // the badge's upper row of aurora spikes, left to right: the height of each tip, traced from badge.webp (tallest 1)
  const RAYS = [0.55, 0.58, 0.67, 0.9, 0.69, 0.8, 0.76, 0.79, 0.93, 0.89, 0.84, 0.83, 0.92, 1, 0.89, 0.92, 0.97, 0.97];
  // "· DISPENSARY ·" in wordmark.webp (976 x 178, rows 145-177): each glyph's left edge and width
  const DISP = [[249, 11], [293, 27], [335, 14], [364, 24], [403, 27], [444, 25], [484, 33], [532, 24], [570, 30], [614, 29], [654, 29], [716, 11]];
  function art1() {
    const n = RAYS.length, c = (i) => `rgb(${col(i / (n - 1))})`;
    const rays = RAYS.map((h, i) => `<i class="s1__ray" style="--i:${i};--h:${h};--c:${c(i)}"><span class="s1__halo"></span><b></b></i>`).join('');
    const refl = RAYS.map((h, i) => `<i class="s1__ref" style="--i:${i};--h:${h};--c:${c(i)}"></i>`).join('');
    const disp = DISP.map(([x, w], i) => `<i style="--x:${x};--w:${w};--o:${(i - (DISP.length - 1) / 2).toFixed(1)}"></i>`).join('');
    return `<div class="s1__sky"></div><canvas class="s1__field"></canvas>
<div class="s1__stars">${sparkles(8, 22, 7, 5, 50)}</div>
<div class="s1__moon">${MOON}</div>
<div class="s1__stage"><div class="s1__glow"></div><div class="s1__rays">${rays}</div><div class="s1__refl">${refl}</div><div class="s1__line"></div></div>
<div class="s1__word"><div class="s1__nl"><span class="s1__shine"><i></i></span></div><div class="s1__disp">${disp}</div></div>`;
  }
  // the curtain's hem: the aurora hanging below the night as it lifts (outside the clipped art, below the screen)
  function hem1(id) {
    const r = rnd(29); let p = 'M0 0H1000V3';
    for (let x = 1000; x > 0;) { const w = 9 + r() * 7, l = 18 + r() * 70; p += `L${(x - w / 2).toFixed(1)} ${l.toFixed(1)}L${(x - w).toFixed(1)} 3`; x -= w; }
    return `<div class="s1__hem" aria-hidden="true"><svg viewBox="0 0 1000 100" preserveAspectRatio="none"><defs><linearGradient id="s1h${id}"><stop offset="0" stop-color="#c25cff"/><stop offset=".5" stop-color="#4089ff"/><stop offset="1" stop-color="#55ffd6"/></linearGradient></defs><path fill="url(#s1h${id})" d="${p}Z"/></svg></div>`;
  }
  const fx1 = (el) => { starfield(el.querySelector('.s1__field'), 11, 0.00022, false); return null; };

  /* ---------------- 2: Two Lights ---------------- */
  // the living map's geography (src/lib/map.mjs, viewBox 275 x 588): Vermont line, Lake Champlain, Lake George, the
  // Hudson, the Mohawk, the Champlain Canal, the towns and the light's route from Whitehall to Menands
  const MAP = {
    vt: 'M198.7 0L198.7 117.6 192.6 159.6 198.7 174.3 214 176.4 229.3 189 233.9 243.6 232.4 327.6 229.3 453.6 229.3 518.7',
    lake: 'M188 0C188.3 5.6 190.1 24.5 189.6 33.6 189.1 42.7 184.5 46.9 185 54.6 185.5 62.3 191.6 70.7 192.6 79.8 193.6 88.9 191.6 100.1 191.1 109.2 190.6 118.3 190.4 126.7 189.6 134.4 188.8 142.1 186.8 149.5 186.5 155.4 186.2 161.3 187.7 166.3 188 170.1 188.3 173.9 188.3 176.8 188.4 178.1',
    george: 'M94.2 235.2C95.3 231.7 98 221.9 100.9 214.2 103.8 206.5 107 198.1 111.6 189 116.2 179.9 123.1 168.7 128.4 159.6 133.8 150.5 139.1 142.8 143.7 134.4 148.3 126 151.8 117.6 155.9 109.2 160 100.8 164.4 92.4 168.2 84 172 75.6 177.1 63 178.9 58.8',
    hudson: 'M61.2 218.4C64.3 224 72.4 242.9 79.5 252 86.6 261.1 96.9 267.8 104 273 111.1 278.3 117.5 280.7 122.3 283.5 127.1 286.3 131.2 285.3 133 289.8 134.8 294.4 133 297.5 133 310.8 133 324.1 134.8 352.8 133 369.6 131.2 386.4 126.6 397.6 122.3 411.6 118 425.6 110.3 439.6 107 453.6 103.7 467.6 103.4 484.4 102.4 495.6 101.4 506.8 101.9 513.8 100.9 520.8 99.9 527.8 98.6 532 96.3 537.6 94 543.2 89.9 548.8 87.1 554.4 84.3 560 81.3 565.6 79.5 571.2 77.7 576.8 76.9 585.2 76.4 588',
    mohawk: 'M0 487.2C3.6 487.2 12.7 485.8 21.4 487.2 30.1 488.6 42.3 493.5 52 495.6 61.7 497.7 71.9 498.8 79.5 499.8 87.1 500.9 94.8 501.5 97.8 501.9',
    canal: 'M133 298.2C135.8 294 145 282.8 149.8 273 154.7 263.2 157 249.2 162.1 239.4 167.2 229.6 176.3 221.9 180.4 214.2 184.5 206.5 185.2 199.1 186.5 193.2 187.8 187.3 188.1 180.9 188.4 178.5',
    thread: 'M188.4 178.3C186.6 184.3 182.2 201.9 177.3 214.2 172.4 226.5 166.4 238 159 252 151.6 266 138.1 278.6 133 298.2 127.9 317.8 132.2 345.1 128.4 369.6 124.6 394.1 115.2 422.8 110.1 445.2 105 467.6 101.1 488 97.8 504 94.5 520 91.5 534.8 90.3 541',
    towns: [[182.5, 55.4], [94.2, 232.7], [162.4, 237.7], [232.7, 240.2], [115, 281.4], [132.7, 285.6], [71.9, 376.7], [24.5, 489.7], [100.3, 525.8], [80.7, 557.3], [230.9, 161.7]],
  };
  const PW = [188.4, 178.3], PM = [90.3, 541]; // Whitehall, Menands
  const pct = (p) => `--x:${(p[0] / 2.75).toFixed(2)}%;--y:${(p[1] / 5.88).toFixed(2)}%`;
  function art2(id) {
    let grid = '';
    for (let i = -8; i < 15; i++) { const y = ((588 / 7) * (i + 0.5)).toFixed(1); grid += `<line x1="-3000" x2="3275" y1="${y}" y2="${y}"/>`; }
    for (let j = -16; j < 21; j++) { const x = ((275 / 4) * j).toFixed(1); grid += `<line x1="${x}" x2="${x}" y1="-2400" y2="3000"/>`; }
    const th = (cls) => `<path class="s2__th ${cls}" d="${MAP.thread}" pathLength="1" stroke="url(#s2t${id})"/>`;
    return `<div class="s2__night"><div class="s2__map"><svg viewBox="0 0 275 588">
<g class="s2__grid">${grid}</g><path class="s2__vt" d="${MAP.vt}"/>
<path class="s2__w s2__w--lake" d="${MAP.lake}"/><path class="s2__w s2__w--lake" d="${MAP.george}"/><path class="s2__w" d="${MAP.hudson}"/><path class="s2__w s2__w--thin" d="${MAP.mohawk}"/><path class="s2__canal" d="${MAP.canal}"/>
${MAP.towns.map(([x, y]) => `<circle class="s2__town" cx="${x}" cy="${y}" r="1.7"/>`).join('')}
<text class="s2__lbl" x="197.2" y="109.2">Lake Champlain</text><text class="s2__lbl" x="104" y="151.2" transform="rotate(-52 104 151.2)">Lake George</text><text class="s2__lbl" x="111.3" y="411.6" text-anchor="end">Hudson River</text>
</svg></div></div>
<div class="s2__fx">
<canvas class="s2__wash"></canvas>
<div class="s2__box"><svg viewBox="0 0 275 588"><defs><linearGradient id="s2t${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55ffd6"/><stop offset=".45" stop-color="#4089ff"/><stop offset="1" stop-color="#d369ff"/></linearGradient></defs>${th('s2__th--wide')}${th('s2__th--glow')}${th('s2__th--core')}</svg>
<i class="s2__bloom s2__bloom--w" style="${pct(PW)}"></i><i class="s2__bloom s2__bloom--m" style="${pct(PM)}"></i>
<i class="s2__pt s2__pt--w" style="${pct(PW)}"><b></b></i><i class="s2__pt s2__pt--m" style="${pct(PM)}"><b></b></i>
<i class="s2__comet"><b></b></i></div>
<div class="s2__type"><div class="s2__veil"></div>
<div class="s2__word"><div class="s2__mark"></div><p class="s2__line"><b>Whitehall</b><i>·</i><b>Menands</b></p></div></div>
</div>`;
  }
  // the light's run down the route (a composited transform keyed to the drawn line) and the aurora wash (the one loop)
  function fx2(el, still) {
    const box = el.querySelector('.s2__box'), path = el.querySelector('.s2__th--core'), comet = el.querySelector('.s2__comet');
    const cv = el.querySelector('.s2__wash'), ctx = cv && cv.getContext('2d');
    const br = box.getBoundingClientRect(), s = br.width / 275;
    if (!still && comet && path && path.getTotalLength && comet.animate) {
      const L = path.getTotalLength(), kf = [];
      for (let i = 0; i <= 48; i++) { const p = path.getPointAtLength((L * i) / 48); kf.push({ transform: `translate(${(p.x * s).toFixed(1)}px,${(p.y * s).toFixed(1)}px)` }); }
      comet.animate(kf, { duration: 850, delay: 760, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'both' });
    }
    if (!ctx) return null;
    const cr = cv.getBoundingClientRect(), K = 0.5; // half resolution: soft light, cheap to draw
    const w = cv.width = Math.max(2, Math.round(cr.width * K)), h = cv.height = Math.max(2, Math.round(cr.height * K));
    const xw = (br.left - cr.left + (PW[0] / 275) * br.width) * K, xm = (br.left - cr.left + (PM[0] / 275) * br.width) * K;
    const n = Math.max(48, Math.min(120, Math.round(w / 7))), seed = 3.7;
    function draw(t) { // t: seconds since the splash began; the bloom front leaves both lights at 1.62 s
      ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
      const step = w / n;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), x = i * step + step / 2;
        const lit = (t - 1.62 - (Math.min(Math.abs(x - xw), Math.abs(x - xm)) / w) * 0.75) / 0.55;
        if (lit <= 0) continue;
        const e = lit >= 1 ? 1 : 1 - Math.pow(1 - lit, 3);
        const wave = Math.sin(u * 5.5 + t * 0.9 + seed) * 0.6 + Math.sin(u * 12.5 - t * 1.3) * 0.4;
        const by = h * (0.66 + 0.07 * wave), pulse = Math.sin(u * 23 + t * 2.4 + i * 1.7);
        const len = h * 0.6 * (0.3 + 0.7 * pulse * pulse) * e, a = 0.5 * e, c = col(u * 0.94 + 0.03);
        const g = ctx.createLinearGradient(0, by, 0, by - len);
        g.addColorStop(0, `rgba(${c},${a.toFixed(3)})`); g.addColorStop(0.55, `rgba(${c},${(a * 0.35).toFixed(3)})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; const hw = Math.max(1, step * 0.34), lean = Math.sin(u * 7 + t * 1.1) * step * 0.6;
        ctx.beginPath(); ctx.moveTo(x - hw, by); ctx.lineTo(x + hw, by); ctx.lineTo(x + lean, by - len); ctx.closePath(); ctx.fill();
      }
    }
    if (still) { draw(2.6); return null; }
    let t0 = 0, raf = 0, alive = true; // the clock starts on the first frame, with the CSS and the comet
    const loop = (now) => { if (!alive) return; if (!t0) t0 = now; const t = (now - t0) / 1000; if (t > 1.5) draw(t); raf = W.requestAnimationFrame(loop); };
    raf = W.requestAnimationFrame(loop);
    return () => { alive = false; W.cancelAnimationFrame(raf); };
  }

  /* ---------------- 3: Badge Reveal ---------------- */
  // traced from badge.webp (900 x 757; the ring's centre 449.5, 378.5): the 28 aurora spikes left to right (tip, then
  // the two base corners on the ribbon), the four white mountains, the crescent moon, four-point stars and round stars
  const SPK = '288.5,166 283,269.5 292,253.5|304.5,159 299,242.5 309,233.5|304.5,255 299,296.5 309,303.5|319.5,136 314,228.5 324,222.5|320.5,238 315,306.5 324,308.5|334.5,80 331,217.5 341,212.5|335.5,228 331,309.5 340,310.5|351.5,132 346,209.5 356,205.5|351.5,232 346,310.5 356,309.5|366.5,106 362,202.5 372,198.5|368.5,213 362,309.5 372,308.5|382.5,231 377,306.5 388,307.5|382.5,115 378,196.5 388,192.5|398.5,108 393,190.5 403,187.5|398.5,222 393,307.5 404,308.5|414.5,74 409,185.5 420,183.5|415.5,196 409,308.5 420,311.5|430.5,83 425,180.5 435,179.5|430.5,191 425,313.5 435,318.5|444.5,188 438,315.5 448,337.5|445.5,96 441,176.5 451,175.5|462.5,98 458,174.5 468,172.5|478.5,75 473,170.5 484,168.5|493.5,56 489,167.5 500,164.5|509.5,82 505,163.5 515,161.5|525.5,75 521,159.5 531,155.5|541.5,62 537,153.5 547,148.5|557.5,63 552,146.5 563,142.5'.split('|');
  const MTN = [
    'M217 303L198 316 196 319 195 336 191 341 175 342 169 346 164 357 156 365 150 381 149 358 159 344 160 329 154 316 149 311 138 307 136 309 137 325 135 329 129 334 113 337 110 365 111 407 168 405 193 414 194 406 198 397 210 380 217 379 222 374 222 363 212 346 212 341 214 339 219 340 237 355 218 321Z',
    'M357 363L335 367 307 363 280 369 275 373 272 389 270 391 265 389 262 385 257 385 247 391 233 391 230 393 229 399 261 417 313 412 334 408 346 408 348 407 346 396 354 391 357 386Z',
    'M659 374L650 355 625 349 622 361 584 343 584 345 610 376 609 379 605 379 589 372 578 372 576 374 576 382 580 387 576 388 571 386 560 377 550 355 542 344 539 346 531 361 532 369 529 374 511 374 500 376 474 389 467 384 464 373 460 369 453 369 437 376 411 375 398 379 380 379 394 391 413 391 443 407 519 400 599 413 637 404 654 394 658 386Z',
    'M618 269L616 276 621 288 607 320 608 329 613 333 627 336 635 341 653 346 669 360 680 362 707 388 719 417 774 401 779 394 789 387 788 354 786 352 786 335 783 326 775 327 752 338 736 341 708 338 698 334 694 330 693 324 703 295 701 293 692 293 690 291 714 269 715 264 694 269 679 261 659 260 638 248Z',
  ];
  const BMOON = 'M512 196L516 201 518 206 518 216 515 222 509 228 502 231 493 231 485 227 487 231 491 235 500 239 508 239 514 236 517 235 523 229 525 225 526 222 526 211 522 203 518 199Z';
  const BSTARS = [[669.5, 202.5, 23], [598.5, 155.5, 15], [306.5, 121, 16], [231, 219.5, 14]];
  const BDOTS = [[483, 300.5, 9], [503.5, 272.5, 5], [209, 247, 6], [584.5, 234, 9], [462, 206, 6], [179, 204, 4], [208.5, 203.5, 9], [258, 198, 6], [200.5, 175, 7], [553, 169, 8], [655, 163, 6], [681.5, 157.5, 5], [242.5, 143.5, 5], [598.5, 115.5, 7], [626.5, 111, 9], [594, 95, 6], [391.5, 85.5, 5], [361, 79, 8], [401, 63.5, 7], [507.5, 60.5, 5]];
  // the lake: rows of short wave strokes under the mountains, kept inside the inner ring
  function ripples() {
    const r = rnd(5), out = [];
    for (let j = 0; j < 9; j++) {
      const y = 448 + j * 27, half = Math.sqrt(Math.max(0, 340 * 340 - (y - 378.5) * (y - 378.5))) - 18;
      let x = 449.5 - half + r() * 24;
      while (x < 449.5 + half - 40) {
        const len = Math.min(449.5 + half - x, 54 + r() * 150);
        if (len > 34) { const m = Math.max(2, Math.round(len / 22)), sg = len / m; let p = `M${x.toFixed(1)} ${y}`; for (let i = 0; i < m; i++) p += `q${(sg / 2).toFixed(1)} ${i % 2 ? 3.4 : -3.4} ${sg.toFixed(1)} 0`; out.push(`<path class="s3__rp" style="--i:${j}" d="${p}" pathLength="1"/>`); }
        x += len + 16 + r() * 34;
      }
    }
    return out.join('');
  }
  function art3(id) {
    const g = `s3g${id}`, k = `s3d${id}`;
    return `<div class="s3__iris"><canvas class="s3__field"></canvas><canvas class="s3__field s3__field--near"></canvas></div>
<div class="s3__badge"><svg viewBox="71 0 757 757"><defs>
<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="283" y1="0" x2="563" y2="0"><stop offset="0" stop-color="#d574f8"/><stop offset=".19" stop-color="#827af8"/><stop offset=".3" stop-color="#447ff8"/><stop offset=".47" stop-color="#43ccfa"/><stop offset=".58" stop-color="#66fcdd"/><stop offset=".7" stop-color="#43ccfa"/><stop offset=".81" stop-color="#5094f8"/><stop offset=".92" stop-color="#6b80f8"/><stop offset="1" stop-color="#a76ff8"/></linearGradient>
<radialGradient id="${k}" cx="449.5" cy="330" r="380" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0d2445"/><stop offset=".7" stop-color="#071528"/><stop offset="1" stop-color="#040c18"/></radialGradient></defs>
<circle class="s3__disc" cx="449.5" cy="378.5" r="367" fill="url(#${k})"/>
<g class="s3__sky">${BDOTS.map(([x, y, s], i) => `<circle class="s3__st" style="--i:${i}" cx="${x}" cy="${y}" r="${(s / 2.2).toFixed(1)}"/>`).join('')}${BSTARS.map(([x, y, s], i) => `<g transform="translate(${x} ${y})"><path class="s3__st" style="--i:${i * 3 + 1}" transform="scale(${(s / 2).toFixed(1)})" d="M0-1C.08-.2.2-.08 1 0 .2.08.08.2 0 1-.08.2-.2.08-1 0-.2-.08-.08-.2 0-1Z"/></g>`).join('')}<path class="s3__moon" d="${BMOON}"/></g>
<g class="s3__sp" fill="url(#${g})">${SPK.map((p, i) => `<polygon style="--i:${i}" points="${p}"/>`).join('')}</g>
<g class="s3__mts">${MTN.map((p, i) => `<path class="s3__mt" style="--i:${i}" d="${p}" pathLength="1"/>`).join('')}</g>
<g class="s3__lake">${ripples()}</g>
<circle class="s3__ring2" cx="449.5" cy="378.5" r="355.5" pathLength="1" transform="rotate(-90 449.5 378.5)"/>
<circle class="s3__ring" cx="449.5" cy="378.5" r="372.5" pathLength="1" transform="rotate(-90 449.5 378.5)"/>
</svg></div>
<div class="s3__edge"></div>
<div class="s3__monox"><span class="s3__aura"></span><span class="s3__mono"><img src="${BASE}assets/brand/monogram.webp" alt="" width="148" height="148" decoding="async"></span></div>`;
  }
  const fx3 = (el) => {
    el.querySelectorAll('.s3__field').forEach((cv, i) => starfield(cv, 17 + i * 31, i ? 0.00005 : 0.00026, !!i));
    return null;
  };

  const ART = [null, art1, art2, art3], FX = [null, fx1, fx2, fx3];
  function build(n, still) {
    const el = d.createElement('div'), id = ++uid;
    el.className = `spl spl--${n}${still ? ' spl--still is-still' : ''}`;
    el.setAttribute('data-spl', String(n));
    el.innerHTML = `<div class="spl__art" aria-hidden="true">${ART[n](id)}</div>${n === 1 ? hem1(id) : ''}${still ? '' : '<button class="spl__skip" type="button">Skip intro<kbd aria-hidden="true">Esc</kbd></button>'}`;
    return el;
  }

  /* ---------------- the gate and the page ---------------- */
  // the lab's "first-time visitor" hand-off: the real gate, opened again at step 1 (its answers work as always)
  function trap(e) {
    if (e.key !== 'Tab') return;
    const f = Array.from(this.querySelectorAll('a[href], button:not([disabled])')).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
  }
  function openGate(gate) {
    gate.querySelectorAll('[data-gate-step]').forEach((s) => { s.hidden = s.getAttribute('data-gate-step') !== '1'; });
    const m = gate.querySelector('[data-gate-msg]'); if (m) m.hidden = true;
    gate.hidden = false; root.classList.add('gate-open');
    if (!gate.__splTrap) { gate.__splTrap = true; gate.addEventListener('keydown', trap); }
  }
  // a returning visitor lands on the page: its first screen's own entrance plays again as the splash leaves
  function replayReveals() {
    const vh = W.innerHeight;
    const els = Array.from(d.querySelectorAll('[data-reveal].is-in, [data-split].is-in')).filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; });
    if (!els.length) return;
    const parts = (el) => [el, ...el.querySelectorAll('.w')];
    els.forEach((el) => { parts(el).forEach((x) => { x.style.transition = 'none'; }); el.classList.remove('is-in'); });
    void d.body.offsetWidth; // one flush: the hidden state is now the start of the transition
    els.forEach((el) => parts(el).forEach((x) => { x.style.transition = ''; }));
    const back = () => els.forEach((el) => el.classList.add('is-in'));
    W.requestAnimationFrame(back); W.setTimeout(back, 160); // the timer is the safety net if a frame never comes
  }

  /* ---------------- the player ---------------- */
  let playing = null;
  function play(n, opt = {}) {
    if (playing || RMQ.matches || !ART[n]) return false;
    const gate = d.getElementById('gate'), t = T[n], el = build(n, false);
    let left = false, done = false, stop = null, timer = 0;
    root.classList.add('splash-on');
    if (opt.firstVisit && gate) openGate(gate);
    // if the page has already been painted (no head flag on this page, or a replay), dim into the night instead of
    // cutting to it; on a first paint that is already the splash, it starts opaque
    try { if (performance.getEntriesByType('paint').length) { el.classList.add('is-late'); root.classList.add('splash-late'); } } catch (e) { /* no paint timing */ }
    d.body.insertBefore(el, d.body.firstChild);
    root.classList.remove('splash-pending');
    playing = { n, leave: () => leave(true) };
    [`${BASE}assets/brand/wordmark.webp`, `${BASE}assets/brand/monogram.webp`].forEach((src) => { const i = new Image(); i.src = src; });

    const eat = (e) => { e.preventDefault(); e.stopPropagation(); d.removeEventListener('click', eat, true); };
    const onKey = (e) => { if (e.ctrlKey || e.metaKey || e.altKey || /^(Shift|Control|Alt|Meta|CapsLock|Fn)$/.test(e.key)) return; e.preventDefault(); e.stopPropagation(); leave(true); };
    const onDown = (e) => { if (e.button > 0) return; d.addEventListener('click', eat, true); W.setTimeout(() => d.removeEventListener('click', eat, true), 700); leave(true); };
    const onWheel = (e) => { e.preventDefault(); leave(true); }; // the page stays put while the splash leaves
    d.addEventListener('keydown', onKey, true);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('click', () => leave(true)); // the Skip button from a screen reader (no pointer, no key)
    W.addEventListener('wheel', onWheel, { passive: false });

    function begin() {
      el.classList.add('is-play');
      stop = FX[n](el, false);
      // the exit is timed from the moment the animations really start (the first frame they are drawn in), not from
      // this script: a busy page load that holds back the first frame must not cut the intro short
      const arm = () => { if (!left && !timer) timer = W.setTimeout(() => leave(false), t.exit); };
      const a = el.getAnimations ? el.getAnimations({ subtree: true }) : [];
      if (a.length && a[0].ready) a[0].ready.then(arm, arm); else W.requestAnimationFrame(arm);
      // fail open (main session): however slow the first frame, the splash never holds the page longer than its exit + 3s
      W.setTimeout(() => leave(false), t.exit + 3000);
    }
    function leave(fast) {
      if (left) return; left = true;
      W.clearTimeout(timer);
      if (!el.classList.contains('is-play')) begin(), W.clearTimeout(timer);
      const out = Math.round(t.out * (fast ? FAST : 1));
      const toGate = !!(gate && !gate.hidden && root.classList.contains('gate-open'));
      el.style.setProperty('--out', out + 'ms');
      const fly = n === 3 ? prepFly(el, toGate ? gate : null) : null; // read the rects before anything moves
      el.classList.add('is-exit');
      root.classList.remove('splash-on'); // the gate, when it is next, shows under the leaving splash; its card rises
      if (fly) fly(out);
      if (!toGate) replayReveals();
      W.setTimeout(() => finish(toGate), out + 40);
    }
    function finish(toGate) {
      if (done) return; done = true;
      if (stop) stop();
      el.remove();
      root.classList.remove('splash-fly', 'splash-late');
      d.removeEventListener('keydown', onKey, true);
      W.removeEventListener('wheel', onWheel, { passive: false });
      playing = null;
      if (toGate) { const b = gate.querySelector('[data-gate-step]:not([hidden]) button'); if (b) b.focus(); }
    }
    if (d.hidden) { const vis = () => { if (d.hidden) return; d.removeEventListener('visibilitychange', vis); if (!left) begin(); }; d.addEventListener('visibilitychange', vis); } else begin();
    return true;
  }
  // 3: the iris scale that clears the farthest corner; the monogram's flight into the gate's own (or its fade)
  function prepFly(el, gate) {
    const badge = el.querySelector('.s3__badge'), wrap = el.querySelector('.s3__monox');
    if (!badge || !wrap) return null;
    const b = badge.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, r0 = Math.max(1, b.width * 0.4835);
    el.style.setProperty('--is', ((Math.hypot(Math.max(cx, W.innerWidth - cx), Math.max(cy, W.innerHeight - cy)) + 30) / r0).toFixed(3));
    const gm = gate && gate.querySelector('[data-gate-step="1"]:not([hidden])') && gate.querySelector('.gate__mono');
    const to = gm && gm.getBoundingClientRect(), from = wrap.getBoundingClientRect();
    if (!to || !to.width || !from.width || !wrap.animate) return null;
    return (ms) => {
      const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
      wrap.classList.add('is-fly'); root.classList.add('splash-fly');
      wrap.animate([{ transform: 'none' }, { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${(to.width / from.width).toFixed(4)})` }], { duration: ms, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    };
  }

  /* ---------------- try-out mode: ?splash=1|2|3, remembered while browsing, and its switcher ---------------- */
  const ICO = {
    spark: '<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    replay: '<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"/></svg>',
    close: '<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };
  function setUrl(v) {
    try {
      const u = new URL(location.href);
      if (v) u.searchParams.set('splash', v); else u.searchParams.delete('splash');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch (e) { /* the URL stays as it was */ }
  }
  function switcher(cur) {
    const nav = d.createElement('nav');
    nav.className = 'spx'; nav.setAttribute('data-spx', ''); nav.setAttribute('aria-label', 'Splash options');
    nav.innerHTML = `<a class="spx__all" href="${BASE}splash-options/">${ICO.spark}<span>Splash</span></a>`
      + [1, 2, 3].map((k) => `<button class="spx__o" type="button" data-spx-o="${k}" title="${k}: ${NAMES[k]}"><span aria-hidden="true">${k}</span><span class="sr-only">Option ${k}, ${NAMES[k]}</span></button>`).join('')
      + `<button class="spx__b" type="button" data-spx-replay title="Replay">${ICO.replay}<span class="sr-only">Replay the splash</span></button>`
      + `<button class="spx__b" type="button" data-spx-close title="Close the try-out">${ICO.close}<span class="sr-only">Close the splash try-out</span></button>`;
    const mark = () => nav.querySelectorAll('[data-spx-o]').forEach((b) => { const on = +b.getAttribute('data-spx-o') === cur; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    mark();
    nav.addEventListener('click', (e) => {
      const o = e.target.closest('[data-spx-o]');
      if (o) { cur = +o.getAttribute('data-spx-o'); ss.set(KEY, String(cur)); setUrl(String(cur)); mark(); play(cur); return; }
      if (e.target.closest('[data-spx-replay]')) { play(cur); return; }
      if (e.target.closest('[data-spx-close]')) { ss.del(KEY); setUrl(null); nav.remove(); }
    });
    d.body.appendChild(nav);
  }

  /* ---------------- the lab page: still frames in the cards, Play here, the hand-off toggle ---------------- */
  d.querySelectorAll('[data-splash-still]').forEach((host) => {
    const n = +host.getAttribute('data-splash-still'); if (!ART[n]) return;
    const el = build(n, true); host.appendChild(el); FX[n](el, true); host.classList.add('has-still');
  });
  let firstVisit = false;
  d.querySelectorAll('[data-splash-as]').forEach((b) => b.addEventListener('click', () => {
    firstVisit = b.getAttribute('data-splash-as') === 'first';
    d.querySelectorAll('[data-splash-as]').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
  }));
  d.addEventListener('click', (e) => {
    const b = e.target.closest('[data-splash-play]'); if (!b) return;
    e.preventDefault(); play(+b.getAttribute('data-splash-play'), { firstVisit });
  });

  /* ---------------- start ---------------- */
  const m = location.search.match(/[?&]splash=([^&#]*)/), q = m ? m[1] : null;
  if (q === 'off') ss.del(KEY); else if (valid(q)) ss.set(KEY, q);
  const pick = q === 'off' ? null : valid(q) ? q : valid(ss.get(KEY)) ? ss.get(KEY) : null;
  if (pick) { switcher(+pick); play(+pick); }
  else if (LIVE && !ss.get(SEEN) && !RMQ.matches) { ss.set(SEEN, '1'); play(LIVE); }
  root.classList.remove('splash-pending');
})();
