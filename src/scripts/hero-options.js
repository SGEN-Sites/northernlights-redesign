/* hero-options.js (round 3, lane H): motion for the hero options lab (src/pages/lab-hero.mjs, /hero-options/*).
   Bundled after site.js on every page; it does nothing where there is no [data-hx] hero (except the switcher, below).
   Styles: src/styles/hero-options.css.
   B "Aurora Stage"  the first screen's scroll progress (--p, every device) lifts and shrinks the badge and headline
                     while the scene zooms and the aurora curtain deepens; a fine pointer adds depth (--mx/--my).
   C "Two Lights"    the seam between Whitehall and Menands (--s, 0..1) follows a fine pointer, eased, between the two
                     store blocks, and settles back to 58% (Whitehall wider) when the pointer leaves; on a touch screen
                     wide enough for the side-by-side split its grip drags it. Phones stack the stores: scroll (--p) only.
   D "Orbit"         the category cut-outs drift in slow ellipses, lean away from a fine pointer by depth (the nearest
                     move most) and part as the page scrolls; a hovered or focused object holds still.
   The switcher      the home page shows it too when it is opened from the lab (/?hx=a), so A compares in place.
   One rAF loop per hero, awake only while that hero is on screen and something moves (IntersectionObserver); each
   frame reads first and writes after; nothing moves under prefers-reduced-motion; without JS every hero is its
   finished static composition. */
(() => {
  'use strict';
  const d = document, W = window;
  const dataEl = d.getElementById('nl-data');
  if (!dataEl) return;
  const heroes = Array.from(d.querySelectorAll('[data-hx]'));
  const RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const ease = (dt, tau) => 1 - Math.exp(-dt / tau); // frame-rate independent easing toward a target

  /* ---------------- the switcher on the home page (option A), only when opened from the lab ---------------- */
  if (!heroes.length && !d.querySelector('[data-hxs]') && /[?&]hx=a(&|$)/.test(location.search)) {
    let base = '/';
    try { base = JSON.parse(dataEl.textContent).base || '/'; } catch (e) { /* keep "/" */ }
    const opts = [['A', 'Lights on Broadway', '?hx=a'], ['B', 'Aurora Stage', 'hero-options/b/'], ['C', 'Two Lights', 'hero-options/c/'], ['D', 'Orbit', 'hero-options/d/']];
    const nav = d.createElement('nav');
    nav.className = 'hxs'; nav.setAttribute('data-hxs', ''); nav.setAttribute('aria-label', 'Hero options');
    nav.innerHTML = '<a class="hxs__all" href="' + base + 'hero-options/"><svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg><span>Hero options</span></a><ol class="hxs__list">'
      + opts.map(([k, name, to]) => '<li><a class="hxs__o' + (k === 'A' ? ' is-on' : '') + '" href="' + base + to + '" title="' + k + ': ' + name + '"' + (k === 'A' ? ' aria-current="page"' : '') + '><span aria-hidden="true">' + k + '</span><span class="sr-only">Option ' + k + ', ' + name + '</span></a></li>').join('')
      + '</ol>';
    (d.querySelector('main') || d.body).appendChild(nav);
  }
  if (!heroes.length || RM) return;

  /* a rAF loop for one hero: kick() wakes it; step(dt) runs each frame while the hero is on screen and returns true
     while it still has something to move */
  function loop(el, step) {
    let vis = false, raf = 0, last = 0;
    const frame = (now) => {
      raf = 0;
      if (!vis || d.hidden) { last = 0; return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (step(dt)) raf = W.requestAnimationFrame(frame); else last = 0;
    };
    const kick = () => { if (!raf && vis && !d.hidden) raf = W.requestAnimationFrame(frame); };
    if ('IntersectionObserver' in W) new IntersectionObserver((en) => { vis = en[0].isIntersecting; kick(); }, { rootMargin: '120px 0px' }).observe(el);
    else vis = true;
    d.addEventListener('visibilitychange', kick);
    return kick;
  }
  // a fine pointer over the hero, in client px (null when it is not over it); touch never counts
  function pointer(hero, kick) {
    const P = { x: null, y: null };
    if (!FINE) return P;
    hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; P.x = e.clientX; P.y = e.clientY; kick(); }, { passive: true });
    hero.addEventListener('pointerleave', () => { P.x = null; P.y = null; kick(); }, { passive: true });
    return P;
  }
  const set = (el, k, v, last, fix = 4) => { const s = v.toFixed(fix); if (last[k] !== s) { last[k] = s; el.style.setProperty(k, s); } };

  /* ---------------- B: Aurora Stage ---------------- */
  function stage(hero) {
    const st = { x: 0, y: 0 }, out = {};
    let P = null;
    const kick = loop(hero, (dt) => {
      const r = hero.getBoundingClientRect();
      const p = clamp(-r.top / (r.height * 0.85), 0, 1);
      const tx = P.x == null ? 0 : clamp(((P.x - r.left) / r.width) * 2 - 1, -1, 1);
      const ty = P.y == null ? 0 : clamp(((P.y - r.top) / r.height) * 2 - 1, -1, 1);
      const k = ease(dt, 0.35);
      st.x += (tx - st.x) * k; st.y += (ty - st.y) * k;
      const moving = Math.abs(tx - st.x) > 0.001 || Math.abs(ty - st.y) > 0.001;
      if (!moving) { st.x = tx; st.y = ty; }
      set(hero, '--p', p, out); set(hero, '--mx', st.x, out, 3); set(hero, '--my', st.y, out, 3);
      return moving; // scrolling kicks it again
    });
    P = pointer(hero, kick);
    W.addEventListener('scroll', kick, { passive: true });
    W.addEventListener('resize', kick, { passive: true });
    kick();
  }

  /* ---------------- C: Two Lights ---------------- */
  function split(hero) {
    const wb = hero.querySelector('.hxc__store--whitehall'), mb = hero.querySelector('.hxc__store--menands'), grip = hero.querySelector('.hxc__grip');
    if (!wb || !mb) return;
    const DEF = 0.58, wide = W.matchMedia('(min-width: 861px)'), out = {};
    // s: where the seam is, t: where it is going, lo/hi: the open water between the two store blocks
    const st = { s: 0.5, t: DEF, lo: 0.36, hi: 0.66, drag: false, intro: true, home: DEF };
    let P = null;
    function bounds() {
      if (!wide.matches) return;
      const r = hero.getBoundingClientRect(), a = wb.getBoundingClientRect(), b = mb.getBoundingClientRect();
      if (!r.width) return;
      st.lo = clamp((a.right - r.left + 28) / r.width, 0.26, DEF);
      st.hi = clamp((b.left - r.left - 28) / r.width, DEF, 0.74);
    }
    const kick = loop(hero, (dt) => {
      const r = hero.getBoundingClientRect();
      if (!wide.matches) { // phones: the stacked layout; the scroll only brightens the seam and drifts the scenes
        set(hero, '--p', clamp(-r.top / Math.max(1, r.height * 0.8), 0, 1), out);
        return false;
      }
      if (!st.drag) st.t = P.x != null ? clamp((P.x - r.left) / r.width, st.lo, st.hi) : clamp(st.home, st.lo, st.hi);
      st.s += (st.t - st.s) * ease(dt, st.intro ? 0.45 : 0.16);
      const moving = Math.abs(st.t - st.s) > 0.0004;
      if (!moving) { st.s = st.t; st.intro = false; }
      set(hero, '--s', st.s, out);
      return moving;
    });
    P = pointer(hero, kick);
    // touch screens wide enough for the side-by-side split: drag the grip (the page still scrolls everywhere else)
    const touchWide = () => hero.classList.toggle('is-drag', wide.matches && !FINE);
    touchWide();
    if (grip && !FINE) {
      const to = (e) => { const r = hero.getBoundingClientRect(); st.t = clamp((e.clientX - r.left) / r.width, st.lo, st.hi); st.home = st.t; st.intro = false; kick(); };
      grip.addEventListener('pointerdown', (e) => { if (!wide.matches) return; st.drag = true; try { grip.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } to(e); });
      grip.addEventListener('pointermove', (e) => { if (st.drag) to(e); });
      const end = () => { st.drag = false; };
      grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
    }
    W.addEventListener('scroll', () => { if (!wide.matches) kick(); }, { passive: true });
    W.addEventListener('resize', () => { bounds(); touchWide(); kick(); }, { passive: true });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { bounds(); kick(); });
    bounds();
    kick();
  }

  /* ---------------- D: Orbit ---------------- */
  function orbit(hero) {
    const els = Array.from(hero.querySelectorAll('[data-hxd-o]'));
    if (!els.length) return;
    // each object: its depth, its own slow ellipse (radius by depth, alternating direction, a full turn in ~18-30 s)
    const os = els.map((el, i) => {
      const z = parseFloat(el.style.getPropertyValue('--z')) || 0.5;
      return { el, z, a: i * 2.39996 + 0.6, w: (0.21 + ((i * 7) % 5) * 0.03) * (i % 2 ? -1 : 1), rx: 6 + z * 11, ry: 5 + z * 8, hold: 0, ht: 0, last: '' };
    });
    const st = { x: 0, y: 0, t: 0 };
    let P = null;
    const kick = loop(hero, (dt) => {
      st.t += dt;
      const r = hero.getBoundingClientRect();
      const tx = P.x == null ? 0 : clamp(((P.x - r.left) / r.width) * 2 - 1, -1, 1);
      const ty = P.y == null ? 0 : clamp(((P.y - r.top) / r.height) * 2 - 1, -1, 1);
      const k = ease(dt, 0.5);
      st.x += (tx - st.x) * k; st.y += (ty - st.y) * k;
      const sy = clamp(-r.top, 0, r.height); // how far the hero has scrolled up: near objects part faster
      const intro = Math.min(1, st.t / 1.8), grow = intro * intro * (3 - 2 * intro);
      for (const o of os) {
        o.hold += (o.ht - o.hold) * ease(dt, 0.3);
        const amp = grow * (1 - 0.85 * o.hold), a = o.a + st.t * o.w;
        const x = Math.cos(a) * o.rx * amp - st.x * 24 * o.z;
        const y = Math.sin(a) * o.ry * amp - st.y * 16 * o.z - sy * 0.2 * o.z;
        const tr = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + (Math.sin(a * 0.8) * 3.5 * amp).toFixed(2) + 'deg)';
        if (tr !== o.last) { o.last = tr; o.el.style.transform = tr; }
      }
      return true; // the drift never stops while the hero is on screen
    });
    P = pointer(hero, kick);
    os.forEach((o) => {
      const a = o.el.querySelector('a') || o.el;
      a.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') o.ht = 1; });
      a.addEventListener('pointerleave', () => { o.ht = 0; });
      a.addEventListener('focus', () => { o.ht = 1; });
      a.addEventListener('blur', () => { o.ht = 0; });
    });
    kick();
  }

  heroes.forEach((hero) => {
    const k = hero.getAttribute('data-hx');
    if (k === 'b') stage(hero); else if (k === 'c') split(hero); else if (k === 'd') orbit(hero);
  });
})();
