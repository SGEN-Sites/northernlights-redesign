// parts.mjs: shared section components. Class names are prefixed by component; behaviour hooks are data-* attributes
// read by src/scripts/site.js; everything renders complete without JS.
import { esc, attrs, href, asset, img, imgInfo, icon, inline, catLink, storeLink, brandImg } from './html.mjs';
import { brand, stores, categories, storeCats, sharedCats, DEFAULT_STORE, catById, catPath, loyalty, reviews, storeById } from '../content/site.mjs';
import { light, statusSpan } from './layout.mjs';
import { livingMap } from './map.mjs';

// ---------- type ----------
// a display heading with one accent word: "Lights on *Broadway.*" -> the starred part is the accent
export const dh = (text, cls = 'dh--lg', tag = 'h2', id = '') => `<${tag} class="dh ${cls}"${id ? ` id="${id}"` : ''}>${esc(text).replace(/\*([^*]+)\*/g, '<em>$1</em>')}</${tag}>`;
export const kicker = (t) => `<p class="kicker">${esc(t)}</p>`;

// ---------- buttons ----------
export const btn = (label, to, cls = 'btn--teal', ic = 'arrow') => `<a class="btn ${cls}" href="${href(to)}"${/^https?:/.test(to) ? ' target="_blank" rel="noopener"' : ''}>${esc(label)}${icon(/^https?:/.test(to) ? 'arrow-ne' : ic)}</a>`;

// ---------- content blocks (src/content/*.mjs) ----------
export function blocks(list = []) {
  return list.map((b) => {
    switch (b.t) {
      case 'h2': return `<h2 class="prose__h2">${inline(b.text)}</h2>`;
      case 'h3': return `<h3 class="prose__h3">${inline(b.text)}</h3>`;
      case 'p': return `<p>${inline(b.text)}</p>`;
      case 'ul': return `<ul class="prose__list">${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol class="prose__list prose__list--ol">${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`;
      case 'faq': return faqList(b.items);
      case 'callout': return `<aside class="callout glass">${icon('spark')}<div><p class="callout__t">${inline(b.title)}</p><p>${inline(b.text)}</p></div></aside>`;
      case 'cta': return ctaRow(b.items);
      default: return '';
    }
  }).join('\n');
}
export const ctaRow = (items = []) => `<div class="ctarow">${items.map((c, i) => `<a class="btn ${i === 0 ? 'btn--teal' : 'btn--ghost'}" href="${href(c.href)}"${/^https?:/.test(c.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(c.label)}${icon(/^https?:/.test(c.href) ? 'arrow-ne' : /^\/(whitehall|menands)\//.test(c.href) ? 'bag' : 'arrow')}</a>`).join('')}</div>`;
export const faqList = (items = [], open = 0) => `<div class="faq">${items.map((f, i) => `<details class="faq__item"${i < open ? ' open' : ''}><summary><span>${inline(f.q)}</span>${icon('plus')}</summary><div class="faq__a"><p>${inline(f.a)}</p></div></details>`).join('')}</div>`;

// ---------- the page hero for inner pages: a cinematic still, scrims, the aurora over it, a crumb trail ----------
export function pageHero({ kicker: k, h1, lede, image = 'hero-aurora', crumbs = [], cta = '', aside = '', variant = '', aurora = true }) {
  return `<section class="phero ${variant}" data-phero>
  <div class="phero__bg" aria-hidden="true">${img(image, { decorative: true, sizes: '100vw', eager: true, min: 1400, depth: '0.08' })}${aurora ? '<canvas class="phero__gl" data-aurora-gl data-stops="#55FFD6,#4089FF,#C25CFF" data-height=".34" data-opacity=".85" aria-hidden="true"></canvas><canvas class="aurora-canvas" data-aurora="soft"></canvas>' : ''}<div class="phero__scrim"></div></div>
  <div class="wrap phero__in">
    ${crumbs.length > 1 ? `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs.map((c, i) => `<li>${i < crumbs.length - 1 ? `<a href="${href(c.href)}">${esc(c.label)}</a>` : `<span aria-current="page">${esc(c.label)}</span>`}</li>`).join('')}</ol></nav>` : ''}
    <div class="phero__copy">
      ${k ? kicker(k) : ''}
      <h1 class="dh dh--xl phero__h1">${esc(h1).replace(/\*([^*]+)\*/g, '<em>$1</em>')}</h1>
      ${lede ? `<p class="phero__lede">${inline(lede)}</p>` : ''}
      ${cta}
    </div>
    ${aside}
  </div>
</section>`;
}

// ---------- the 3D aurora badge coin (the client's round badge on one face, the NL monogram on the other) ----------
export const coin = (cls = '') => `<div class="coin ${cls}" data-coin aria-hidden="true"><div class="coin__body"><div class="coin__face coin__face--front">${brandImg('badge')}</div><div class="coin__edge"></div><div class="coin__face coin__face--back">${brandImg('monogram')}</div></div><div class="coin__shadow"></div></div>`;

// ---------- category tiles: product cut-outs standing out of the card, store-aware links ----------
export function catGrid({ ids = sharedCats, store = null, cls = '' } = {}) {
  return `<ul class="cats cats--n${ids.length} ${cls}" data-cats>${ids.map((id, i) => {
    const c = catById(id);
    const inner = `<span class="cat__glow" aria-hidden="true"></span><span class="cat__obj">${img(c.obj, { decorative: true, sizes: '(max-width: 760px) 40vw, 220px', min: 300 })}</span><span class="cat__txt"><b>${esc(c.label)}</b><small>${esc(c.line)}</small></span><span class="cat__go" aria-hidden="true">${icon('arrow')}</span>`;
    return `<li class="cat" style="--i:${i}" data-tilt>${catLink(id, inner, { cls: 'cat__a', store, aria: store ? `Shop ${c.label.toLowerCase()} at ${storeById(store).city}` : null })}</li>`;
  }).join('')}</ul>`;
}

// ---------- the live menu embed (each store's own online menu, opened on a category / specials / brands) ----------
// The inline script writes the deep link into the page URL BEFORE the async embed script runs (the embed reads
// dtche[...] from the parent page URL on load), unless the visitor already has one in the URL.
export function menuEmbed({ store, category = null, path = null, label = 'All products' }) {
  const s = storeById(store);
  const key = category ? 'dtche[category]' : path ? 'dtche[path]' : null;
  const val = category || path;
  const deep = key ? `<script>(function(){try{var p=new URLSearchParams(location.search);if(!p.has('dtche[category]')&&!p.has('dtche[path]')&&!p.has('dtche[product]')&&!p.has('dtche[brands]')){p.set(${JSON.stringify(key)},${JSON.stringify(val)});history.replaceState(history.state,'',location.pathname+'?'+p.toString()+location.hash);}}catch(e){}})();</script>` : '';
  return `<section class="menu" aria-label="Live menu, ${esc(s.city)}: ${esc(label)}">
  <div class="wrap-wide menu__wrap">
    <div class="menu__frame" data-menu-frame>
      <div class="menu__loading" data-menu-loading><span class="menu__spin" aria-hidden="true"></span><span>Loading the ${esc(s.city)} menu…</span></div>
      ${deep}
      <script async id="dutchie--embed__script" src="${esc(s.script)}"></script>
    </div>
    <noscript><p class="menu__noscript">The live menu needs JavaScript. Call <a href="tel:${s.tel}">${esc(s.phone)}</a> and we’ll help you over the phone.</p></noscript>
  </div>
</section>`;
}

// the slim store bar above a live menu: which store, today, the other store, the store's shelves
export function menuHead({ store, current = null, title, intro = '' }) {
  const s = storeById(store), other = stores.find((x) => x.id !== store);
  const otherHref = current && storeCats[other.id].includes(current) ? `/${other.id}/${current}/` : current === 'specials' ? `/${other.id}/specials/` : other.menuPage;
  const chips = [['', 'All'], ...storeCats[store].map((c) => [c, catById(c).label]), ['specials', 'Specials']];
  return `<section class="mhead" data-page-store="${s.id}">
  <div class="mhead__sky" aria-hidden="true"><canvas class="mhead__gl" data-aurora-gl data-stops="#55FFD6,#4089FF,#C25CFF" data-height=".3" data-opacity=".55" aria-hidden="true"></canvas><canvas class="aurora-canvas" data-aurora="soft"></canvas></div>
  <div class="wrap-wide mhead__in">
    <div class="mhead__top">
      <div class="mhead__id">${light(s)}<div><p class="kicker">Shopping at Northern Lights ${esc(s.city)}</p><h1 class="dh dh--md mhead__h1">${esc(title)}</h1></div></div>
      <div class="mhead__meta">
        ${statusSpan(s)}
        <a href="tel:${s.tel}">${icon('phone')}${esc(s.phone)}</a>
        <a href="${esc(s.directions)}" target="_blank" rel="noopener">${icon('route')}${esc(s.street)}, ${esc(s.city)}</a>
        <a class="mhead__switch" href="${href(otherHref)}" data-switch-to="${other.id}">${icon('arrow-l')}Switch to ${esc(other.city)}</a>
      </div>
    </div>
    ${intro ? `<p class="mhead__intro">${inline(intro)}</p>` : ''}
    <nav class="mhead__chips" aria-label="${esc(s.city)} menu shelves"><ul class="chips" data-drag>${chips.map(([id, l]) => {
      const to = id === '' ? s.menuPage : `/${s.id}/${id}/`;
      const on = (current || '') === id;
      return `<li><a class="chip2${on ? ' is-on' : ''}" href="${href(to)}"${on ? ' aria-current="page"' : ''}>${esc(l)}</a></li>`;
    }).join('')}</ul></nav>
  </div>
</section>`;
}

// ---------- reviews: the six Google reviews the client republished, as captured ----------
export function reviewDeck({ ids = null, cls = '' } = {}) {
  const list = ids ? reviews.filter((r) => ids.includes(r.id)) : reviews;
  return `<div class="rdeck ${cls}" data-rdeck>
  <div class="rdeck__stack" tabindex="0" aria-label="Customer reviews, use the arrow keys to move through them">${list.map((r, i) => `<figure class="rcard" id="review-${r.id}" style="--k:${i}">
    <div class="rcard__stars" aria-label="Google review">${'★'.repeat(5)}<span>Google review</span></div>
    <blockquote><p>${esc(r.text)}</p></blockquote>
    <figcaption><span class="rcard__av" aria-hidden="true">${esc(r.name[0])}</span><b>${esc(r.name)}</b><small>as published on our site</small></figcaption>
  </figure>`).join('')}</div>
  <div class="rdeck__ctrl"><button class="rbtn" type="button" data-rdeck-prev aria-label="Previous review">${icon('arrow-l')}</button><span class="rdeck__n"><b data-rdeck-n>01</b> / ${String(list.length).padStart(2, '0')}</span><button class="rbtn" type="button" data-rdeck-next aria-label="Next review">${icon('arrow')}</button></div>
</div>`;
}

// ---------- loyalty tiers: the program's four tiers as rising aurora rays ----------
export function tiers({ cls = '' } = {}) {
  return `<ol class="tiers ${cls}" data-tiers>${loyalty.tiers.map((t, i) => `<li class="tier tier--${i}" style="--i:${i}" tabindex="0">
    <div class="tier__rays" aria-hidden="true">${Array.from({ length: t.rays }, (_, k) => `<i style="--k:${k};--n:${t.rays}"></i>`).join('')}</div>
    <h3 class="tier__name">${esc(t.name)}</h3>
    <p class="tier__spend"><small>Annual spend</small>${esc(t.spend)}</p>
    <p class="tier__earn"><b>${esc(t.earn)}</b> ${t.earn === '1' ? 'point' : 'points'} per $1</p>
    ${t.bonus ? `<p class="tier__bonus">${icon('star')}${esc(t.bonus)}-point tier bonus</p>` : '<p class="tier__bonus tier__bonus--start">Where everyone begins</p>'}
  </li>`).join('')}</ol>`;
}

// ---------- the four seasons strip ----------
export function seasons(items) {
  return `<div class="seasons" data-seasons><ul class="seasons__row" data-drag>${items.map((s, i) => `<li class="season season--${s.id}" style="--i:${i}">
    <div class="season__img">${img(s.img, { decorative: true, sizes: '(max-width: 760px) 78vw, 320px', min: 700 })}</div>
    <div class="season__txt"><p class="season__k">${icon(s.icon)}${esc(s.name)}</p><p class="season__line">${esc(s.line)}</p></div>
  </li>`).join('')}</ul></div>`;
}

// float an object cut-out across a seam or a frame edge
export const floatObj = (id, cls, depth = '0.1') => `<div class="float ${cls}" data-depth="${depth}" aria-hidden="true">${img(id, { decorative: true, sizes: '320px', min: 520 })}</div>`;

// a two-store strip (store cards), Whitehall first
export const storeStrip = () => `<div class="sstrip">${stores.map((s) => `<a class="sstrip__a${s.id === DEFAULT_STORE ? ' is-lead' : ''}" href="${href(s.page)}">${light(s)}<span><b>${esc(s.city)}, ${esc(s.region)}</b><small>${esc(s.street)} · ${esc(s.tagline)}</small></span>${statusSpan(s)}${icon('arrow')}</a>`).join('')}</div>`;

export { light, statusSpan };

// ---------- the store switcher (owner, round 5): the mini map picks the store and sets it as the visitor's store; the
// chosen store's storefront fills a tall frame beside its details. Both panels are in the page (no-JS, crawlers);
// html[data-store] (set before first paint, then by site.js) shows one. ----------
const hr12 = (h) => (h % 12 || 12) + (h >= 12 ? 'pm' : 'am');
const dailyHours = (s) => (s.hours.every((h) => h[0] === s.hours[0][0] && h[1] === s.hours[0][1]) ? `Open every day, ${hr12(s.hours[0][0])}–${hr12(s.hours[0][1])}` : '');
export function storeSwitch({ id = 'sw', h = 'h3' } = {}) {
  const tab = (s) => `<button class="sw__tab sw__tab--${s.id}" type="button" data-set-store="${s.id}" data-seg="${s.id}" aria-pressed="${s.id === DEFAULT_STORE}">${light(s)}<span><small>No. ${s.n}</small><b>${esc(s.city)}</b></span></button>`;
  const panel = (s) => `<article class="sw__panel sw__panel--${s.id}" data-store-card="${s.id}" aria-label="Northern Lights ${esc(s.city)}">
      <div class="sw__photo">${img(s.photo, { sizes: '(max-width: 640px) 92vw, (max-width: 1100px) 44vw, 470px', min: 1200 })}<span class="sp__badge">${light(s)}No. ${s.n}${s.id === DEFAULT_STORE ? ' · First stop' : ''}</span></div>
      <div class="sw__body">
        <p class="sw__k">${esc(s.tagline)}</p>
        <${h} class="sw__name">${esc(s.city)}<span>, ${esc(s.region)}</span></${h}>
        ${statusSpan(s)}
        <p class="sw__addr">${esc(s.street)}, ${esc(s.city)}, ${esc(s.region)} ${esc(s.zip)}</p>
        <ul class="sw__facts">${dailyHours(s) ? `<li>${icon('clock')}${dailyHours(s)}</li>` : ''}<li>${icon('truck')}Free same-day delivery, ${esc(s.delivery)}</li>${s.curbside ? `<li>${icon('bag')}Curbside pickup, ${esc(s.curbside)}</li>` : ''}<li>${icon('cash')}${esc(s.payment.join(' · '))}</li></ul>
        <p class="sw__links"><a href="tel:${s.tel}">${icon('phone')}${esc(s.phone)}</a><a href="${esc(s.directions)}" target="_blank" rel="noopener">${icon('route')}Directions</a></p>
        <div class="sw__cta"><a class="btn btn--teal" href="${href(s.menuPage)}">Shop ${esc(s.city)}${icon('bag')}</a><a class="btn btn--ghost" href="${href(s.page)}">Store details</a></div>
        <p class="sw__mine">${icon('check')}${esc(s.city)} is your store</p>
      </div>
    </article>`;
  return `<div class="sw" data-switcher>
  <div class="sw__nav" data-reveal>
    <div class="sw__tabs" role="group" aria-label="Choose your store">${stores.map(tab).join('')}</div>
    <div class="sw__map">${livingMap({ id, compact: true, switcher: true })}</div>
    <p class="sw__hint">${icon('pin')}Tap a light on the map to switch stores</p>
  </div>
  <div class="sw__stage" data-reveal="right">${stores.map(panel).join('')}</div>
</div>`;
}
