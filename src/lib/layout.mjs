// layout.mjs: the page shell every template renders into: head (SEO, share cards, JSON-LD), the 21+ gate (age, then
// store, Whitehall first), the utility line, the glass header with mega menus and the store chip, the phone drawer,
// the footer (the living map, both stores, licences, the state warning), the store switcher and the sticky store bar.
import { esc, attrs, href, asset, img, icon, brandImg, catLink, storeLink, base } from './html.mjs';
import { brand, stores, nav, footerCols, categories, storeCats, DEFAULT_STORE, ORIGIN, catPath } from '../content/site.mjs';
import { livingMap } from './map.mjs';

let PREVIEW = false; let VERSION = '0'; let SHARE_ORIGIN = '';
export const setPreview = (v) => { PREVIEW = v; };
export const setVersion = (v) => { VERSION = v; };
export const setOrigin = (v) => { SHARE_ORIGIN = v; };
export const isPreview = () => PREVIEW;

const def = stores.find((s) => s.id === DEFAULT_STORE);
const todayTxt = 'Today 10am\u20138pm';

// ---------- JSON-LD builders (facts only, from site.mjs) ----------
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hh = (h) => String(h).padStart(2, '0') + ':00';
export function storeLd(s) {
  return {
    '@context': 'https://schema.org', '@type': 'Store', name: s.name, url: ORIGIN + s.page,
    telephone: s.tel.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '+1-$1-$2-$3'), email: brand.email,
    address: { '@type': 'PostalAddress', streetAddress: s.street, addressLocality: s.city, addressRegion: s.region, postalCode: s.zip, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: s.geo.lat, longitude: s.geo.lng },
    openingHoursSpecification: DAYS.map((d, i) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: d, opens: hh(s.hours[i][0]), closes: hh(s.hours[i][1]) })),
    paymentAccepted: s.payment.join(', '),
    parentOrganization: { '@type': 'Organization', name: brand.name, url: ORIGIN + '/' },
  };
}
export const orgLd = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', name: brand.name, url: ORIGIN + '/', logo: ORIGIN + '/assets/brand/badge.webp',
  email: brand.email, sameAs: brand.social.map((s) => s.href),
});
export const crumbsLd = (crumbs) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: ORIGIN + (c.href === '/' ? '/' : c.href) })),
});

// ---------- small shared chrome parts ----------
export const light = (s, cls = '') => `<span class="light light--${s.id} ${cls}" aria-hidden="true"><i></i></span>`;
export const statusSpan = (s, cur) => `<span class="status"${cur ? ' data-status-current' : ` data-status-for="${s.id}"`}><i class="status__dot"></i><span class="status__txt">${esc(todayTxt)}</span></span>`;

export function storeCard(s, opts = {}) {
  return `<article class="scard${s.id === DEFAULT_STORE ? ' scard--lead' : ''}"${opts.choose ? ' data-pick-card' : ''} data-store-card="${s.id}">
  <div class="scard__head">${light(s)}<div><p class="scard__n">No.\u00a0${s.n}${s.id === DEFAULT_STORE ? ' \u00b7 First stop' : ''}</p><h3 class="scard__name">${esc(s.city)}, ${esc(s.region)}</h3>${statusSpan(s)}</div></div>
  <p class="scard__addr">${esc(s.street)}<br>${esc(s.city)}, ${esc(s.region)} ${esc(s.zip)}</p>
  <p class="scard__links"><a href="tel:${s.tel}">${icon('phone')}${esc(s.phone)}</a><a href="${esc(s.directions)}" target="_blank" rel="noopener">${icon('route')}Directions</a></p>
  <div class="scard__cta">${opts.choose
    ? `<button class="btn btn--teal btn--sm pick" type="button" data-set-store="${s.id}"><span class="pick__off">Shop ${esc(s.city)}</span><span class="pick__on">${icon('check')}Your store</span></button>`
    : `<a class="btn btn--teal btn--sm" href="${href(s.menuPage)}">Shop ${esc(s.city)}${icon('arrow')}</a>`}<a class="btn btn--ghost btn--sm" href="${href(s.page)}">Store details</a></div>
</article>`;
}

function ageGate() {
  return `<div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gate-q" hidden>
  <div class="gate__sky" aria-hidden="true">${img('hero-aurora', { decorative: true, sizes: '100vw', min: 1400 })}<canvas class="gate__gl" data-aurora-gl data-stops="#55FFD6,#8A6BFF,#C25CFF" data-height=".44" aria-hidden="true"></canvas><canvas class="aurora-canvas" data-aurora="gate"></canvas></div>
  <div class="gate__card glass">
    <div class="gate__mono">${brandImg('monogram', { alt: 'Northern Lights' , eager: true })}</div>
    <div class="gate__step" data-gate-step="1">
      <p class="gate__hello">${esc(brand.gate.hello)}<br>${esc(brand.gate.sub)}</p>
      <h2 class="gate__q" id="gate-q">${esc(brand.gate.q)}</h2>
      <div class="gate__btns"><button class="btn btn--teal" type="button" data-gate-yes>${esc(brand.gate.yes)}</button><button class="btn btn--ghost" type="button" data-gate-no>${esc(brand.gate.no)}</button></div>
      <p class="gate__no" data-gate-msg hidden>Come back and see us when you\u2019re 21. Adult-use cannabis is for adults 21 and over.</p>
    </div>
    <div class="gate__step" data-gate-step="2" hidden>
      <p class="kicker">Where are you shopping today?</p>
      <h2 class="gate__q gate__q--sm">Pick your store</h2>
      <div class="gate__stores">${stores.map((s) => `<button class="gate__store${s.id === DEFAULT_STORE ? ' is-lead' : ''}" type="button" data-set-store="${s.id}" data-gate-done>${light(s)}<span><b>${esc(s.city)}, ${esc(s.region)}</b><small>${esc(s.street)} \u00b7 ${esc(s.tagline)}</small></span>${icon('arrow')}</button>`).join('')}</div>
      <p class="gate__fine">${esc(brand.separateCarts)}</p>
    </div>
  </div>
</div>`;
}

function megaPanel(key, m) {
  const col = (g) => {
    if (g.cats) {
      return `<div class="mega__col mega__col--cats"><p class="mega__title">${esc(g.title)} <small>at <b data-store-city>${esc(def.city)}</b></small></p><ul class="mega__cats">${categories.map((c) => `<li data-cat-item="${c.id}"${storeCats[DEFAULT_STORE].includes(c.id) ? '' : ' data-elsewhere'}>${catLink(c.id, `<span class="mega__catimg">${img(c.obj, { decorative: true, sizes: '44px', min: 200 })}</span><span>${esc(c.label)}</span>`)}</li>`).join('')}</ul></div>`;
    }
    return `<div class="mega__col"><p class="mega__title">${esc(g.title)}</p><ul>${g.links.map((l) => `<li>${l.specials ? storeLink('specials', esc(l.label)) : `<a href="${href(l.href)}">${esc(l.label)}${l.note ? `<small>${esc(l.note)}</small>` : ''}</a>`}</li>`).join('')}</ul></div>`;
  };
  return `<div class="mega mega--${key}" id="mega-${key}" data-mega="${key}" hidden>
  <div class="mega__in glass">${m.groups.map(col).join('')}</div>
</div>`;
}

function header(current) {
  const isCur = (h) => current && h && (current === h || (h !== '/' && current.startsWith(h)));
  const mega = (key) => { const m = nav[key]; return `<li class="nav__item"><button class="nav__btn" type="button" aria-expanded="false" aria-controls="mega-${key}" data-mega-btn="${key}">${esc(m.label)}${icon('chev')}</button>${megaPanel(key, m)}</li>`; };
  return `<div class="topbar" role="region" aria-label="Store hours and delivery">
  <div class="topbar__in">
    <p class="topbar__hours">${icon('clock')}<span>${esc(brand.hoursLine)}</span></p>
    <p class="topbar__mid"><span class="topbar__glow">${icon('truck')}${esc(brand.deliveryLine)}</span><span class="topbar__sep" aria-hidden="true">\u2726</span><a href="${href('/deals/#price-match')}">Price match guarantee</a></p>
    <p class="topbar__social">${brand.social.map((s) => `<a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.name)}">${icon(s.icon)}</a>`).join('')}</p>
  </div>
</div>
<header class="hdr" data-hdr>
  <div class="hdr__in">
    <a class="hdr__logo" href="${href('/')}" aria-label="${esc(brand.name)}, home">${brandImg('wordmark', { alt: brand.name, eager: true })}</a>
    <nav class="nav" aria-label="Main"><ul class="nav__list">
      ${mega('shop')}${mega('locations')}
      ${nav.flat.map((l) => `<li class="nav__item"><a class="nav__link${isCur(l.href) ? ' is-current' : ''}" href="${href(l.href)}"${isCur(l.href) ? ' aria-current="page"' : ''}>${esc(l.label)}</a></li>`).join('')}
      ${mega('learn')}${mega('about')}
    </ul></nav>
    <div class="hdr__act">
      <button class="chip" type="button" data-open-store aria-label="Change your store">${light(def)}<span class="chip__txt"><small>Your store</small><b data-store-city>${esc(def.city)}</b></span>${icon('chev')}</button>
      ${storeLink('menu', `<span>Shop now</span>${icon('bag')}`, { cls: 'btn btn--teal btn--sm hdr__shop', aria: 'Shop now: your store\u2019s live menu' })}
      <button class="burger" type="button" aria-expanded="false" aria-controls="drawer" data-drawer-btn aria-label="Open menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" data-drawer hidden>
  <div class="drawer__in">
    <button class="drawer__store" type="button" data-open-store>${light(def)}<span><small>Your store</small><b data-store-name>${esc(def.name)}</b>${statusSpan(def, true)}</span>${icon('chev')}</button>
    ${storeLink('menu', `Shop the live menu${icon('bag')}`, { cls: 'btn btn--teal drawer__shop' })}
    <p class="drawer__title">Shop by category</p>
    <ul class="drawer__cats">${categories.map((c) => `<li data-cat-item="${c.id}"${storeCats[DEFAULT_STORE].includes(c.id) ? '' : ' data-elsewhere'}>${catLink(c.id, `${img(c.obj, { decorative: true, sizes: '40px', min: 200 })}<span>${esc(c.label)}</span>`)}</li>`).join('')}</ul>
    ${['locations', 'learn', 'about'].map((k) => `<details class="drawer__grp"><summary>${esc(nav[k].label)}${icon('plus')}</summary>${nav[k].groups.map((g) => `<ul>${g.links.map((l) => `<li><a href="${href(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul>`).join('')}</details>`).join('')}
    <ul class="drawer__flat">${nav.flat.map((l) => `<li><a href="${href(l.href)}">${esc(l.label)}</a></li>`).join('')}<li>${storeLink('specials', 'Today\u2019s specials')}</li></ul>
  </div>
</div>`;
}

function footer() {
  return `<footer class="ftr" data-ftr>
  <div class="ftr__finale">
    <div class="ftr__sky" aria-hidden="true">${img('lake-dawn', { decorative: true, sizes: '100vw', min: 1400 })}</div>
    <div class="wrap ftr__top">
      <div class="ftr__hello" data-reveal>
        <p class="kicker">Where are you shopping today?</p>
        <h2 class="dh dh--lg">Two lights, <em>one family.</em></h2>
        <p class="ftr__lede">Whitehall on Broadway at the south tip of Lake Champlain, and Menands on Broadway just off I-787. ${esc(brand.hoursLine)}, with same-day delivery from both.</p>
        <div class="ftr__stores">${stores.map((s) => storeCard(s)).join('')}</div>
      </div>
      <div class="ftr__map" data-reveal>${livingMap({ id: 'ftr', compact: true })}</div>
    </div>
  </div>
  <div class="ftr__main wrap">
    <div class="ftr__brand">
      ${brandImg('badge-sm', { alt: brand.name, cls: 'ftr__badge' })}
      <p>Family-owned and operated adult-use cannabis in Whitehall and Menands, New York.</p>
      <ul class="ftr__social">${brand.social.map((s) => `<li><a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.name)}">${icon(s.icon)}</a></li>`).join('')}</ul>
      <a class="btn btn--orchid btn--sm" href="${href('/loyalty-program/')}">Join Rewards, get 50 points${icon('arrow')}</a>
    </div>
    ${footerCols.map((c) => `<details class="ftr__col" open><summary>${esc(c.title)}${icon('plus')}</summary><ul>${c.links.map((l) => `<li><a href="${href(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul></details>`).join('')}
  </div>
  <div class="wrap">
    <div class="ftr__legal">
      <p class="ftr__lic">${esc(brand.licences).replace(/OCM-[A-Z]+-\d+-\d+/g, (m) => `<span class="ftr__licno">${m}</span>`)}</p>
      <div class="ftr__warn"><p>${esc(brand.warning)}</p><p>${esc(brand.hopeline)} <a href="${esc(brand.hopelineUrl)}" target="_blank" rel="noopener">oasas.ny.gov/HOPELine</a></p></div>
    </div>
    <div class="ftr__word" aria-hidden="true">Northern Lights</div>
    <div class="ftr__bottom">
      <p>${esc(brand.copyright)}</p>
      <p class="ftr__preview">Design concept preview, not the official ${esc(brand.short)} website. Scenes marked as illustrations are AI-generated; store photos are the client\u2019s own.</p>
      <p><a href="${href('/policies/')}">Policies</a> \u00b7 <a href="${href('/sitemap/')}">Site map</a> \u00b7 <a href="${esc(brand.ocm)}" target="_blank" rel="noopener">NY adult-use info</a></p>
    </div>
  </div>
</footer>`;
}

function storeModal() {
  return `<div class="smodal" id="store-modal" role="dialog" aria-modal="true" aria-labelledby="smodal-h" data-smodal hidden>
  <div class="smodal__scrim" data-smodal-close></div>
  <div class="smodal__card glass"><div class="smodal__scroll">
    <button class="smodal__x" type="button" data-smodal-close aria-label="Close">${icon('close')}</button>
    <p class="kicker">Where are you shopping today?</p>
    <h2 class="smodal__h" id="smodal-h">Choose your store</h2>
    <p class="smodal__note">${esc(brand.separateCarts)}</p>
    <div class="smodal__list">${stores.map((s) => storeCard(s, { choose: true })).join('')}</div>
  </div></div>
</div>`;
}

// The sticky store bar (Shop Now, Call, Directions, Today's hours) for the visitor's store; Whitehall by default.
function stickybar() {
  return `<aside class="sbar" data-sbar aria-label="Your store: shop, call, directions and today\u2019s hours" hidden>
  <div class="sbar__in glass">
    <button class="sbar__store" type="button" data-open-store aria-label="Change your store">${light(def)}<span><small>Your store</small><b data-store-city>${esc(def.city)}</b></span>${icon('chev')}</button>
    <p class="sbar__hours" data-today>${icon('clock')}<span class="sbar__htxt"><small>Today\u2019s hours</small>${statusSpan(def, true)}</span></p>
    <div class="sbar__acts">
      ${storeLink('menu', `${icon('bag')}<span>Shop now</span>`, { cls: 'sbar__btn sbar__btn--shop', aria: 'Shop now: your store\u2019s live menu' })}
      <a class="sbar__btn" href="tel:${def.tel}" data-store-tel aria-label="Call the store">${icon('phone')}<span>Call</span></a>
      <a class="sbar__btn" href="${esc(def.directions)}" data-store-directions target="_blank" rel="noopener" aria-label="Directions to the store">${icon('route')}<span>Directions</span></a>
    </div>
    <button class="sbar__x" type="button" data-sbar-close aria-label="Hide this bar">${icon('close')}</button>
  </div>
</aside>`;
}

// ---------- the page ----------
// p: { path, title, description, main, type?, crumbs?, jsonld?, ogImage?, bodyClass?, canonical?, ogType?, head? }
export function page(p) {
  const canonical = p.canonical || ORIGIN + (p.path === '/' ? '/' : p.path);
  const share = (SHARE_ORIGIN || ORIGIN) + base() + 'assets/' + (p.ogImage || 'img/hero-aurora-1440.webp');
  const ld = [...(p.jsonld || [])];
  if (p.crumbs && p.crumbs.length > 1) ld.push(crumbsLd(p.crumbs));
  const stamp = '?v=' + VERSION;
  return `<!doctype html>
<html lang="en" class="no-js" data-store="${DEFAULT_STORE}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description || '')}">
<link rel="canonical" href="${esc(canonical)}">
${PREVIEW || p.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<meta name="theme-color" content="#071528">
<meta property="og:type" content="${esc(p.ogType || 'website')}">
<meta property="og:site_name" content="${esc(brand.name)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description || '')}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(share)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/webp" href="${asset('brand/favicon.webp')}">
<link rel="preload" as="font" type="font/woff2" href="${asset('fonts/fraunces-normal.woff2')}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${asset('fonts/jost-normal.woff2')}" crossorigin>
<link rel="stylesheet" href="${asset('css/site.css')}${stamp}">
<script>(function(d){var r=d.documentElement;r.className=r.className.replace('no-js','js');try{var s=localStorage.getItem('nl.store');if(s==='whitehall'||s==='menands')r.setAttribute('data-store',s);if(!localStorage.getItem('nl.age')&&!/[?&]gate=off/.test(location.search))r.classList.add('gate-pending');}catch(e){}})(document);</script>
${p.head || ''}
${ld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body class="${esc(['t-' + (p.type || 'page'), p.bodyClass || ''].join(' ').trim())}">
<a class="skip" href="#main">Skip to content</a>
${ageGate()}
${header(p.path)}
<main id="main" tabindex="-1">
${p.main}
</main>
${footer()}
${storeModal()}
${stickybar()}
<script type="application/json" id="nl-data">${JSON.stringify({
  base: base(), defaultStore: DEFAULT_STORE, storeCats,
  stores: stores.map((s) => ({ id: s.id, name: s.name, city: s.city, phone: s.phone, tel: s.tel, directions: s.directions, menu: href(s.menuPage), page: href(s.page), hours: s.hours })),
}).replace(/</g, '\\u003c')}</script>
<script src="${asset('js/site.js')}${stamp}" defer></script>
</body>
</html>
`;
}
