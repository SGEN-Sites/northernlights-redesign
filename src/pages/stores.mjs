// stores.mjs: the locations hub, a page per store (Whitehall first), same-day delivery, and the areas we serve
// (a hub + one page per nearby town, the local-search pages of the adopted IA). Copy: src/content/places.mjs.
import { esc, href, img, icon, inline, attrs } from '../lib/html.mjs';
import { pageHero, blocks, faqList, ctaRow, catGrid, kicker, dh, postcard, light, statusSpan, storeStrip, btn, floatObj } from '../lib/parts.mjs';
import { storeLd, storeCard } from '../lib/layout.mjs';
import { livingMap } from '../lib/map.mjs';
import { brand, stores, storeCats, storeById, DEFAULT_STORE } from '../content/site.mjs';
import * as P from '../content/places.mjs';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmt = (h) => (h % 12 || 12) + (h >= 12 ? 'pm' : 'am');
const hoursTable = (s) => `<table class="hours"><caption class="sr-only">In-store hours, ${esc(s.city)}</caption><tbody>${DAYS.map((d, i) => `<tr data-day="${i}"><th scope="row">${d}</th><td>${fmt(s.hours[i][0])}–${fmt(s.hours[i][1])}</td></tr>`).join('')}</tbody></table>`;
const mapFacade = (s) => `<div class="mapf" data-mapf>
  <button class="mapf__btn" type="button" data-mapf-load="${esc(s.mapEmbed)}" aria-label="Load the Google map for ${esc(s.street)}, ${esc(s.city)}">${livingMap({ id: 'mf-' + s.id, compact: true, labels: false })}<span class="mapf__cta">${icon('pin')}Show the street map <small>(loads Google Maps)</small></span></button>
</div>`;

function storePage(s) {
  const c = P.storePages[s.id];
  const other = stores.find((x) => x.id !== s.id);
  return {
    path: s.page, type: 'store', store: s.id,
    title: c.title, description: c.description,
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Locations', href: '/locations/' }, { label: `${s.city}, ${s.region}`, href: s.page }],
    jsonld: [storeLd(s)],
    main: `<section class="shero shero--${s.id}" data-store-hero>
  <div class="shero__bg" aria-hidden="true">${img(s.id === 'whitehall' ? 'canal-golden' : 'city-river', { decorative: true, sizes: '100vw', eager: true, min: 1600, depth: '0.08' })}<canvas class="aurora-canvas" data-aurora="soft"></canvas><div class="shero__scrim"></div></div>
  <div class="wrap shero__in">
    <div class="shero__copy">
      <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="${href('/')}">Home</a></li><li><a href="${href('/locations/')}">Locations</a></li><li><span aria-current="page">${esc(s.city)}, ${esc(s.region)}</span></li></ol></nav>
      ${kicker(c.kicker || `No. ${s.n} · ${s.city}`)}
      <h1 class="dh dh--xl">${esc(c.h1)}</h1>
      <p class="phero__lede">${inline(c.lede)}</p>
      <div class="ctarow"><a class="btn btn--teal btn--lg" href="${href(s.menuPage)}">Shop ${esc(s.city)}${icon('bag')}</a><a class="btn btn--ghost btn--lg" href="${esc(s.directions)}" target="_blank" rel="noopener">Directions${icon('route')}</a></div>
    </div>
    <aside class="shero__card glass" data-store-card="${s.id}">
      <div class="shero__photo">${img(s.photo, { sizes: '(max-width: 900px) 80vw, 360px', min: 900, eager: true })}</div>
      <div class="shero__info">
        <p class="shero__name">${light(s)}${esc(s.name)}</p>
        ${statusSpan(s)}
        <p class="shero__addr">${esc(s.street)}<br>${esc(s.city)}, ${esc(s.region)} ${esc(s.zip)}</p>
        <p class="shero__links"><a href="tel:${s.tel}">${icon('phone')}${esc(s.phone)}</a><a href="mailto:${brand.email}">${icon('mail')}Email us</a></p>
        <button class="btn btn--ghost btn--sm shero__mine" type="button" data-set-store="${s.id}"><span class="pick__off">Make ${esc(s.city)} my store</span><span class="pick__on">${icon('check')}Your store</span></button>
      </div>
    </aside>
  </div>
</section>
<section class="band band--tight">
  <div class="wrap">
    <ul class="ways">${c.ways.map((w, i) => `<li class="way glass" style="--i:${i}" data-reveal><span class="way__ic">${icon(['bag', 'truck', 'pin', 'clock'][i] || 'spark')}</span><h2 class="way__t">${inline(w.title)}</h2><p>${inline(w.text)}</p></li>`).join('')}</ul>
  </div>
</section>
<section class="band band--tight sinfo">
  <div class="wrap sinfo__grid">
    <div class="prose" data-reveal>${blocks(c.intro)}${blocks(c.inside)}</div>
    <aside class="sinfo__side" data-reveal="right">
      <div class="sinfo__box glass"><h2 class="sinfo__h">${icon('clock')}Hours</h2>${hoursTable(s)}<p class="sinfo__note">Same-day delivery ${esc(s.delivery)}${s.curbside ? ` · Curbside ${esc(s.curbside)}` : ''}</p></div>
      <div class="sinfo__box glass"><h2 class="sinfo__h">${icon('cash')}Payment</h2><p>${s.payment.map(esc).join(' · ')}</p></div>
      ${s.id === 'whitehall' ? postcard('store-whitehall', '132 Broadway, Whitehall', 'sinfo__card') : postcard('store-menands', '100 Broadway, Menands', 'sinfo__card')}
    </aside>
  </div>
</section>
<section class="band band--night-2 band--tight">
  <div class="wrap">
    <div class="band__head band__head--split" data-reveal><div>${kicker(`Shop ${s.city} by category`)}${dh(`Straight to the *shelf.*`, 'dh--md')}</div><p>Each tile opens the ${esc(s.city)} live menu on that category, with a cart.</p></div>
    ${catGrid({ ids: storeCats[s.id], store: s.id })}
  </div>
</section>
<section class="band band--tight getting">
  <div class="wrap getting__grid">
    <div class="prose" data-reveal>${blocks(c.gettingHere)}<div class="ctarow"><a class="btn btn--teal" href="${esc(s.directions)}" target="_blank" rel="noopener">Get directions${icon('route')}</a></div></div>
    <div data-reveal="right">${mapFacade(s)}</div>
  </div>
</section>
<section class="band band--paper band--tight">
  <div class="wrap faqwrap">
    <div class="band__head" data-reveal>${kicker(`${s.city} questions`)}${dh(`Before you *head over.*`, 'dh--md')}</div>
    ${faqList(c.faq, 1)}
  </div>
</section>
<section class="band band--tight sseo">
  <div class="wrap sseo__grid">
    <div class="prose" data-reveal>${blocks(c.seo.map ? c.seo.map((t) => (typeof t === 'string' ? { t: 'p', text: t } : t)) : [])}</div>
    <a class="sseo__other" href="${href(other.page)}" data-reveal="right">${light(other)}<span><small>Our other store</small><b>${esc(other.city)}, ${esc(other.region)}</b><span>${esc(other.street)} · ${esc(other.tagline)}</span></span>${icon('arrow')}</a>
  </div>
</section>`,
  };
}

function hub() {
  const c = P.locationsHub;
  return {
    path: '/locations/', type: 'locations', title: c.title, description: c.description,
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Locations', href: '/locations/' }],
    jsonld: stores.map(storeLd),
    main: pageHero({ kicker: c.kicker, h1: c.h1, lede: c.lede, image: 'lake-dawn', crumbs: [{ label: 'Home', href: '/' }, { label: 'Locations', href: '/locations/' }], variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap lochub">
    <div class="lochub__stores">${stores.map((s) => storeCard(s)).join('')}<a class="lochub__dl" href="${href('/delivery/')}">${icon('truck')}<span><b>Same-day delivery from both stores</b><small>Free, 11am–7pm</small></span>${icon('arrow')}</a></div>
    <div class="lochub__map" data-reveal="zoom">${livingMap({ id: 'loc' })}</div>
  </div>
</section>
<section class="band band--night-2 band--tight">
  <div class="wrap"><div class="prose prose--wide" data-reveal>${blocks(c.blocks)}</div></div>
</section>`,
  };
}

function delivery() {
  const c = P.delivery;
  return {
    path: '/delivery/', type: 'delivery', title: c.title, description: c.description,
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Same-day delivery', href: '/delivery/' }],
    main: pageHero({ kicker: c.kicker, h1: c.h1, lede: c.lede, image: 'delivery-road', crumbs: [{ label: 'Home', href: '/' }, { label: 'Same-day delivery', href: '/delivery/' }], cta: `<div class="ctarow">${stores.map((s, i) => `<a class="btn ${i ? 'btn--ghost' : 'btn--teal'} btn--lg" href="${href(s.menuPage)}">Order from ${esc(s.city)}${icon('bag')}</a>`).join('')}</div>` }) + `
<section class="band band--tight">
  <div class="wrap twocol">
    <div class="prose" data-reveal>${blocks(c.blocks)}</div>
    <aside class="dl__side" data-reveal="right">${stores.map((s) => `<div class="dl__store glass">${light(s)}<div><p class="dl__name">${esc(s.city)}, ${esc(s.region)}</p><p class="dl__hrs">Delivery ${esc(s.delivery)} · free</p><a href="${href(s.menuPage)}">Order on the ${esc(s.city)} menu${icon('arrow')}</a></div></div>`).join('')}</aside>
  </div>
</section>`,
  };
}

function areasHub() {
  const c = P.areas.hub;
  const by = (sid) => P.areas.towns.filter((t) => t.store === sid);
  return {
    path: '/dispensary-near/', type: 'areas', title: c.title, description: c.description,
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Areas we serve', href: '/dispensary-near/' }],
    main: pageHero({ kicker: c.kicker, h1: c.h1, lede: c.lede, image: 'canal-golden', crumbs: [{ label: 'Home', href: '/' }, { label: 'Areas we serve', href: '/dispensary-near/' }], variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap areas">
    <div class="areas__lists">${stores.map((s) => `<div class="areas__grp" data-reveal><h2 class="areas__h">${light(s)}Near our ${esc(s.city)} store</h2><ul class="areas__ul">${by(s.id).map((t) => `<li><a href="${href(t.slug)}"><b>${esc(t.town)}</b><small>${esc(t.state)}</small>${icon('arrow')}</a></li>`).join('')}</ul></div>`).join('')}</div>
    <div class="areas__map" data-reveal="zoom">${livingMap({ id: 'areas' })}</div>
  </div>
</section>
${c.blocks && c.blocks.length ? `<section class="band band--night-2 band--tight"><div class="wrap"><div class="prose prose--wide" data-reveal>${blocks(c.blocks)}</div></div></section>` : ''}`,
  };
}

function town(t) {
  const s = storeById(t.store);
  return {
    path: t.slug, type: 'area', store: s.id, title: t.title, description: t.description,
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Areas we serve', href: '/dispensary-near/' }, { label: `${t.town}, ${t.state}`, href: t.slug }],
    main: pageHero({ kicker: t.kicker, h1: t.h1, lede: t.lede, image: s.id === 'whitehall' ? (t.state === 'VT' ? 'lake-dawn' : 'canal-golden') : 'city-river', crumbs: [{ label: 'Home', href: '/' }, { label: 'Areas we serve', href: '/dispensary-near/' }, { label: `${t.town}, ${t.state}`, href: t.slug }], variant: 'phero--short', cta: `<div class="ctarow"><a class="btn btn--teal btn--lg" href="${href(s.menuPage)}">Shop ${esc(s.city)}${icon('bag')}</a><a class="btn btn--ghost btn--lg" href="${href(s.page)}">The ${esc(s.city)} store${icon('arrow')}</a></div>` }) + `
<section class="band band--tight">
  <div class="wrap twocol">
    <div class="prose" data-reveal>${blocks(t.blocks)}</div>
    <aside class="town__side" data-reveal="right">
      ${storeCard(s)}
      <div class="town__map">${livingMap({ id: 'town-' + t.slug.replace(/\W+/g, ''), compact: true })}</div>
    </aside>
  </div>
</section>`,
  };
}

export function pages() {
  return [hub(), ...stores.map(storePage), delivery(), areasHub(), ...P.areas.towns.map(town)];
}
