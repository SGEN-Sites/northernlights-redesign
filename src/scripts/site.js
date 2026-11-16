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
