// lab-hero.mjs: the hero options lab (round 3, lane H). The owner asked for "3 more dynamic Hero Section layouts": each
// option is the full home page with a different hero above the same home bands (src/pages/home.mjs), so they can be
// compared in place, plus an index. All noindex. Styles: src/styles/hero-options.css (every class starts with hx);
// motion: src/scripts/hero-options.js. Every Shop button opens a store's live menu page, Whitehall first.
//   /hero-options/    the index: a card per option; A is the current hero at /
//   /hero-options/b/  "Aurora Stage": centred and cinematic; scrolling lifts the badge and headline as the scene zooms
//   /hero-options/c/  "Two Lights": Whitehall | Menands, split by a glowing aurora seam that follows the pointer
//   /hero-options/d/  "Orbit": the category cut-outs drift around the headline at different depths
import { esc, href, img, icon, asset, brandImg, storeLink, catLink } from '../lib/html.mjs';
import { pageHero, statusSpan } from '../lib/parts.mjs';
import { sections, homeJsonld, pages as homePages } from './home.mjs';
import { brand, stores, DEFAULT_STORE, catById } from '../content/site.mjs';

const W = stores.find((s) => s.id === DEFAULT_STORE); // Whitehall: always first
const M = stores.find((s) => s.id !== DEFAULT_STORE);

const OPTS = [
  { k: 'A', name: 'Lights on Broadway', to: '/?hx=a', tag: 'The current hero',
    note: 'The hero on the home page today, exactly as it stands there.',
    moves: 'Opens on the home page itself, with this switcher, so you can flip between the four.' },
  { k: 'B', name: 'Aurora Stage', to: '/hero-options/b/', tag: 'Centred, cinematic',
    note: 'The full night scene with the aurora curtain at full strength, the badge over a giant centred headline, and the two stores as points of light with their live hours.',
    moves: 'Scrolling lifts the badge and headline while the scene zooms and the aurora deepens; the sky answers the pointer.' },
  { k: 'C', name: 'Two Lights', to: '/hero-options/c/', tag: 'Interactive split',
    note: 'The hero split between the stores: Whitehall’s lake on the left, Menands’ river city on the right, each with its own Shop button and live hours, divided by a glowing aurora seam.',
    moves: 'The seam follows the pointer (drag it on a tablet); Whitehall starts wider. Phones stack the two stores.' },
  { k: 'D', name: 'Orbit', to: '/hero-options/d/', tag: 'Floating objects',
    note: 'The headline on deep navy under the aurora, with seven product cut-outs floating around it at different depths, each opening its shelf on the live menu.',
    moves: 'Slow orbits, pointer and scroll parallax, a label on hover; on phones the products make an arc above the headline.' },
];

// ---------- shared parts ----------
// The one H1 of every option: the same words as the current hero.
const H1 = (cls) => `<h1 class="hx__h1 ${cls}"><span class="hx__k">${esc(brand.name)} · Whitehall &amp; Menands, NY</span><span class="dh dh--mega hx__t" data-split>Lights on <em>Broadway.</em></span></h1>`;
// on phones the topbar drops delivery and price match (fix.css), so every hero carries them
const facts = (cls) => `<ul class="hx__facts ${cls}"><li>${icon('clock')}${esc(brand.hoursLine)}</li><li>${icon('truck')}Same-day delivery</li><li>${icon('tag')}Price match guarantee</li></ul>`;

// the floating switcher: A / B / C / D, the current one marked (fixed, bottom-left; hero-options.css). On phones
// hero-options.js folds it into one toggle (the current letter) that opens the list; without JS it stays open.
export function switcher(cur = null) {
  return `<nav class="hxs" data-hxs aria-label="Hero options">
  <a class="hxs__all" href="${href('/hero-options/')}"${cur ? '' : ' aria-current="page"'}>${icon('spark')}<span>Hero options</span></a>
  <ol class="hxs__list" id="hxs-list">${OPTS.map((o) => `<li><a class="hxs__o${o.k === cur ? ' is-on' : ''}" href="${href(o.to)}" title="${esc(`${o.k}: ${o.name}`)}"${o.k === cur ? ' aria-current="page"' : ''}><span aria-hidden="true">${o.k}</span><span class="sr-only">Option ${o.k}, ${esc(o.name)}</span></a></li>`).join('')}</ol>
  <button class="hxs__tog" type="button" aria-expanded="false" aria-controls="hxs-list"><span aria-hidden="true">${cur || icon('spark')}</span><span class="sr-only">Hero options${cur ? `, showing option ${cur}` : ''}</span></button>
</nav>`;
}

// everything on the home page below its hero, in the home page's own order (falls back to the known order)
function homeBands() {
  try {
    const main = homePages()[0].main, h = sections.hero();
    if (main.startsWith(h)) return main.slice(h.length);
  } catch (e) { /* fall through */ }
  const { choose, shelves, livingRoom, deals, rewards, fourSeasons, neighbors, nights, aboutFaq } = sections;
  return [choose, shelves, livingRoom, deals, rewards, fourSeasons, neighbors, nights, aboutFaq].map((f) => f()).join('');
}

// ---------- B: Aurora Stage ----------
function heroB() {
  const point = (s) => `<a class="hxb__pt hxb__pt--${s.id}" href="${href(s.menuPage)}">
        <span class="hxb__orb" aria-hidden="true"><i></i></span>
        <span class="hxb__pt-t"><b>Shop ${esc(s.city)}</b>${statusSpan(s)}</span>${icon('arrow')}
      </a>`;
  return `<section class="hx hxb" data-hx="b">
  <div class="hxb__sky" aria-hidden="true">
    <div class="hxb__media">${img('hero-aurora', { decorative: true, sizes: '100vw', eager: true, min: 2200 })}<video class="hxb__video" muted loop playsinline preload="none" poster="${asset('img/hero-aurora-1440.webp')}" data-src="${asset('video/hero-aurora.mp4')}" data-src-sm="${asset('video/hero-aurora-sm.mp4')}" aria-hidden="true"></video></div>
    <div class="hxb__curtain"><canvas class="hxb__gl" data-aurora-gl data-stops="#55FFD6,#4089FF,#C25CFF" data-height=".38" data-opacity="1" aria-hidden="true"></canvas></div>
    <div class="hxb__stars"></div>
    <div class="hxb__scrim"></div>
  </div>
  <div class="wrap hxb__stage">
    <div class="hxb__lift">
      <div class="hxb__badge" aria-hidden="true"><span class="hxb__halo"></span>${brandImg('badge', { eager: true })}</div>
      ${H1('hxb__h1')}
      <p class="hxb__lede" data-reveal style="--d:300">A family-owned dispensary on Broadway in Whitehall, at the south tip of Lake Champlain, with a sister store in Menands near Albany.</p>
    </div>
    <div class="hxb__lights" data-reveal style="--d:450">
      ${point(W)}<span class="hxb__thread" aria-hidden="true"><i></i></span>${point(M)}
    </div>
    ${facts('hxb__facts')}
  </div>
  <a class="hx__cue" href="#choose" aria-label="Scroll to choose your store"><span></span></a>
</section>`;
}

// ---------- C: Two Lights ----------
function heroC() {
  // each store's scene sits in a window; the windows' edges meet at the seam (--s), the scenes themselves stay put
  const scene = (s, id, min) => `<div class="hxc__win hxc__win--${s.id}" aria-hidden="true"><div class="hxc__inner">${img(id, { decorative: true, sizes: '(max-width: 860px) 100vw, 74vw', eager: true, min })}<span class="hxc__shade"></span></div></div>`;
  const store = (s) => `<div class="hxc__store hxc__store--${s.id}">
      <p class="hxc__n"><span class="hxc__dot" aria-hidden="true"></span>No. ${s.n}${s.id === DEFAULT_STORE ? ' · First stop' : ''}</p>
      <p class="hxc__name">${esc(s.city)}<span>, ${esc(s.region)}</span></p>
      <p class="hxc__tag"><span class="hxc__street">${esc(s.street)} · </span>${esc(s.tagline)}</p>
      ${statusSpan(s)}
      <p class="hxc__cta"><a class="btn ${s.id === DEFAULT_STORE ? 'btn--teal' : 'btn--orchid'}" href="${href(s.menuPage)}">Shop ${esc(s.city)}${icon('bag')}</a><a class="hxc__more" href="${href(s.page)}">Store details${icon('arrow')}</a></p>
    </div>`;
  return `<section class="hx hxc" data-hx="c">
  ${scene(W, 'lake-dawn', 1800)}
  ${scene(M, 'city-river', 1600)}
  <div class="hxc__sky" aria-hidden="true"><canvas class="hxc__gl" data-aurora-gl data-stops="#55FFD6,#8A6BFF,#D369FF" data-height=".34" data-opacity=".7" aria-hidden="true"></canvas><span class="hxc__veil"></span></div>
  <div class="hxc__seam" data-hxc-seam aria-hidden="true"><span class="hxc__beam"></span><span class="hxc__grip">${icon('arrow-l')}${icon('arrow')}</span></div>
  <div class="hxc__head">
    ${H1('hxc__h1')}
    <p class="hxc__lede" data-reveal style="--d:300">Two stores, both on Broadway, one family. Pick your light.</p>
    ${facts('hxc__facts')}
  </div>
  ${store(W)}
  ${store(M)}
</section>`;
}

// ---------- D: Orbit ----------
// x/y: % of the hero below the header; w: width in vw at desktop; z: depth 0 (far: smaller, softer, darker) .. 1 (near).
// They ring the headline's open side, from above its right end round to below it; the words keep to the left half.
// mx/my/mw: the phone arc above the headline (m: false = not in the arc)
const ORBIT = [
  { id: 'flower', x: 71, y: 29, w: 12.4, z: 1, m: true, mx: 32, my: 38, mw: 20 },
  { id: 'pre-rolls', x: 89, y: 16, w: 8.2, z: 0.55, m: true, mx: 14.5, my: 58, mw: 14 },
  { id: 'vaporizers', x: 64.5, y: 67, w: 4.1, z: 0.72, m: true, mx: 50, my: 36, mw: 7.6 },
  { id: 'edibles', x: 85, y: 59, w: 11.8, z: 0.92, m: true, mx: 68, my: 40, mw: 19 },
  { id: 'concentrates', x: 76, y: 90, w: 8.8, z: 0.4, m: false },
  { id: 'tinctures', x: 94, y: 86, w: 5.6, z: 0.45, m: true, mx: 85.5, my: 60, mw: 12 },
  { id: 'topicals', x: 62, y: 11, w: 7.2, z: 0.3, m: false },
];
function heroD() {
  const obj = (o, i) => {
    const c = catById(o.id);
    const style = `--x:${o.x}%;--y:${o.y}%;--w:${o.w};--z:${o.z};--mx:${o.mx ?? 50}%;--my:${o.my ?? 50}%;--mw:${o.mw ?? 14};--i:${i}`;
    return `<li class="hxd__o" data-hxd-o data-m="${o.m ? 1 : 0}" style="${style}">${catLink(o.id, `<span class="hxd__img">${img(c.obj, { decorative: true, sizes: '(max-width: 860px) 110px, 200px', min: 300 })}</span><span class="hxd__lbl">${esc(c.label)}${icon('arrow')}</span>`, { cls: 'hxd__a' })}</li>`;
  };
  return `<section class="hx hxd" data-hx="d">
  <div class="hxd__sky" aria-hidden="true"><canvas class="hxd__gl" data-aurora-gl data-stops="#55FFD6,#4089FF,#C25CFF" data-height=".46" data-opacity=".95" aria-hidden="true"></canvas><span class="hxd__stars"></span><span class="hxd__veil"></span></div>
  <div class="hxd__in">
    <div class="hxd__copy">
      ${H1('hxd__h1')}
      <p class="hxd__lede" data-reveal style="--d:300">A family-owned dispensary on Whitehall’s Broadway, at the south tip of Lake Champlain, with a sister store in Menands near Albany.</p>
      <div class="hxd__cta" data-reveal style="--d:450">${storeLink('menu', `<span>Shop <span data-store-city>${esc(W.city)}</span></span>${icon('bag')}`, { cls: 'btn btn--teal btn--lg' })}<button class="btn btn--ghost btn--lg" type="button" data-open-store>Choose your store${icon('pin')}</button></div>
      ${facts('hxd__facts')}
    </div>
  </div>
  <ul class="hxd__orbit" aria-label="Shop by category">${ORBIT.map(obj).join('')}</ul>
</section>`;
}

// ---------- the index ----------
function indexMain() {
  const pic = (id, min = 900) => img(id, { decorative: true, sizes: '(max-width: 760px) 92vw, 560px', min });
  const sk = (cls, n = 3) => `<span class="hxi__sk hxi__sk--${cls}">${'<i></i>'.repeat(n)}</span>`;
  const prev = {
    A: () => `${pic('hero-aurora')}${sk('a')}`,
    B: () => `${pic('hero-aurora')}<span class="hxi__badge">${brandImg('badge-sm')}</span>${sk('b')}<span class="hxi__dots"><i></i><i></i></span>`,
    C: () => `<span class="hxi__half hxi__half--w">${pic('lake-dawn', 1000)}</span><span class="hxi__half hxi__half--m">${pic('city-river')}</span><span class="hxi__seam"></span>${sk('c', 2)}`,
    D: () => `<span class="hxi__aur"></span>${['cut-flower', 'cut-prerolls', 'cut-vapes', 'cut-edibles', 'cut-tinctures'].map((id, i) => `<span class="hxi__cut hxi__cut--${i}">${img(id, { decorative: true, sizes: '90px', min: 300 })}</span>`).join('')}${sk('d')}`,
  };
  const card = (o) => `<li class="hxi__card hxi__card--${o.k.toLowerCase()}">
      <a class="hxi__a" href="${href(o.to)}">
        <span class="hxi__prev" aria-hidden="true">${prev[o.k]()}</span>
        <span class="hxi__body">
          <span class="hxi__k"><b>${o.k}</b>${esc(o.tag)}</span>
          <span class="hxi__name">${esc(o.name)}</span>
          <span class="hxi__note">${esc(o.note)}</span>
          <span class="hxi__moves">${icon('spark')}<span>${esc(o.moves)}</span></span>
          <span class="hxi__go">${o.k === 'A' ? 'Open the home page' : `Open option ${o.k}`}${icon('arrow')}</span>
        </span>
      </a>
    </li>`;
  return pageHero({
    kicker: 'Design lab · not public',
    h1: 'Four heroes, *one home page.*',
    lede: 'A is the hero on the home page today. B, C and D are three more dynamic layouts, each above the full home page so you can judge them in place. The switcher in the bottom corner of every option flips between them.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Hero options', href: '/hero-options/' }],
    image: 'hero-aurora',
    variant: 'phero--short',
  }) + `<section class="band hxi">
  <div class="wrap">
    <ol class="hxi__grid">${OPTS.map(card).join('')}</ol>
    <p class="hxi__fine">${icon('check')}<span>The same rules hold in all four: one headline, “Lights on Broadway.”; every Shop button opens a live menu, Whitehall first; the motion stops for visitors who ask for reduced motion, and every hero is complete without JavaScript.</span></p>
  </div>
</section>`;
}

export function pages() {
  const bands = homeBands();
  const option = (k, hero) => {
    const o = OPTS.find((x) => x.k === k);
    return {
      path: o.to, type: 'home', noindex: true, bodyClass: 'hx-lab',
      title: `Hero option ${k}: ${o.name} | ${brand.name}`,
      description: `Design lab, hero option ${k} (${o.name}) above the full home page. ${o.note}`,
      jsonld: homeJsonld(),
      main: hero + bands + switcher(k),
    };
  };
  return [
    {
      path: '/hero-options/', type: 'page', noindex: true, bodyClass: 'hx-lab',
      title: `Hero options | ${brand.name}`,
      description: 'Design lab: the current home hero and three more dynamic hero layouts, each above the full home page.',
      main: indexMain() + switcher(null),
    },
    option('B', heroB()),
    option('C', heroC()),
    option('D', heroD()),
  ];
}
