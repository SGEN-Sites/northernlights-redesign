/* site.js */
/* site.js: Northern Lights redesign. One file, no dependencies. Every URL comes from the page (#nl-data and HTML
   attributes), never from a hard-coded root, so the build works under any base path. Without JS every page is
   complete: links point at Whitehall's pages, nothing is hidden. (Store system, gate, bar and dialogs adapted from an
   earlier redesign of ours.) */
(() => {
  'use strict';
  const d = document, root = d.documentElement, W = window;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const dataEl = d.getElementById('nl-data');
  if (!dataEl) return;
  const DATA = JSON.parse(dataEl.textContent);
  const RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const byId = (id) => DATA.stores.find((s) => s.id === id) || DATA.stores[0];
  const valid = (id) => DATA.stores.some((s) => s.id === id);

  /* ---------------- store system ---------------- */
  const catPath = (sid, cat) => {
    const has = (DATA.storeCats[sid] || []).indexOf(cat) >= 0;
    const at = has ? sid : (DATA.storeCats[DATA.defaultStore].indexOf(cat) >= 0 ? DATA.defaultStore : DATA.stores.find((s) => DATA.storeCats[s.id].indexOf(cat) >= 0).id);
    return { href: DATA.base + at + '/' + cat + '/', at };
  };
  const storeHref = (s, kind) => ({ menu: s.menu, specials: s.menu + 'specials/', page: s.page, brands: s.menu + 'brands/' }[kind] || s.menu);
  function nyNow() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = (t) => (parts.find((p) => p.type === t) || {}).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day: day < 0 ? new Date().getDay() : day, mins: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
  }
  const fmt = (h) => { const ap = h >= 12 ? 'pm' : 'am'; return (h % 12 || 12) + ap; };
  function statusOf(s) {
    const n = nyNow(); const [o, c] = s.hours[n.day]; const open = n.mins >= o * 60 && n.mins < c * 60;
    const range = fmt(o) + '–' + fmt(c);
    if (open) return { open: true, text: '<b>Open now</b> · ' + range };
    const before = n.mins < o * 60; const nd = before ? n.day : (n.day + 1) % 7;
    return { open: false, text: '<b>Closed</b> · opens ' + fmt(s.hours[nd][0]) + (before ? '' : ' tomorrow') };
  }
  function renderStatus() {
    const cur = root.getAttribute('data-store');
    $$('[data-status-for], [data-status-current]').forEach((el) => {
      const s = byId(el.hasAttribute('data-status-current') ? cur : el.getAttribute('data-status-for'));
      const st = statusOf(s);
      el.classList.toggle('is-open', st.open); el.classList.toggle('is-closed', !st.open);
      const t = el.querySelector('.status__txt'); if (t) t.innerHTML = st.text;
    });
    const n = nyNow();
    $$('.hours tbody tr').forEach((r) => r.classList.toggle('is-today', +r.getAttribute('data-day') === n.day));
  }
  function applyStore(id) {
    const s = byId(id);
    root.setAttribute('data-store', s.id);
    $$('[data-cat]').forEach((a) => { const r = catPath(s.id, a.getAttribute('data-cat')); a.href = r.href; a.toggleAttribute('data-elsewhere', r.at !== s.id); a.setAttribute('data-at', r.at !== s.id ? 'at ' + byId(r.at).city : ''); });
    $$('[data-cat-item]').forEach((li) => { const c = li.getAttribute('data-cat-item'); li.toggleAttribute('data-elsewhere', (DATA.storeCats[s.id] || []).indexOf(c) < 0); });
    $$('[data-store-href]').forEach((a) => { a.href = storeHref(s, a.getAttribute('data-store-href')); });
    $$('[data-store-city]').forEach((el) => { el.textContent = s.city; });
    $$('[data-store-name]').forEach((el) => { el.textContent = s.name; });
    $$('[data-store-phone]').forEach((el) => { el.textContent = s.phone; });
    $$('[data-store-tel]').forEach((a) => { a.href = 'tel:' + s.tel; });
    $$('[data-store-directions]').forEach((a) => { a.href = s.directions; });
    $$('.light').forEach((el) => { if (el.closest('[data-store-card], .gate__store, .sstrip__a, .seg__b, .mhead__id, .lm, .sp__badge')) return; el.classList.toggle('light--menands', s.id === 'menands'); el.classList.toggle('light--whitehall', s.id === 'whitehall'); });
    $$('[data-store-card]').forEach((c) => c.classList.toggle('is-mine', c.getAttribute('data-store-card') === s.id));
    $$('[data-seg]').forEach((b) => { const on = b.getAttribute('data-seg') === s.id; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    renderStatus();
  }
  // a store's own menu pages set the store: the bar and every Shop button then match the menu being browsed
  const pageStore = ($('[data-page-store]') || {}).getAttribute ? $('[data-page-store]').getAttribute('data-page-store') : null;
  if (pageStore && valid(pageStore)) ls.set('nl.store', pageStore);
  const saved = ls.get('nl.store');
  applyStore(valid(saved) ? saved : DATA.defaultStore);
  W.setInterval(renderStatus, 60000);

  function toast(msg) { const t = d.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; d.body.appendChild(t); W.setTimeout(() => t.remove(), 2700); }

  /* ---------------- focus trap for dialogs ---------------- */
  function trap(box, e) {
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', box).filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------- 21+ gate: age, then store (Whitehall first) ---------------- */
  const gate = $('#gate');
  function closeGate() { if (!gate) return; gate.hidden = true; root.classList.remove('gate-open', 'gate-pending'); evalBar(); }
  if (gate && !ls.get('nl.age') && !/[?&]gate=off/.test(location.search)) {
    gate.hidden = false; root.classList.add('gate-open');
    W.setTimeout(() => { const b = $('[data-gate-yes]', gate); if (b) b.focus(); }, 60);
    gate.addEventListener('keydown', (e) => trap(gate, e));
  } else root.classList.remove('gate-pending');
  if (gate) {
    gate.addEventListener('click', (e) => {
      if (e.target.closest('[data-gate-yes]')) {
        ls.set('nl.age', '1');
        if (valid(ls.get('nl.store')) || pageStore) { closeGate(); return; }
        $('[data-gate-step="1"]', gate).hidden = true; const s2 = $('[data-gate-step="2"]', gate); s2.hidden = false; const f = $('button', s2); if (f) f.focus();
      } else if (e.target.closest('[data-gate-no]')) {
        const m = $('[data-gate-msg]', gate); if (m) m.hidden = false;
      }
    });
  }

  /* ---------------- store switcher ---------------- */
  const modal = $('[data-smodal]'); let lastFocus = null;
  function openModal() { if (!modal) return; lastFocus = d.activeElement; modal.hidden = false; root.classList.add('gate-open'); W.setTimeout(() => { const b = $('.smodal__x', modal); if (b) b.focus(); }, 40); hideBar(); }
  function closeModal() { if (!modal || modal.hidden) return; modal.hidden = true; root.classList.remove('gate-open'); if (lastFocus) lastFocus.focus(); evalBar(); }
  let lastPick = { id: null, t: 0 };
  function pickStore(id, fromGate) {
    if (!valid(id)) return;
    if (lastPick.id === id && performance.now() - lastPick.t < 350) return;
    lastPick = { id, t: performance.now() };
    const prev = root.getAttribute('data-store');
    ls.set('nl.store', id); applyStore(id);
    $$('[data-store-card="' + id + '"]').forEach((c) => { c.classList.remove('is-picked'); void c.offsetWidth; c.classList.add('is-picked'); W.setTimeout(() => c.classList.remove('is-picked'), 1200); });
    if (fromGate) { closeGate(); toast('Shopping ' + byId(id).name + '. Enjoy!'); return; }
    if (modal && !modal.hidden) W.setTimeout(closeModal, 380);
    // on a store's own menu page, switching store means switching menus: go to the same shelf at the other store
    if (pageStore && id !== pageStore) { const sw = $('[data-switch-to="' + id + '"]'); if (sw) { W.setTimeout(() => { location.href = sw.href; }, 420); return; } }
    if (prev !== id) toast('Now shopping ' + byId(id).name);
  }
  d.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open-store]'); if (o) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('[data-smodal-close]')) { closeModal(); return; }
    const set = e.target.closest('[data-set-store]');
    if (set) { pickStore(set.getAttribute('data-set-store'), set.hasAttribute('data-gate-done')); return; }
    const card = e.target.closest('[data-pick-card]');
    if (card && !e.target.closest('a, button, input, select, textarea, summary, label')) pickStore(card.getAttribute('data-store-card'), false);
  });
  if (modal) modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); trap(modal, e); });

  /* ---------------- header: frost on scroll, mega menus, drawer ---------------- */
  const hdr = $('[data-hdr]');
  let megaOpen = null, megaTimer = 0;
  function setMega(key) {
    $$('[data-mega-btn]').forEach((b) => { const on = b.getAttribute('data-mega-btn') === key; b.setAttribute('aria-expanded', on ? 'true' : 'false'); const p = d.getElementById('mega-' + b.getAttribute('data-mega-btn')); if (p) p.hidden = !on; });
    megaOpen = key; if (hdr) hdr.classList.toggle('is-solid', !!key);
  }
  $$('[data-mega-btn]').forEach((b) => {
    const key = b.getAttribute('data-mega-btn'); const item = b.closest('.nav__item');
    b.addEventListener('click', () => setMega(megaOpen === key ? null : key));
    if (FINE && item) {
      item.addEventListener('mouseenter', () => { W.clearTimeout(megaTimer); megaTimer = W.setTimeout(() => setMega(key), 90); });
      item.addEventListener('mouseleave', () => { W.clearTimeout(megaTimer); megaTimer = W.setTimeout(() => { if (megaOpen === key) setMega(null); }, 220); });
    }
  });
  d.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (megaOpen) { const b = $('[data-mega-btn="' + megaOpen + '"]'); setMega(null); if (b) b.focus(); } closeDrawer(); } });
  d.addEventListener('click', (e) => { if (megaOpen && !e.target.closest('.nav__item')) setMega(null); });

  const drawer = $('[data-drawer]'), dbtn = $('[data-drawer-btn]');
  function closeDrawer() { if (!drawer || drawer.hidden) return; drawer.hidden = true; d.body.classList.remove('drawer-open'); if (dbtn) { dbtn.setAttribute('aria-expanded', 'false'); dbtn.setAttribute('aria-label', 'Open menu'); } if (hdr) hdr.classList.remove('is-solid'); evalBar(); }
  if (dbtn && drawer) dbtn.addEventListener('click', () => {
    if (!drawer.hidden) { closeDrawer(); return; }
    drawer.hidden = false; d.body.classList.add('drawer-open'); dbtn.setAttribute('aria-expanded', 'true'); dbtn.setAttribute('aria-label', 'Close menu'); if (hdr) hdr.classList.add('is-solid'); hideBar();
  });
  if (drawer) drawer.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });

  /* ---------------- sticky store bar: past the first screen, gone at the footer, while typing, or for the session ---------------- */
  const bar = $('[data-sbar]'); const ftr = $('[data-ftr]');
  let footerIn = false, typing = false, barOff = ss.get('nl.bar') === 'off', barWant = false;
  function hideBar() { if (!bar) return; barWant = false; bar.classList.remove('is-on'); root.style.setProperty('--bottom-stack', '0px'); }
  function evalBar() {
    if (!bar || barOff) return;
    const on = W.scrollY > W.innerHeight * 0.6 && !footerIn && !typing && (!drawer || drawer.hidden) && (!modal || modal.hidden) && !root.classList.contains('gate-open') && !root.classList.contains('gate-pending') && !root.classList.contains('menu-locked');
    barWant = on;
    if (on) { bar.hidden = false; requestAnimationFrame(() => { if (barWant) bar.classList.add('is-on'); }); root.style.setProperty('--bottom-stack', (bar.offsetHeight || 80) + 'px'); } else { bar.classList.remove('is-on'); root.style.setProperty('--bottom-stack', '0px'); }
  }
  if (bar) {
    bar.hidden = false;
    $('[data-sbar-close]', bar).addEventListener('click', () => { barOff = true; ss.set('nl.bar', 'off'); hideBar(); });
    if (ftr && 'IntersectionObserver' in W) new IntersectionObserver((en) => { footerIn = en[0].isIntersecting; evalBar(); }, { rootMargin: '0px 0px -35% 0px' }).observe($('.ftr__main') || ftr);
    d.addEventListener('focusin', (e) => { if (e.target.matches('input, textarea, select')) { typing = true; evalBar(); } });
    d.addEventListener('focusout', (e) => { if (e.target.matches('input, textarea, select')) { typing = false; W.setTimeout(evalBar, 120); } });
  }

  /* ---------------- footer link columns fold on phones ---------------- */
  const ftrCols = $$('.ftr__col');
  if (ftrCols.length && W.matchMedia) {
    const narrow = W.matchMedia('(max-width: 640px)');
    const fold = () => ftrCols.forEach((c) => { c.open = !narrow.matches; });
    fold();
    if (narrow.addEventListener) narrow.addEventListener('change', fold);
  }

  /* ---------------- split headings into words (each word rises in turn) ---------------- */
  $$('[data-split]').forEach((h) => {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/); const frag = d.createDocumentFragment();
          parts.forEach((p) => { if (/^\s+$/.test(p) || !p) frag.appendChild(d.createTextNode(p)); else { const s = d.createElement('span'); s.className = 'w'; s.style.setProperty('--wi', i++); s.textContent = p; frag.appendChild(s); } });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          // a gradient accent (<em>, background-clip: text) rises as ONE piece: WebKit/Safari does not paint the parent's
          // clipped gradient through animated inline-block children, so splitting it made the word invisible on iPhone
          if (n.tagName === 'EM') { n.classList.add('w'); n.style.setProperty('--wi', i++); } else walk(n);
        }
      });
    };
    walk(h);
    h.setAttribute('data-reveal-split', '');
  });

  /* ---------------- scroll loop: header state, bar, parallax ----------------
     Parallax layers move with `translate`. A pointer offset added by reactive.js (the home hero's pointer parallax) sits
     in el.__nlp = {x, y}: this loop folds it in, and keeps its own offset in el.__nls so reactive.js can do the same, so
     the two never fight over the property. Rects are read in one pass, then everything is written. */
  const depth = (!RM && W.innerWidth > 760) ? $$('[data-depth]') : [];
  let ticking = false;
  function onScroll() {
    const y = W.scrollY, moves = [];
    if (depth.length) {
      const vh = W.innerHeight;
      for (const el of depth) {
        const r = el.getBoundingClientRect(); if (r.bottom < -300 || r.top > vh + 300) continue;
        const p = el.__nlp, k = parseFloat(el.getAttribute('data-depth')) || 0;
        moves.push([el, (r.top - (p ? p.y : 0) + r.height / 2 - vh / 2) * -k, p]);
      }
    }
    if (hdr) hdr.classList.toggle('is-scrolled', y > 24);
    evalBar();
    for (const [el, off, p] of moves) { el.__nls = off; el.style.translate = p ? p.x.toFixed(1) + 'px ' + (off + p.y).toFixed(1) + 'px' : '0 ' + off.toFixed(1) + 'px'; }
    ticking = false;
  }
  W.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  W.addEventListener('resize', () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();

  /* ---------------- reveals ---------------- */
  const reveal = $$('[data-reveal], [data-split], [data-livemap], [data-tiers]');
  if ('IntersectionObserver' in W && !RM) {
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveal.forEach((el) => io.observe(el));
    W.setTimeout(() => { reveal.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < W.innerHeight && r.bottom > 0) el.classList.add('is-in'); }); }, 2200);
  } else reveal.forEach((el) => el.classList.add('is-in'));

  /* ---------------- pointer effects (fine pointers only) ---------------- */
  if (FINE && !RM) {
    $$('[data-tilt]').forEach((el) => {
      const t = el.matches('.cat') ? el.querySelector('.cat__a') : el;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        t.style.setProperty('--ty', ((px - 0.5) * 12).toFixed(2) + 'deg'); t.style.setProperty('--tx', ((0.5 - py) * 9).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { t.style.setProperty('--tx', '0deg'); t.style.setProperty('--ty', '0deg'); });
    });
    // magnetic buttons (every .btn, .hdr__shop, .sbar__btn--shop) now live in reactive.js, eased, in its one pointer loop
    $$('[data-spot]').forEach((el) => {
      let raf = 0;
      el.addEventListener('pointermove', (e) => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const r = el.getBoundingClientRect(); el.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); el.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); }); });
    });
  }

  /* ---------------- the badge coin: drag to spin it ---------------- */
  $$('[data-coin]').forEach((c) => {
    const body = $('.coin__body', c); if (!body || RM) return;
    let drag = null;
    c.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, a: 0 }; c.classList.add('is-held'); c.setPointerCapture(e.pointerId); const m = getComputedStyle(body).transform; body.style.animation = 'none'; body.dataset.base = body.dataset.base || '0'; });
    c.addEventListener('pointermove', (e) => { if (!drag) return; const a = (+body.dataset.base) + (e.clientX - drag.x) * 0.9; body.style.transform = 'rotateX(-8deg) rotateY(' + a + 'deg)'; drag.a = a; });
    const end = () => { if (!drag) return; body.dataset.base = String(drag.a % 360); drag = null; c.classList.remove('is-held'); };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    c.style.touchAction = 'pan-y'; c.style.cursor = 'grab';
  });

  /* ---------------- aurora: the badge's spike motif, drawn live (paused off screen, still under reduced motion) ----------------
     It answers the visitor: on fine pointers the rays nearest the pointer grow taller and brighter and lean toward it
     (eased in, decaying once it leaves); on every device the scroll speed adds a gentle sway and shimmer. Still one rAF
     loop per canvas, capped at 30fps, paused off screen; under reduced motion it stays one static frame. */
  const COLS = [[194, 92, 255], [138, 107, 255], [64, 137, 255], [46, 196, 255], [85, 255, 214]];
  const colAt = (t) => { t = ((t % 1) + 1) % 1; const f = t * (COLS.length - 1), i = Math.floor(f), k = f - i, a = COLS[i], b = COLS[Math.min(i + 1, COLS.length - 1)]; return [0, 1, 2].map((j) => Math.round(a[j] + (b[j] - a[j]) * k)).join(','); };
  const CFG = {
    hero: { base: 0.5, amp: 0.08, h: 0.42, n: 120, a: 0.38, w: 0.5 },
    soft: { base: 0.62, amp: 0.07, h: 0.5, n: 90, a: 0.3, w: 0.5 },
    gate: { base: 0.55, amp: 0.09, h: 0.5, n: 100, a: 0.42, w: 0.5 },
    tiers: { base: 0.98, amp: 0.05, h: 0.75, n: 110, a: 0.22, w: 0.55 },
  };
  const AP = { x: 0, y: 0, on: false }; // the pointer in client px, shared by every aurora canvas (fine pointers only)
  if (FINE && !RM && $('canvas[data-aurora]')) {
    d.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; AP.x = e.clientX; AP.y = e.clientY; AP.on = true; }, { passive: true });
    d.addEventListener('pointerout', (e) => { if (!e.relatedTarget) AP.on = false; }, { passive: true });
    W.addEventListener('blur', () => { AP.on = false; });
  }
  $$('canvas[data-aurora]').forEach((cv) => {
    const cfg = CFG[cv.getAttribute('data-aurora')] || CFG.soft; const ctx = cv.getContext('2d'); if (!ctx) return;
    let w = 0, h = 0, vis = false, run = false, last = 0; const seed = Math.random() * 100;
    // the eased pointer over this canvas (canvas px), its pull e (0..1), the scroll sway sw (-1..1), the last scroll sample
    const st = { x: 0, y: 0, e: 0, sw: 0, sy: W.scrollY, t: 0 };
    function size() { const r = cv.getBoundingClientRect(); const dpr = Math.min(1.5, W.devicePixelRatio || 1); w = cv.width = Math.max(1, Math.round(r.width * dpr)); h = cv.height = Math.max(1, Math.round(r.height * dpr)); }
    function sense(t) {
      const r = cv.getBoundingClientRect();
      const over = AP.on && r.width > 0 && AP.x >= r.left && AP.x <= r.right && AP.y >= r.top && AP.y <= r.bottom;
      if (over) {
        const tx = (AP.x - r.left) * (w / r.width), ty = (AP.y - r.top) * (h / r.height);
        if (st.e < 0.02) { st.x = tx; st.y = ty; } else { st.x += (tx - st.x) * 0.22; st.y += (ty - st.y) * 0.22; }
      }
      st.e += ((over ? 1 : 0) - st.e) * (over ? 0.12 : 0.05); if (st.e < 0.003) st.e = 0;
      const y = W.scrollY, v = st.t ? (y - st.sy) / Math.max(16, t - st.t) : 0; st.sy = y; st.t = t;
      st.sw += (Math.max(-1, Math.min(1, v * 0.9)) - st.sw) * 0.16; if (Math.abs(st.sw) < 0.003) st.sw = 0;
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = 'lighter';
      const n = W.innerWidth < 760 ? Math.round(cfg.n * 0.55) : cfg.n; const step = w / n;
      const e = st.e, sw = st.sw, sh = Math.abs(sw), sx = Math.max(70, w * 0.09), kx = 1 / (2 * sx * sx), ky = 2 / (h * h);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const wave = Math.sin(u * 5.5 + t * 0.00022 + seed) * 0.6 + Math.sin(u * 12.5 - t * 0.00035) * 0.4;
        const by = h * (cfg.base + cfg.amp * wave);
        const pulse = Math.sin(u * 23 + t * 0.0008 + i * 1.7); let len = h * cfg.h * (0.35 + 0.65 * pulse * pulse);
        const x = i * step + step / 2;
        // f: how much the pointer pulls this ray (gaussian in x, gentle in y); shim: the scroll shimmer
        let f = 0; if (e) { const dx = x - st.x, dy = by - len * 0.5 - st.y; f = e * Math.exp(-dx * dx * kx - dy * dy * ky); }
        const shim = sh ? sh * (0.5 + 0.5 * Math.sin(u * 41 + t * 0.011 + seed)) : 0;
        len *= 1 + 0.55 * f + 0.1 * sh;
        const a = Math.min(0.8, cfg.a * (1 + 0.85 * f + 0.55 * shim));
        const lean = (st.x - x) * 0.16 * f + sw * len * 0.09 * Math.sin(u * 7 + t * 0.0016 + seed);
        const c = colAt(u * 0.9 + Math.sin(t * 0.00006 + seed) * 0.12);
        const g = ctx.createLinearGradient(0, by, 0, by - len); g.addColorStop(0, 'rgba(' + c + ',' + a.toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(' + c + ',' + (a * 0.35).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = g; const hw = Math.max(1.2, step * cfg.w) / 2;
        ctx.beginPath(); ctx.moveTo(x - hw, by); ctx.lineTo(x + hw, by); ctx.lineTo(x + lean, by - len); ctx.closePath(); ctx.fill();
      }
    }
    function loop(t) { if (!vis) { run = false; return; } if (t - last > 33) { last = t; sense(t); draw(t); } requestAnimationFrame(loop); }
    size(); draw(8000);
    W.addEventListener('resize', () => { size(); draw(performance.now()); }, { passive: true });
    if (RM) return;
    if ('IntersectionObserver' in W) new IntersectionObserver((en) => { vis = en[0].isIntersecting; if (vis && !run) { run = true; requestAnimationFrame(loop); } }, { rootMargin: '100px' }).observe(cv);
  });

  /* ---------------- reviews deck ---------------- */
  $$('[data-rdeck]').forEach((deck) => {
    const cards = $$('.rcard', deck); if (!cards.length) return; let i = 0;
    const num = $('[data-rdeck-n]', deck);
    function show(n) {
      i = (n + cards.length) % cards.length;
      cards.forEach((c, k) => { const pos = (k - i + cards.length) % cards.length; c.className = 'rcard' + (pos < 3 ? ' is-' + pos : ''); c.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true'); });
      if (num) num.textContent = String(i + 1).padStart(2, '0');
    }
    show(0);
    $('[data-rdeck-prev]', deck).addEventListener('click', () => show(i - 1));
    $('[data-rdeck-next]', deck).addEventListener('click', () => show(i + 1));
    const stack = $('.rdeck__stack', deck);
    stack.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
    let sx = null;
    stack.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    stack.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
    if (!RM) { let timer = W.setInterval(() => { if (!deck.matches(':hover') && !deck.contains(d.activeElement)) show(i + 1); }, 7000); }
  });

  /* ---------------- tiers light up one by one on hover / focus ---------------- */
  $$('[data-tiers]').forEach((t) => { $$('.tier', t).forEach((x) => { x.addEventListener('mouseenter', () => x.classList.add('is-lit')); x.addEventListener('mouseleave', () => x.classList.remove('is-lit')); }); });

  /* ---------------- the living map: pins light their store ---------------- */
  $$('[data-livemap]').forEach((m) => {
    $$('[data-map-pin]', m).forEach((p) => { const g = $('[data-map-store="' + p.getAttribute('data-map-pin') + '"]', m); p.addEventListener('mouseenter', () => g && g.classList.add('is-hot')); p.addEventListener('mouseleave', () => g && g.classList.remove('is-hot')); });
  });

  /* ---------------- hero loop: loads after the page, never under reduced motion or Save-Data ---------------- */
  const saveData = navigator.connection && navigator.connection.saveData;
  $$('video[data-src]').forEach((v) => {
    if (RM || saveData) return;
    const start = () => { if (!v.src) { v.src = (W.innerWidth < 900 && v.getAttribute('data-src-sm')) || v.getAttribute('data-src'); v.load(); } const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    v.addEventListener('playing', () => v.classList.add('is-playing'));
    const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) start(); else if (v.src) v.pause(); }), { rootMargin: '100px 0px' });
    W.addEventListener('load', () => W.setTimeout(() => io.observe(v), 600));
  });

  /* ---------------- drag to scroll (mouse) ---------------- */
  $$('[data-drag]').forEach((row) => {
    if (!FINE) return; let x0 = 0, s0 = 0, down = false, moved = false;
    row.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = row.scrollLeft; });
    W.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; row.scrollLeft = s0 - dx; });
    W.addEventListener('pointerup', () => { down = false; });
    row.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---------------- live menu: hide the loader once the menu frame is in ---------------- */
  $$('[data-menu-frame]').forEach((f) => {
    const done = () => f.classList.add('is-ready');
    if ($('iframe', f)) done();
    else new MutationObserver((m, o) => { if ($('iframe', f) || d.getElementById('dutchie--embed__iframe')) { done(); o.disconnect(); } }).observe(f, { childList: true, subtree: true });
  });
  // the menu's cart and notices lock the page (the menu sets body position:fixed); our header, bar and topbar step
  // aside while they are open so the cart's own header and checkout button are never covered
  if ($('[data-menu-frame]')) {
    const sync = () => { const locked = d.body.style.position === 'fixed'; root.classList.toggle('menu-locked', locked); if (locked) hideBar(); else evalBar(); };
    new MutationObserver(sync).observe(d.body, { attributes: true, attributeFilter: ['style'] });
  }

  /* ---------------- filters (blog, areas) ---------------- */
  $$('[data-filter-group]').forEach((g) => {
    const scope = d.getElementById(g.getAttribute('data-filter-group')); if (!scope) return;
    g.addEventListener('click', (e) => {
      const b = e.target.closest('[data-filter]'); if (!b) return; const v = b.getAttribute('data-filter');
      $$('[data-filter]', g).forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      $$('[data-tags]', scope).forEach((it) => { it.hidden = !(v === 'all' || (' ' + it.getAttribute('data-tags') + ' ').indexOf(' ' + v + ' ') >= 0); });
    });
  });

  /* ---------------- street map facade: Google Maps loads only when asked ---------------- */
  $$('[data-mapf-load]').forEach((b) => b.addEventListener('click', () => {
    const f = d.createElement('iframe'); f.src = b.getAttribute('data-mapf-load'); f.title = b.getAttribute('aria-label').replace(/^Load the /, ''); f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    b.replaceWith(f);
  }));

  /* ---------------- preview forms never post ---------------- */
  $$('[data-demo-form]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); const m = $('[data-demo-msg]', f); if (m) { m.hidden = false; m.setAttribute('role', 'status'); } toast('Preview build: this form is not connected yet'); }));
})();

;
/* aurora-gl.js */
/* aurora-gl.js: the aurora curtain over the hero (and the 21+ gate): a soft band of light flowing across the top of
   the scene in the badge's colours, its lower hem rippling, rising in on load and dipping toward the pointer.
   Original WebGL implementation, no dependencies. 2D simplex noise after Ian McEwan / Ashima Arts (MIT).
   Any <canvas data-aurora-gl data-stops="#hex,#hex,#hex" data-height=".42"> gets it. Without WebGL nothing happens (the
   page keeps its other aurora layers); under reduced motion it draws one still frame; off screen it sleeps. */
(() => {
  'use strict';
  const W = window, d = document;
  const canvases = Array.from(d.querySelectorAll('canvas[data-aurora-gl]'));
  if (!canvases.length) return;
  const RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  const FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uT;uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uP;uniform float uRev;uniform float uH;uniform float uAmp;uniform float uOp;',
    'vec3 m289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec2 m289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}vec3 prm(vec3 x){return m289(((x*34.0)+1.0)*x);}',
    'float sn(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);',
    'vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=m289(i);vec3 p=prm(prm(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));',
    'vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;',
    'm*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}',
    'vec3 ramp(float x){x=clamp(x,0.0,1.0);return x<0.5?mix(uC0,uC1,smoothstep(0.0,0.5,x)):mix(uC1,uC2,smoothstep(0.5,1.0,x));}',
    'void main(){vec2 uv=gl_FragCoord.xy/uRes;float y=1.0-uv.y;float X=uv.x*(uRes.x/uRes.y);vec3 col=vec3(0.0);',
    'for(int k=0;k<3;k++){float L=float(k);float t=uT*(1.0-L*0.17)+L*7.3;',
    'float warp=sn(vec2(X*0.45+t*0.02+L*13.7,t*0.05+L));',
    'float w=sn(vec2(X*0.8+warp*0.38-t*0.03,t*0.07+L*3.1))*0.72+sn(vec2(X*1.7+warp*0.55+t*0.04,t*0.1-L))*0.28;',
    'float hem=uH+L*0.075+w*0.14*uAmp;float dx=uv.x-uP.x;hem+=uP.z*0.1*exp(-dx*dx/0.018)*(1.0-L*0.4);hem=mix(-0.3,hem,uRev);',
    'float dd=hem-y;float body=exp(-max(dd,0.0)/(0.15+L*0.06))*step(0.0,dd);float edge=exp(-(dd*dd)/(0.0011+L*0.0009));',
    'float rays=0.58+0.42*sn(vec2(X*30.0+L*5.0+w*2.0,t*0.22+L));float I=(body*rays*0.8+edge*0.95)*(1.0-L*0.33);',
    'I*=1.0+uP.z*0.35*exp(-dx*dx/0.03);',
    'vec3 c=ramp(uv.x*0.86+0.07+0.1*sin(uT*0.06+L*1.7)+w*0.06);col+=c*I;}',
    'col*=uOp;gl_FragColor=vec4(col,1.0);}',
  ].join('\n');
  const hex = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

  canvases.forEach((cv) => {
    let gl = null;
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uT', 'uC0', 'uC1', 'uC2', 'uP', 'uRev', 'uH', 'uAmp', 'uOp'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const stops = (cv.getAttribute('data-stops') || '#55FFD6,#4089FF,#C25CFF').split(',').map(hex);
    gl.uniform3fv(U.uC0, stops[0]); gl.uniform3fv(U.uC1, stops[1] || stops[0]); gl.uniform3fv(U.uC2, stops[2] || stops[1] || stops[0]);
    gl.uniform1f(U.uH, parseFloat(cv.getAttribute('data-height')) || 0.42);
    gl.uniform1f(U.uAmp, parseFloat(cv.getAttribute('data-amplitude')) || 1);
    gl.uniform1f(U.uOp, parseFloat(cv.getAttribute('data-opacity')) || 0.95);
    cv.classList.add('is-gl');

    // soft light: draw at a fraction of the screen resolution and let the browser smooth it
    function size() { const r = cv.getBoundingClientRect(); const k = Math.min(1, W.devicePixelRatio || 1) * 0.6; cv.width = Math.max(2, Math.round(r.width * k)); cv.height = Math.max(2, Math.round(r.height * k)); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U.uRes, cv.width, cv.height); }
    const st = { t: 6 + Math.random() * 40, rev: RM ? 1 : 0, px: 0.5, tx: 0.5, reach: 0, inside: false, last: 0, vis: false, raf: 0 };
    function draw() { gl.uniform1f(U.uT, st.t); gl.uniform1f(U.uRev, 1 - Math.pow(1 - st.rev, 3)); gl.uniform3f(U.uP, st.px, 0, st.reach); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    function frame(now) {
      st.raf = 0; if (!st.vis || d.hidden) return;
      const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 1 / 60; st.last = now;
      st.t += dt * 0.55;
      if (st.rev < 1) st.rev = Math.min(1, st.rev + dt / 2.4);
      st.px += (st.tx - st.px) * (1 - Math.exp(-dt / 0.6));
      st.reach += ((st.inside ? 1 : 0) - st.reach) * (1 - Math.exp(-dt / (st.inside ? 0.9 : 1.4)));
      draw(); st.raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!st.raf && st.vis && !d.hidden && !RM) { st.last = 0; st.raf = requestAnimationFrame(frame); } };
    size(); draw();
    W.addEventListener('resize', () => { size(); draw(); }, { passive: true });
    if (RM) return;
    if (FINE) {
      W.addEventListener('pointermove', (e) => {
        const r = cv.getBoundingClientRect();
        st.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (st.inside) st.tx = (e.clientX - r.left) / r.width;
      }, { passive: true });
      d.addEventListener('pointerout', (e) => { if (!e.relatedTarget) st.inside = false; });
      W.addEventListener('blur', () => { st.inside = false; });
    }
    if ('IntersectionObserver' in W) new IntersectionObserver((en) => { st.vis = en[0].isIntersecting; wake(); }, { rootMargin: '60px' }).observe(cv);
    else { st.vis = true; wake(); }
    d.addEventListener('visibilitychange', wake);
  });
})();

;
/* reactive.js */
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

;
/* splash.js */
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
  const LIVE = 2; // the owner's pick (2026-11-16): Two Lights, for every visitor, once per session, never under reduced motion
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
  if (q === 'off') { ss.del(KEY); ss.set(SEEN, '1'); } else if (valid(q)) ss.set(KEY, q); // ?splash=off also skips the live one
  const pick = q === 'off' ? null : valid(q) ? q : valid(ss.get(KEY)) ? ss.get(KEY) : null;
  // the live splash needs sessionStorage to remember it played; without it, it never plays (never on every page)
  const remembers = (() => { try { sessionStorage.setItem('nl.t', '1'); sessionStorage.removeItem('nl.t'); return true; } catch (e) { return false; } })();
  if (pick) { switcher(+pick); play(+pick); }
  else if (LIVE && remembers && !ss.get(SEEN) && !RMQ.matches) { ss.set(SEEN, '1'); play(LIVE); }
  root.classList.remove('splash-pending');
})();

;
/* waves.js */
/* waves.js (lane W): the glowing wave across each seam where the page changes tone (and two chapter breaks on the
   home page). Original WebGL implementation, no dependencies, set up like aurora-gl.js. dividers.mjs emits, per seam,
   <div class="wv"> holding a static SVG twin (the same crest at t = 0) and a <canvas data-wave data-ph="...">.
   Here the canvas takes over: a travelling crest (a primary swell, a smaller secondary ripple and a little noise)
   drawn as a thin bright line in the aurora colours with a soft halo, the colour bands drifting and gently swirling
   along it and bending across it, a faint deep glow hanging under it and light grain inside the light. The two
   section colours (--wv-a above, --wv-b below, from dividers.css) are painted only where the crest has crossed the
   seam; everything else stays transparent, so both sections' own backgrounds meet the crest untouched. A fine pointer
   lifts the crest near it, eased in and out. Contexts are created as a wave nears the viewport; at most MAX live per
   page (the one farthest off screen hands its slot over and shows its SVG again). Off screen or in a hidden tab it
   sleeps; under reduced motion it draws one still frame (t = 0: the SVG's own curve); without WebGL the SVG stays;
   with forced colours dividers.css hides the whole band and this does nothing. */
(() => {
  'use strict';
  const W = window, d = document;
  const els = Array.from(d.querySelectorAll('.wv'));
  if (!els.length) return;
  const mq = (q) => !!(W.matchMedia && W.matchMedia(q).matches);
  if (mq('(forced-colors: active)')) return; // dividers.css hides the decoration
  const RM = mq('(prefers-reduced-motion: reduce)');
  const FINE = mq('(hover: hover) and (pointer: fine)');
  const MAX = 5; // live WebGL canvases per page (dividers.mjs MAX_LIVE)
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  // crest() must match CREST + the clamp in src/lib/dividers.mjs (the SVG twin) at uT = 0, uP = 0
  const FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes;uniform float uHc;uniform float uT;uniform vec4 uPh;uniform float uS0;uniform float uSeam;',
    'uniform vec3 uA;uniform vec3 uB;uniform vec3 uF;uniform vec2 uP;uniform vec2 uLt;uniform float uLi;',
    // the crest, in units of the band height H: swell + ripple + two short terms (noise); the pointer's eased lift
    'float crest(float x){float y=0.5+0.13*sin(x*0.8378-uT*0.29+uPh.x)+0.034*sin(x*3.307+uT*1.05+uPh.y)',
    '+0.0108*sin(x*5.7-uT*0.62+uPh.z)+0.0072*sin(x*9.3+uT*0.95+uPh.w);',
    'float q=(x-uP.x)*0.87;y+=uP.y*exp(-q*q);return clamp(y,0.2,0.8);}',
    // the badge's aurora, ping-ponged: teal, sky, blue, violet-blue, violet and back
    'vec3 aurora(float s){float u=abs(fract(s*0.5)*2.0-1.0)*4.0;',
    'vec3 c=mix(vec3(0.333,1.0,0.839),vec3(0.18,0.769,1.0),smoothstep(0.0,1.0,u));c=mix(c,vec3(0.251,0.537,1.0),smoothstep(1.0,2.0,u));',
    'c=mix(c,vec3(0.541,0.42,1.0),smoothstep(2.0,3.0,u));return mix(c,vec3(0.761,0.361,1.0),smoothstep(3.0,4.0,u));}',
    'float grain(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453)-0.5;}',
    'void main(){float H=uRes.y;vec2 fc=gl_FragCoord.xy;float x=(fc.x-0.5*uRes.x)/H;float y=1.0-fc.y/H;',
    'float e=1.5/H;float yc=crest(x);float sl=(crest(x+e)-crest(x-e))/(2.0*e);',
    'float dp=(y-yc)*uHc/sqrt(1.0+sl*sl);float px=uHc/H;', // signed distance to the crest, CSS px (+ below); one canvas px
    // the section colours, only between the seam and the crest; each overlaps the seam by ~2 px onto its own colour
    'float below=smoothstep(-0.7*px,0.7*px,dp);float ov=2.0/H;',
    'float fB=uF.x*below*(1.0-step(uSeam+ov,y));float fA=uF.x*(1.0-below)*step(uSeam-ov,y);',
    'vec3 fill=uA*fA+uB*fB;float fa=fA+fB;',
    // the light: a ~2 px core, a tight glow, a long soft halo, and the deep glow under the crest. On a dark side the
    // core runs hot (toward white) and the halo spills; on a light side (paper, white) the core keeps its colour,
    // deepened so it reads on the light band, and only a slim tint spills
    'float ad=abs(dp);float side=step(0.0,dp);float g=mix(uF.y,uF.z,side);float core=exp(-ad*ad*0.9);',
    'float lt=mix(uLt.x,uLt.y,smoothstep(-1.2,1.2,dp));',
    'float tl=mix(mix(min(12.0,0.085*uHc),min(22.0,0.14*uHc),side),4.0,lt);', // halo tail: shorter on small bands
    'float glow=(exp(-ad*ad/40.0)*0.34+exp(-ad/tl)*0.22)*g;float deep=side*exp(-dp/(0.24*uHc))*0.1*uF.z*(1.0-uLt.y);',
    'float q=(x-uP.x)*0.87;float lift=abs(uP.y)*exp(-q*q);',
    'float win=smoothstep(0.0,0.16,y)*(1.0-smoothstep(0.84,1.0,y));', // nothing reaches the band's edges
    // colour bands drift and swirl along the crest and bend across it
    'float s=x*0.11+uS0+uT*0.035+0.07*sin(x*0.7-uT*0.21+uPh.x*1.7);',
    'vec3 cl=aurora(s)*(1.0-0.3*lt);vec3 ch=aurora(s+dp*0.006)*(1.0-0.3*lt);vec3 cd=aurora(s+0.4+dp*0.012);',
    'float k=(1.0+2.2*lift)*win*uLi;vec3 L=(mix(cl,vec3(1.0),0.5*(1.0-lt)*core)*core+ch*glow+cd*deep)*k;',
    'float La=min(1.0,(core+glow+deep)*k);L*=1.0+grain(fc+fract(uT*3.1)*vec2(61.0,113.0))*0.12;L=min(L,vec3(La));',
    'gl_FragColor=vec4(L+fill*(1.0-La),La+fa*(1.0-La));}',
  ].join('\n');
  const parse = (v) => {
    v = String(v || '').trim(); let m;
    if ((m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i))) { const h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1]; const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    if ((m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i))) return [m[1] / 255, m[2] / 255, m[3] / 255];
    return null;
  };
  const waves = els.map((el) => ({ el, cv: el.querySelector('canvas[data-wave]'), gl: null, U: null, t: 0, vis: false, near: false, dead: false, px: 0, lift: 0 }));
  const byEl = new Map(waves.map((w) => [w.el, w]));
  const live = new Set();
  let noGL = false;

  function init(w) {
    const cv = w.cv; if (!cv || noGL) return false;
    let gl = null;
    try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) { noGL = true; return false; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { noGL = true; return false; }
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { noGL = true; return false; }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uHc', 'uT', 'uPh', 'uS0', 'uSeam', 'uA', 'uB', 'uF', 'uP', 'uLt', 'uLi'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const cs = getComputedStyle(w.el);
    const A = parse(cs.getPropertyValue('--wv-a')) || [7 / 255, 21 / 255, 40 / 255], B = parse(cs.getPropertyValue('--wv-b')) || A;
    const num = (n, dflt) => { const v = parseFloat(cs.getPropertyValue(n)); return isFinite(v) ? v : dflt; };
    const ph = String(cv.getAttribute('data-ph') || '').split(',').map(Number), p = (i) => (isFinite(ph[i]) ? ph[i] : 0);
    gl.uniform4f(U.uPh, p(0), p(1), p(2), p(3)); gl.uniform1f(U.uS0, p(4));
    gl.uniform3fv(U.uA, A); gl.uniform3fv(U.uB, B);
    const crestOnly = w.el.classList.contains('wv--chapter') || A.every((v, i) => Math.abs(v - B[i]) < 0.002);
    gl.uniform3f(U.uF, crestOnly ? 0 : 1, num('--wv-ga', 1), num('--wv-gb', 1));
    const light = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.5 ? 1 : 0); // paper, white
    gl.uniform2f(U.uLt, light(A), light(B));
    gl.uniform1f(U.uLi, num('--wv-light', 1)); // 0 = the section colours alone (used to verify the seams)
    cv.addEventListener('webglcontextlost', () => { if (w.cv === cv && w.gl) drop(w, false); });
    w.gl = gl; w.U = U;
    return true;
  }
  // read every rect first, then write (no layout thrash): backing size (DPR capped at 1.5) and where the seam falls
  function measure(w) {
    const r = w.el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    let k = Math.min(1.5, W.devicePixelRatio || 1);
    if (r.width * k > 2600) k = 2600 / r.width;
    // a top / bot band sits inside its section (the seam is that section's top / bottom edge); a mid band sits in
    // front of the lower section (the seam is where that section starts)
    const cl = w.el.classList, host = w.el.parentElement;
    let y = null;
    if (cl.contains('wv--top') && host) y = host.getBoundingClientRect().top;
    else if (cl.contains('wv--bot') && host) y = host.getBoundingClientRect().bottom;
    else { let n = w.el.nextElementSibling; while (n && !/^(SECTION|FOOTER)$/.test(n.tagName)) n = n.nextElementSibling; if (n) y = n.getBoundingClientRect().top; }
    const seam = y === null ? 0.5 : Math.max(0, Math.min(1, (y - r.top) / r.height));
    return { cw: Math.max(2, Math.round(r.width * k)), ch: Math.max(2, Math.round(r.height * k)), hc: r.height, seam };
  }
  function apply(w, m) {
    const gl = w.gl, U = w.U;
    if (w.cv.width !== m.cw) w.cv.width = m.cw;
    if (w.cv.height !== m.ch) w.cv.height = m.ch;
    gl.viewport(0, 0, m.cw, m.ch);
    gl.uniform2f(U.uRes, m.cw, m.ch); gl.uniform1f(U.uHc, m.hc); gl.uniform1f(U.uSeam, m.seam);
  }
  function draw(w) { const gl = w.gl, U = w.U; gl.uniform1f(U.uT, w.t); gl.uniform2f(U.uP, w.px, w.lift); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  // give the canvas back to its SVG twin (a fresh canvas element, so the wave can come alive again later)
  function drop(w, lose) {
    const gl = w.gl, old = w.cv, fresh = old.cloneNode(false);
    live.delete(w); w.gl = null; w.U = null;
    w.el.classList.remove('is-gl');
    w.cv = fresh; old.replaceWith(fresh);
    if (lose && gl) { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
  }
  function acquire(w) {
    if (w.gl || w.dead || noGL) return;
    if (live.size >= MAX) {
      let far = null, fd = -Infinity;
      for (const o of live) {
        if (o.near || o.vis) continue;
        const r = o.el.getBoundingClientRect(), dist = Math.max(-r.bottom, r.top - W.innerHeight);
        if (dist > fd) { fd = dist; far = o; }
      }
      if (!far) return; // every live wave is on or near the screen: this one keeps its static SVG
      drop(far, true);
    }
    if (!init(w)) { w.dead = true; return; }
    const m = measure(w); if (m) apply(w, m);
    live.add(w); draw(w);
    w.el.classList.add('is-gl');
    wake();
  }

  // the pointer: the crest lifts near it (always up, more as the pointer rises above it), eased in and out
  let mx = -1e5, my = -1e5;
  function steer(w, dt) {
    const r = w.el.getBoundingClientRect(), h = r.height || 1;
    const vy = (my - r.top) / h, out = Math.max(0, -vy, vy - 1);
    const reach = mx >= r.left && mx <= r.right ? Math.max(0, 1 - out / 0.9) : 0; // within ~0.9 H above or below
    const near = reach * reach * (3 - 2 * reach);
    const target = -near * (0.06 + 0.1 * Math.min(1, Math.max(0, (0.6 - vy) / 1.1)));
    if (near > 0.001) { const tx = (mx - r.left - r.width / 2) / h; w.px = Math.abs(w.lift) < 0.004 ? tx : w.px + (tx - w.px) * (1 - Math.exp(-dt / 0.22)); }
    w.lift += (target - w.lift) * (1 - Math.exp(-dt / (Math.abs(target) > Math.abs(w.lift) ? 0.32 : 0.75)));
  }

  // one loop for every wave on screen
  let raf = 0, last = 0;
  function frame(now) {
    raf = 0;
    if (d.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    let on = 0;
    for (const w of live) {
      if (!w.vis) continue;
      on++; w.t += dt;
      if (FINE) steer(w, dt);
      draw(w);
    }
    if (on) raf = requestAnimationFrame(frame); else last = 0;
  }
  function wake() {
    if (raf || RM || d.hidden) return;
    for (const w of live) if (w.vis) { last = 0; raf = requestAnimationFrame(frame); return; }
  }

  if (FINE && !RM) {
    W.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') { mx = e.clientX; my = e.clientY; } }, { passive: true });
    d.addEventListener('pointerout', (e) => { if (!e.relatedTarget) { mx = -1e5; my = -1e5; } });
    W.addEventListener('blur', () => { mx = -1e5; my = -1e5; });
  }
  // after every batch of observer news (all flags first, so a wave that just left frees its slot): bring the waves on
  // screen to life, then the ones about to arrive
  const fill = () => { for (const w of waves) if (w.vis && !w.gl) acquire(w); for (const w of waves) if (w.near && !w.gl) acquire(w); };
  if ('IntersectionObserver' in W) {
    const io = new IntersectionObserver((en) => { for (const e of en) { const w = byEl.get(e.target); if (w) w.vis = e.isIntersecting; } fill(); wake(); }, { rootMargin: '40px 0px' });
    const pre = new IntersectionObserver((en) => { for (const e of en) { const w = byEl.get(e.target); if (w) w.near = e.isIntersecting; } fill(); }, { rootMargin: '100% 0px' });
    waves.forEach((w) => { io.observe(w.el); pre.observe(w.el); });
  } else {
    waves.slice(0, MAX).forEach((w) => { w.vis = w.near = true; acquire(w); });
  }
  const resize = (list) => { const ms = list.map(measure); list.forEach((w, i) => { if (ms[i]) { apply(w, ms[i]); draw(w); } }); };
  if ('ResizeObserver' in W) {
    const ro = new ResizeObserver((en) => resize(en.map((e) => byEl.get(e.target)).filter((w) => w && w.gl)));
    waves.forEach((w) => ro.observe(w.el));
  } else {
    let rz = 0;
    W.addEventListener('resize', () => { if (!rz) rz = requestAnimationFrame(() => { rz = 0; resize([...live]); }); }, { passive: true });
  }
  d.addEventListener('visibilitychange', wake);
})();
