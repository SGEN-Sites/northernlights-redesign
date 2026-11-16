/* reactive.js: the reactive layer (round 2). The page answers the visitor's pointer and scroll, quietly, in the brand's
   own light (the aurora gradient, teal and orchid). Bundled after site.js; styles in reactive.css.
   - Every device (off under reduced motion): a 2px aurora progress line along the sticky header's bottom edge.
   - Fine pointers only ((hover: hover) and (pointer: fine), no reduced motion), all driven by ONE delegated document
     pointermove listener and ONE rAF loop that runs only while something is moving or settling:
       spotlight cards  the card under the pointer gets --sx/--sy and .is-spot; reactive.css draws a soft light under its
                        content and a lit 1px rim at its edge
       magnetic buttons every .btn, .hdr__shop and .sbar__btn--shop leans toward the pointer (max 6px, eased, `translate`)
       photo frames     [data-nlf] get --rx/--ry (tilt, deg), --gx/--gy (glare, %) and .is-hot; frames.css draws them
       hero parallax    the home .hero layers drift against the pointer by depth; composed with site.js's scroll
                        parallax through el.__nlp / el.__nls so the two never fight over `translate`
       store panels     the home "Where are you shopping today?" panels (.sp) lean toward the pointer as one group
       cursor glow      a fixed, screen-blended light that follows the pointer over dark sections only (it steps aside
                        over light bands, the white menu, the chrome and the spotlight cards)
   Each frame reads (hit test, rects) first and writes (classes, custom properties, translate) after. Decorative layers are
   aria-hidden and never take pointer events. Nothing here reaches into the third-party menu iframe. */
(() => {
  'use strict';
  const d = document, root = d.documentElement, W = window;
  if (!d.getElementById('nl-data')) return;
  const RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const px = (v) => v.toFixed(2) + 'px';
  const ease = (o, k) => { o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k; };

  /* ---------------- scroll progress: a 2px aurora line along the header's bottom edge ---------------- */
  const hdr = d.querySelector('[data-hdr]');
  if (hdr && !RM) {
    const line = d.createElement('span'); line.className = 'rx-prog'; line.setAttribute('aria-hidden', 'true'); hdr.appendChild(line);
    let max = 1, queued = false, lit = false;
    const paint = () => {
      queued = false; const p = clamp(W.scrollY / max, 0, 1);
      line.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if ((p > 0.001) !== lit) { lit = !lit; line.classList.toggle('is-on', lit); }
    };
    // the page height is read only when it changes (ResizeObserver, resize), never during scroll
    const measure = () => { max = Math.max(1, root.scrollHeight - W.innerHeight); paint(); };
    W.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    W.addEventListener('resize', measure, { passive: true });
    if ('ResizeObserver' in W) new ResizeObserver(measure).observe(d.body);
    measure();
  }

  if (!FINE || RM) return;
  root.classList.add('rx-fine');

  // .bento__match is left out: it already carries its own pointer light (home.css ::before, site.js [data-spot])
  const SPOT = '.cat__a, .bento__a:not(.bento__match), .gcard, .pcard a, .scard, .sp__card, .way, .value, .tier, .rcard, .guides a, .saver, .sstrip__a, .shero__card, .dl__store, .areas__ul a, .faq__item';
  const MAG = '.btn, .hdr__shop, .sbar__btn--shop';
  // the cursor glow shows over dark sections only: never over the light bands, the white menu, frames or the chrome
  const NOGLOW = '.band--paper, .menu, iframe, .hdr, .topbar, .gate, [data-smodal], [data-drawer], .sbar';

  /* ---------------- pointer state: one delegated listener ---------------- */
  const P = { x: 0, y: 0, el: null, on: false, hit: false };
  let raf = 0;
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const track = (e) => { if (e.pointerType === 'touch') return; P.x = e.clientX; P.y = e.clientY; P.el = e.target; P.on = true; kick(); };
  d.addEventListener('pointermove', track, { passive: true });
  d.addEventListener('pointerover', track, { passive: true });
  const gone = () => { P.on = false; P.el = null; kick(); };
  d.addEventListener('pointerout', (e) => { if (e.pointerType !== 'touch' && !e.relatedTarget) gone(); }, { passive: true });
  W.addEventListener('blur', gone);
  // scrolling under a still pointer changes what is under it: hit-test again on the next frame
  W.addEventListener('scroll', () => { if (P.on) { P.hit = true; kick(); } }, { passive: true });

  /* ---------------- effect state ---------------- */
  const spot = { el: null };
  const fig = { el: null };
  const mags = new Map(); // button -> { x, y, tx, ty }: current and target pull in px
  const heroEl = d.querySelector('.hero');
  // [selector, x px, y px] at full pointer offset: the photo sky deepest and smallest, the coin and the frame closest
  const layers = heroEl ? [['.hero__media', 5, 4], ['.hero__stars', 10, 7], ['.hero__copy', 4, 3], ['.hero__art .coin', 18, 12], ['.hero__art [data-nlf]', 14, 10]]
    .map(([s, ax, ay]) => ({ el: heroEl.querySelector(s), ax, ay })).filter((l) => l.el) : [];
  const hero = { x: 0, y: 0, tx: 0, ty: 0, live: false };
  const grid = d.querySelector('.choose__grid');
  const panels = grid ? Array.from(grid.querySelectorAll('.sp')) : [];
  const lean = { x: 0, y: 0, tx: 0, ty: 0, live: false };
  const glow = d.createElement('div'); glow.className = 'rx-glow'; glow.setAttribute('aria-hidden', 'true'); d.body.appendChild(glow);
  const gl = { x: 0, y: 0, tx: 0, ty: 0, on: false };
  const near = (o, e) => Math.abs(o.tx - o.x) < e && Math.abs(o.ty - o.y) < e;

  function frame() {
    raf = 0;
    /* ---- reads ---- */
    if (P.hit) { P.hit = false; if (P.on) P.el = d.elementFromPoint(P.x, P.y); }
    const t = P.on && P.el && P.el.closest ? P.el : null;
    const card = t ? t.closest(SPOT) : null;
    const nf = t ? t.closest('[data-nlf]') : null;
    const mag = t ? t.closest(MAG) : null;
    const inHero = !!(t && layers.length && heroEl.contains(t));
    const inGrid = !!(t && panels.length && grid.contains(t));
    const dark = !!(t && t.closest('main, [data-ftr]') && !t.closest(NOGLOW));
    const rc = card && card.getBoundingClientRect();
    const rf = nf && nf.getBoundingClientRect();
    const rm = mag && mag.getBoundingClientRect();
    const rh = inHero && heroEl.getBoundingClientRect();
    const rg = inGrid && grid.getBoundingClientRect();
    let more = false;

    /* ---- writes ---- */
    // spotlight: the light sits under the card's content (reactive.css), --sx/--sy in px from the card's corner
    if (card !== spot.el) { if (spot.el) spot.el.classList.remove('is-spot'); spot.el = card; if (card) card.classList.add('is-spot'); }
    if (card) { card.style.setProperty('--sx', px(P.x - rc.left)); card.style.setProperty('--sy', px(P.y - rc.top)); }

    // photo frames: the frame turns to face the pointer (same sense as the category tiles), the glare follows it
    if (nf !== fig.el) {
      if (fig.el) { fig.el.classList.remove('is-hot'); fig.el.style.setProperty('--rx', '0deg'); fig.el.style.setProperty('--ry', '0deg'); }
      fig.el = nf; if (nf) nf.classList.add('is-hot');
    }
    if (nf && rf.width && rf.height) {
      const u = clamp((P.x - rf.left) / rf.width, 0, 1), v = clamp((P.y - rf.top) / rf.height, 0, 1);
      nf.style.setProperty('--ry', ((u - 0.5) * 16).toFixed(2) + 'deg'); nf.style.setProperty('--rx', ((0.5 - v) * 14).toFixed(2) + 'deg');
      nf.style.setProperty('--gx', (u * 100).toFixed(1) + '%'); nf.style.setProperty('--gy', (v * 100).toFixed(1) + '%');
    }

    // magnetic buttons: pull toward the pointer while over the button, ease home after; centre measured without the pull
    if (mag && !mags.has(mag)) mags.set(mag, { x: 0, y: 0, tx: 0, ty: 0 });
    mags.forEach((m, el) => {
      if (el === mag && rm) {
        m.tx = clamp((P.x - (rm.left + rm.width / 2 - m.x)) * 0.22, -6, 6);
        m.ty = clamp((P.y - (rm.top + rm.height / 2 - m.y)) * 0.32, -4, 4);
      } else { m.tx = 0; m.ty = 0; }
      ease(m, 0.24);
      if (near(m, 0.05)) { m.x = m.tx; m.y = m.ty; if (!m.tx && !m.ty && el !== mag) { el.style.translate = ''; mags.delete(el); return; } } else more = true;
      el.style.translate = px(m.x) + ' ' + px(m.y);
    });

    // hero parallax: every layer moves against the pointer, more the closer it sits (offset -1..1 from the hero's centre)
    if (layers.length) {
      if (rh) { hero.tx = clamp(((P.x - rh.left) / rh.width) * 2 - 1, -1, 1); hero.ty = clamp(((P.y - rh.top) / rh.height) * 2 - 1, -1, 1); } else { hero.tx = 0; hero.ty = 0; }
      if (hero.live || hero.tx || hero.ty) {
        ease(hero, 0.08);
        const done = near(hero, 0.002); if (done) { hero.x = hero.tx; hero.y = hero.ty; } else more = true;
        const rest = done && !hero.tx && !hero.ty;
        for (const l of layers) {
          const el = l.el;
          if (rest) { el.__nlp = null; el.style.translate = el.__nls != null ? '0 ' + el.__nls.toFixed(1) + 'px' : ''; continue; }
          const x = -hero.x * l.ax, y = -hero.y * l.ay; el.__nlp = { x, y };
          el.style.translate = px(x) + ' ' + px((el.__nls || 0) + y);
        }
        hero.live = !rest;
      }
    }

    // store panels: both lean toward the pointer together, a few px
    if (panels.length) {
      if (rg) { lean.tx = clamp(((P.x - rg.left) / rg.width) * 2 - 1, -1, 1); lean.ty = clamp(((P.y - rg.top) / rg.height) * 2 - 1, -1, 1); } else { lean.tx = 0; lean.ty = 0; }
      if (lean.live || lean.tx || lean.ty) {
        ease(lean, 0.1);
        const done = near(lean, 0.002); if (done) { lean.x = lean.tx; lean.y = lean.ty; } else more = true;
        const rest = done && !lean.tx && !lean.ty;
        for (const p of panels) p.style.translate = rest ? '' : px(lean.x * 6) + ' ' + px(lean.y * 4);
        lean.live = !rest;
      }
    }

    // cursor glow: follows with a little lag; fades out over light sections, when the pointer leaves, and over a
    // spotlight card (the card's own light takes over, so the two never stack up behind the card's text)
    const show = dark && !card;
    if (show) { if (!gl.on) { gl.x = P.x; gl.y = P.y; } gl.tx = P.x; gl.ty = P.y; }
    if (show !== gl.on) { gl.on = show; glow.classList.toggle('is-on', show); }
    if (gl.on) {
      ease(gl, 0.2); if (!near(gl, 0.3)) more = true;
      glow.style.transform = 'translate3d(' + gl.x.toFixed(1) + 'px,' + gl.y.toFixed(1) + 'px,0)';
    }

    if (more) kick();
  }
})();
