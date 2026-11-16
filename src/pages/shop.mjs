// shop.mjs: every page that sells. Each store's live menu (its own embedded online menu, with prices and a cart),
// opened on the right shelf: /whitehall/ and /menands/ (the live site's own URLs), one page per category the store
// carries (verified with products, 2026-11-16), specials, brands, plus /shop/ and /deals/, which open the visitor's
// store. No page in this file is ever empty: the menu is the content.
import { esc, href, icon, inline, attrs } from '../lib/html.mjs';
import { menuHead, menuEmbed, light, statusSpan, kicker, dh } from '../lib/parts.mjs';
import { storeLd, crumbsLd } from '../lib/layout.mjs';
import { brand, stores, storeCats, catById, storeById, DEFAULT_STORE, loyalty } from '../content/site.mjs';

const CAT_COPY = {
  flower: 'Whole flower by the eighth, quarter, half and ounce.',
  'pre-rolls': 'Singles, multi-packs and infused pre-rolls, ready when you are.',
  vaporizers: 'Cartridges, all-in-ones and pods.',
  concentrates: 'Rosin, resin, badder and other extracts.',
  edibles: 'Gummies, chews and other infused treats. Start low, go slow.',
  orals: 'Drops, mints and other oral products. Give them time to work.',
  tinctures: 'Measured by the dropper.',
  topicals: 'Balms and lotions.',
  cbd: 'CBD-forward products.',
  accessories: 'Grinders, papers, batteries and gear.',
  apparel: 'Northern Lights tees and hats.',
};

function menuPage({ store, cat = null, path = null }) {
  const s = storeById(store);
  const c = cat ? catById(cat) : null;
  const label = c ? c.label : path === 'specials' ? 'Specials' : path === 'brands' ? 'Brands' : 'All products';
  const title = c ? `${c.label} at ${s.city}` : path === 'specials' ? `Today’s specials at ${s.city}` : path === 'brands' ? `Shop by brand at ${s.city}` : `The ${s.city} menu`;
  const p = c ? `/${s.id}/${c.id}/` : path ? `/${s.id}/${path}/` : s.menuPage;
  const crumbs = [{ label: 'Home', href: '/' }, { label: `${s.city} menu`, href: s.menuPage }, ...(c || path ? [{ label, href: p }] : [])];
  const intro = c ? `${CAT_COPY[c.id]} Live prices and stock from Northern Lights ${s.city}; add to your cart and order ahead for pickup or same-day delivery.`
    : path === 'specials' ? 'Every item on special right now at this store, live from the menu. Offers change often, so this list is always current.'
      : path === 'brands' ? 'Browse the menu by brand. Pick one to see what we carry from it today.'
        : `In the store’s own words: “${s.banner}”`;
  return {
    path: p, type: 'menu', store: s.id, category: c ? c.id : path || 'all',
    title: c ? `${c.label} in ${s.city}, NY | Northern Lights` : path === 'specials' ? `Cannabis Deals in ${s.city}, NY | Northern Lights` : path === 'brands' ? `Cannabis Brands in ${s.city}, NY | Northern Lights` : `${s.city} Dispensary Menu | Northern Lights`,
    description: c ? `Shop ${c.label.toLowerCase()} at Northern Lights ${s.city}, ${s.street}. Live menu with prices and a cart: order ahead for pickup or same-day delivery. Open daily 10am–8pm.`.slice(0, 158)
      : `${title}: the live Northern Lights ${s.city} menu with prices and a cart. Order ahead for pickup or same-day delivery, open daily 10am–8pm.`.slice(0, 158),
    crumbs, jsonld: c || path ? [] : [storeLd(s)],
    bodyClass: 'is-menu',
    main: menuHead({ store: s.id, current: c ? c.id : path, title, intro }) + menuEmbed({ store: s.id, category: c ? c.id : null, path: c ? null : path, label }),
  };
}

// /shop/ and /deals/: the visitor's store (?store=, then the saved store, then Whitehall), chosen before the menu
// loads. The menu script is added right after the inline script, the same spot a static tag would sit.
function autoEmbed(path) {
  const S = Object.fromEntries(stores.map((s) => [s.id, s.script]));
  return `<section class="menu" aria-label="Live menu">
  <div class="wrap-wide menu__wrap">
    <div class="menu__frame" data-menu-frame>
      <div class="menu__loading" data-menu-loading><span class="menu__spin" aria-hidden="true"></span><span>Loading your store’s menu…</span></div>
      <script>(function(){var S=${JSON.stringify(S)},st=${JSON.stringify(DEFAULT_STORE)};try{var q=new URLSearchParams(location.search).get('store'),l=localStorage.getItem('nl.store');st=(q&&S[q])?q:(l&&S[l])?l:st;if(q&&S[q])localStorage.setItem('nl.store',q);}catch(e){}document.documentElement.setAttribute('data-menu-store',st);document.documentElement.setAttribute('data-store',st);${path ? `try{var p=new URLSearchParams(location.search);if(!p.has('dtche[category]')&&!p.has('dtche[path]')&&!p.has('dtche[product]')){p.set('dtche[path]',${JSON.stringify(path)});history.replaceState(history.state,'',location.pathname+'?'+p.toString()+location.hash);}}catch(e){}` : ''}var s=document.createElement('script');s.async=true;s.id='dutchie--embed__script';s.src=S[st];document.currentScript.parentNode.insertBefore(s,document.currentScript.nextSibling);})();</script>
    </div>
    <noscript><p class="menu__noscript">The live menu needs JavaScript. Open the <a href="${href('/whitehall/')}">Whitehall menu</a> or the <a href="${href('/menands/')}">Menands menu</a>, or call Whitehall at ${esc(stores[0].phone)}.</p></noscript>
  </div>
</section>`;
}
const storeSeg = (pathFor) => `<div class="seg seg--menu" role="group" aria-label="Choose the store">${stores.map((s) => `<a class="seg__b" href="${href(pathFor(s))}" data-seg="${s.id}" data-set-store="${s.id}">${light(s)}${esc(s.city)}</a>`).join('')}</div>`;

function shopAll() {
  return {
    path: '/shop/', type: 'menu', category: 'all', bodyClass: 'is-menu',
    title: 'Shop Cannabis Online | Northern Lights Whitehall & Menands',
    description: 'Shop the live Northern Lights menu at your store, Whitehall or Menands, NY: prices, stock and a cart. Order ahead for pickup or same-day delivery.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop/' }],
    main: `<section class="mhead mhead--auto">
  <div class="mhead__sky" aria-hidden="true"><canvas class="mhead__gl" data-aurora-gl data-stops="#55FFD6,#4089FF,#C25CFF" data-height=".3" data-opacity=".55" aria-hidden="true"></canvas><canvas class="aurora-canvas" data-aurora="soft"></canvas></div>
  <div class="wrap-wide mhead__in">
    <div class="mhead__top">
      <div class="mhead__id"><div><p class="kicker">Shop Northern Lights</p><h1 class="dh dh--md mhead__h1">Shopping at <span data-store-city>Whitehall</span></h1></div></div>
      <div class="mhead__meta">${statusSpan(stores[0], true)}${storeSeg((s) => `/shop/?store=${s.id}`)}</div>
    </div>
    <p class="mhead__intro">Your store’s live menu, with prices and a cart. Each store keeps its own cart; switch above any time.</p>
  </div>
</section>` + autoEmbed(null),
  };
}

function deals() {
  return {
    path: '/deals/', type: 'menu', category: 'specials', bodyClass: 'is-menu is-deals',
    title: 'Dispensary Deals & Price Match | Northern Lights',
    description: 'Live specials at Northern Lights Whitehall and Menands, our price match guarantee with any Capital Region dispensary, Rewards points and free same-day delivery.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Deals', href: '/deals/' }],
    main: `<section class="mhead mhead--deals">
  <div class="mhead__sky" aria-hidden="true"><canvas class="mhead__gl" data-aurora-gl data-stops="#55FFD6,#4089FF,#C25CFF" data-height=".3" data-opacity=".55" aria-hidden="true"></canvas><canvas class="aurora-canvas" data-aurora="soft"></canvas></div>
  <div class="wrap-wide mhead__in">
    <div class="mhead__top">
      <div class="mhead__id"><div><p class="kicker">Deals · live specials</p><h1 class="dh dh--md mhead__h1">Today’s specials at <span data-store-city>Whitehall</span></h1></div></div>
      <div class="mhead__meta">${statusSpan(stores[0], true)}${storeSeg((s) => `/deals/?store=${s.id}`)}</div>
    </div>
    <div class="savers">
      <div class="saver saver--match" id="price-match"><p class="kicker">Price match guarantee</p><p class="saver__q">“${esc(brand.priceMatch)}”</p><p class="saver__s">From both stores’ own menus. Found a lower price at a licensed recreational dispensary in the Capital Region? Ask us at the counter or call the store before you order.</p></div>
      <a class="saver" href="${href('/loyalty-program/')}"><span class="saver__big">${loyalty.bonus}</span><span><b>Rewards points</b> the day you join. 100 points take $5 off a $6+ purchase.</span>${icon('arrow')}</a>
      <a class="saver" href="${href('/delivery/')}">${icon('truck')}<span><b>Free same-day delivery</b> from both stores, 11am–7pm.</span>${icon('arrow')}</a>
    </div>
  </div>
</section>` + autoEmbed('specials'),
  };
}

export function pages() {
  const out = [shopAll(), deals()];
  for (const s of stores) {
    out.push(menuPage({ store: s.id }));
    for (const c of storeCats[s.id]) out.push(menuPage({ store: s.id, cat: c }));
    out.push(menuPage({ store: s.id, path: 'specials' }));
    out.push(menuPage({ store: s.id, path: 'brands' }));
  }
  return out;
}
