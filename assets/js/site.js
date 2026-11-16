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
        } else if (n.nodeType === 1) walk(n);
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
/* hero-options.js */
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
    nav.innerHTML = '<a class="hxs__all" href="' + base + 'hero-options/"><svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg><span>Hero options</span></a><ol class="hxs__list" id="hxs-list">'
      + opts.map(([k, name, to]) => '<li><a class="hxs__o' + (k === 'A' ? ' is-on' : '') + '" href="' + base + to + '" title="' + k + ': ' + name + '"' + (k === 'A' ? ' aria-current="page"' : '') + '><span aria-hidden="true">' + k + '</span><span class="sr-only">Option ' + k + ', ' + name + '</span></a></li>').join('')
      + '</ol><button class="hxs__tog" type="button" aria-expanded="false" aria-controls="hxs-list"><span aria-hidden="true">A</span><span class="sr-only">Hero options, showing option A</span></button>';
    (d.querySelector('main') || d.body).appendChild(nav);
  }
  /* ---------------- phones: the switcher folds into one toggle (the current letter) that opens the list ---------------- */
  const sw = d.querySelector('[data-hxs]');
  if (sw) {
    const tog = sw.querySelector('.hxs__tog'), narrow = W.matchMedia('(max-width: 560px)');
    const open = (on) => { sw.classList.toggle('is-open', on); if (tog) tog.setAttribute('aria-expanded', on ? 'true' : 'false'); };
    const fold = () => { sw.classList.toggle('is-compact', !!(tog && narrow.matches)); if (!narrow.matches) open(false); };
    if (tog) tog.addEventListener('click', () => open(!sw.classList.contains('is-open')));
    d.addEventListener('click', (e) => { if (sw.classList.contains('is-open') && !sw.contains(e.target)) open(false); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sw.classList.contains('is-open')) { open(false); if (tog) tog.focus(); } });
    fold();
    if (narrow.addEventListener) narrow.addEventListener('change', fold);
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
   sleeps; under reduced motion it draws one still frame (t = 0: the SVG's own curve); with forced colours, or without
   WebGL, the SVG stays. */
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
