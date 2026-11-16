// home.mjs: the home page, "Lights on Broadway". Section order follows the adopted regional-dispensary IA (hero ->
// choose your store -> categories -> deals -> rewards -> reviews -> learn -> FAQ), with the store's own living room
// and the four seasons as the signature bands. Every claim traces to facts/client-facts.json.
import { esc, href, img, icon, asset, brandImg, storeLink, catLink, inline } from '../lib/html.mjs';
import { dh, kicker, btn, catGrid, reviewDeck, tiers, seasons, floatObj, faqList, light, statusSpan, storeSwitch } from '../lib/parts.mjs';
import { storeLd, orgLd } from '../lib/layout.mjs';
import { livingMap } from '../lib/map.mjs';
import { brand, stores, DEFAULT_STORE, storeCats, sharedCats, loyalty } from '../content/site.mjs';

const W = stores[0], M = stores[1];

function hero() {
  return `<section class="hero" data-hero>
  <div class="hero__sky" aria-hidden="true">
    <div class="hero__media" data-depth="0.12">${img('hero-aurora', { decorative: true, sizes: '100vw', eager: true, min: 2200 })}<video class="hero__video" muted loop playsinline preload="none" poster="${asset('img/hero-aurora-1440.webp')}" data-src="${asset('video/hero-aurora.mp4')}" data-src-sm="${asset('video/hero-aurora-sm.mp4')}" aria-hidden="true"></video></div>
    <canvas class="hero__gl" data-aurora-gl data-stops="#55FFD6,#4089FF,#C25CFF" data-height=".40" aria-hidden="true"></canvas>
    <canvas class="aurora-canvas hero__aurora" data-aurora="hero"></canvas>
    <div class="hero__scrim"></div>
    <div class="hero__stars" data-depth="-0.06"></div>
  </div>
  <div class="wrap-wide hero__in">
    <div class="hero__copy">
      <h1 class="hero__h1"><span class="hero__k">Northern Lights Dispensary · Whitehall &amp; Menands, NY</span><span class="dh dh--mega hero__t" data-split>Lights on <em>Broadway.</em></span></h1>
      <p class="hero__lede" data-reveal style="--d:350">A family-owned dispensary in a red clapboard building on Whitehall’s Broadway, at the south tip of Lake Champlain. Our sister store in Menands, just off I-787 near Albany, carries the same family-run spirit into the city.</p>
      <div class="hero__cta" data-reveal style="--d:500">
        ${storeLink('menu', `<span>Shop <span data-store-city>${esc(W.city)}</span></span>${icon('bag')}`, { cls: 'btn btn--teal btn--lg', aria: null })}
        <button class="btn btn--ghost btn--lg" type="button" data-open-store>Choose your store${icon('pin')}</button>
      </div>
      <ul class="hero__facts" data-reveal style="--d:650">
        <li>${icon('clock')}Open every day, 10am–8pm</li>
        <li>${icon('truck')}Same-day delivery</li>
        <li>${icon('tag')}Price match guarantee</li>
      </ul>
    </div>
  </div>
  <a class="hero__cue" href="#choose" aria-label="Scroll to choose your store"><span></span></a>
</section>`;
}

function choose() {
  return `<section class="band choose" id="choose">
  <div class="wrap">
    <div class="band__head band__head--center" data-reveal>
      ${kicker('Two stores, one family')}
      ${dh('Where are you shopping *today?*', 'dh--lg')}
      <p>Pick a store and every Shop button on the site follows you there: its own live menu, its own cart, its own hours. Whitehall leads; Menands is a straight shot down the Hudson.</p>
    </div>
    ${storeSwitch({ id: 'home' })}
  </div>
</section>`;
}

function shelves() {
  const extra = [['orals', 'whitehall', 'Orals'], ['cbd', 'menands', 'CBD'], ['apparel', 'menands', 'Apparel']];
  return `<section class="band shelves band--night-2" id="shop">
  <div class="band__clip" aria-hidden="true"><div class="shelves__glow"></div></div>
  <div class="wrap">
    <div class="band__head band__head--split" data-reveal>
      <div>${kicker('Shop by category')}${dh('Every shelf, *one tap* from the cart.', 'dh--lg')}</div>
      <div class="shelves__side">
        <p>Each tile opens the live menu at your store, already on that shelf, with prices and a cart. No extra clicks.</p>
        <div class="seg" role="group" aria-label="Shopping at">${stores.map((s) => `<button class="seg__b" type="button" data-set-store="${s.id}" data-seg="${s.id}">${light(s)}${esc(s.city)}</button>`).join('')}</div>
      </div>
    </div>
    ${catGrid({ ids: sharedCats })}
    <p class="shelves__more" data-reveal>Also on the shelves: ${extra.map(([c, s, l]) => `<a href="${href(`/${s}/${c}/`)}">${l} <small>at ${s === 'whitehall' ? 'Whitehall' : 'Menands'}</small></a>`).join(' · ')} · ${storeLink('specials', 'Today’s specials')}</p>
  </div>
</section>`;
}

function livingRoom() {
  return `<section class="band band--lamp living" id="inside">
  <div class="wrap living__grid">
    <div class="living__art">
      <div class="living__frame" data-reveal="zoom">${img('living-room', { sizes: '(max-width: 900px) 92vw, 640px', min: 1400 })}<span class="living__tag">Inside Whitehall · an illustration of the feel</span></div>
      ${floatObj('cut-guitar', 'living__guitar', '-0.14')}
      ${floatObj('cut-plant', 'living__plant', '0.12')}
    </div>
    <div class="living__copy" data-reveal="right">
      ${kicker('Inside Northern Lights Whitehall')}
      ${dh('A jam-band living room in a *village general store.*', 'dh--lg')}
      <p class="lede">A Jerry Garcia portrait looks over a guitar on its stand. There’s a Persian rug, a leather armchair, live-edge wood and houseplants, and the staff remember regulars by name.</p>
      <ul class="living__list">
        <li>${icon('heart')}<span><b>No attitude, LGBTQ+ friendly.</b> Locals, lake-goers and Vermont neighbors take a seat and leave with exactly what they came for.</span></li>
        <li>${icon('music')}<span><b>Music and pop-up nights.</b> In the store’s own words: “great vibes, occasional music and Brand Pop-Up events!”</span></li>
        <li>${icon('user')}<span><b>Quick-witted budtenders</b> who help newcomers find their way. Ask anything.</span></li>
        <li>${icon('spark')}<span><b>The pizza place downstairs</b> makes it a proper neighborhood hangout.</span></li>
      </ul>
      <div class="ctarow"><a class="btn btn--lamp" href="${href('/locations/whitehall-ny/')}">Visit Whitehall${icon('arrow')}</a><a class="btn btn--ghost" href="${href('/whitehall/')}">Shop the Whitehall menu${icon('bag')}</a></div>
    </div>
  </div>
</section>`;
}

function deals() {
  return `<section class="band deals" id="deals">
  <div class="wrap">
    <div class="band__head" data-reveal>${kicker('Deals, delivery and Rewards')}${dh('Fair prices, *matched.*', 'dh--lg')}</div>
    <div class="bento">
      <article class="bento__a bento__match" data-reveal data-spot>
        <p class="kicker">Price match guarantee</p>
        <blockquote class="bento__quote">“We price match guarantee with <em>ANY</em> recreational dispensary in the Capitol Region!”</blockquote>
        <p class="bento__note">From both stores’ own menus. Found it lower at a licensed dispensary nearby? Ask us.</p>
        <a class="btn btn--teal" href="${href('/deals/#price-match')}">How the price match works${icon('arrow')}</a>
      </article>
      <a class="bento__a bento__specials" data-reveal style="--d:120" href="${href(W.menuPage + 'specials/')}" data-store-href="specials">
        <span class="bento__ic">${icon('tag')}</span>
        <span class="bento__t">Today’s specials at <b data-store-city>${esc(W.city)}</b></span>
        <span class="bento__s">Live offers on the menu, with a cart. They change often, so we never print them here.</span>
        <span class="bento__go">Open specials${icon('arrow')}</span>
      </a>
      <a class="bento__a bento__delivery" data-reveal style="--d:200" href="${href('/delivery/')}">
        ${img('delivery-road', { decorative: true, sizes: '(max-width: 900px) 92vw, 520px', min: 900 })}
        <span class="bento__over"><span class="bento__ic">${icon('truck')}</span><span class="bento__t">Same-day delivery, free</span><span class="bento__s">From both stores, 11am–7pm. Order on the live menu and check your address at checkout.</span><span class="bento__go">How delivery works${icon('arrow')}</span></span>
      </a>
      <a class="bento__a bento__pts" data-reveal style="--d:280" href="${href('/loyalty-program/')}">
        <span class="bento__big">${loyalty.bonus}</span><span class="bento__t">points when you join Rewards</span><span class="bento__go">Join Rewards${icon('arrow')}</span>
      </a>
    </div>
  </div>
</section>`;
}

function rewards() {
  return `<section class="band rewards band--night-0" id="rewards">
  <div class="band__clip" aria-hidden="true"><canvas class="aurora-canvas" data-aurora="tiers"></canvas><div class="rewards__fade"></div></div>
  <div class="wrap">
    <div class="band__head band__head--center" data-reveal>
      ${kicker('Northern Lights Rewards')}
      ${dh('Begin in Aurora. Become a *Northern Light.*', 'dh--lg')}
      <p>Four tiers, set by what you spend in a year. The higher you climb, the more every dollar earns. Sign up and we add ${loyalty.bonus} points right away.</p>
    </div>
    ${tiers()}
    <div class="rewards__foot" data-reveal>
      <p><b>100 points</b> = $5 off a purchase of $6.00 or more · <b>250 points</b> = $15 off $16.00 or more <small>(before tax, one redemption per day)</small></p>
      <a class="btn btn--orchid" href="${href('/loyalty-program/')}">Join and get ${loyalty.bonus} points${icon('arrow')}</a>
    </div>
  </div>
</section>`;
}

function fourSeasons() {
  return `<section class="band band--tight seasonsband">
  <div class="wrap">
    <div class="band__head band__head--split" data-reveal>
      <div>${kicker('Upstate, all year')}${dh('Open every day. *Every season.*', 'dh--lg')}</div>
      <p>The south end of Lake Champlain runs on four seasons and a fifth one called mud. We’re open 10am–8pm through all of them.</p>
    </div>
    ${seasons([
      { id: 'spring', name: 'Spring', icon: 'flower', img: 'season-spring', line: 'Mud season on Broadway. Wipe your boots and come on in.' },
      { id: 'summer', name: 'Summer', icon: 'sun', img: 'season-summer', line: 'Lake days, long light, and a front door that’s open till 8.' },
      { id: 'autumn', name: 'Fall', icon: 'maple', img: 'season-autumn', line: 'Leaf peepers welcome. The maples do the showing off.' },
      { id: 'winter', name: 'Winter', icon: 'snow', img: 'season-winter', line: 'Snow on Broadway, lights on inside. Delivery when the roads say stay home.' },
    ])}
  </div>
</section>`;
}

function neighbors() {
  return `<section class="band neighbors" id="reviews">
  <div class="wrap neighbors__grid">
    <div class="neighbors__head" data-reveal>
      ${kicker('From our neighbors')}
      ${dh('Leave with exactly what you *came for.*', 'dh--lg')}
      <p class="lede">Six Google reviews the shop shares on its own site, word for word. Drag, swipe or use the arrows.</p>
      <a class="btn btn--ghost" href="${href('/reviews/')}">Read all reviews${icon('arrow')}</a>
    </div>
    <div data-reveal="right">${reviewDeck()}</div>
  </div>
</section>`;
}

function nights() {
  const guides = [
    ['Your first visit', 'What to bring, how to order, how to pay.', '/learn/first-visit/', 'id'],
    ['Cannabis products', 'Flower to topicals, in plain words.', '/learn/cannabis-products/', 'leaf'],
    ['Strain types', 'Indica, sativa, hybrid and terpenes.', '/learn/strain-types/', 'spark'],
    ['New York cannabis laws', 'The rules that matter at the counter.', '/learn/new-york-cannabis-laws/', 'check'],
  ];
  return `<section class="band nights band--night-2">
  <div class="wrap nights__grid">
    <a class="nights__events" href="${href('/events/')}" data-reveal="left">
      ${img('events-stage', { decorative: true, sizes: '(max-width: 900px) 92vw, 600px', min: 900 })}
      <span class="nights__over"><span class="kicker">Music &amp; pop-up nights</span><span class="dh dh--md">The amp is warm. <em>The door’s open.</em></span><span class="nights__s">Occasional music and brand pop-ups at both stores. Dates go up on Instagram first.</span><span class="btn btn--lamp btn--sm">See events${icon('arrow')}</span></span>
    </a>
    <div class="nights__learn" data-reveal="right">
      ${kicker('Learn with us')}
      ${dh('New here? *Start here.*', 'dh--md')}
      <ul class="guides">${guides.map(([t, s, to, ic], i) => `<li style="--i:${i}"><a href="${href(to)}"><span class="guides__ic">${icon(ic)}</span><span><b>${t}</b><small>${s}</small></span>${icon('arrow')}</a></li>`).join('')}</ul>
      <a class="nights__blog" href="${href('/blog/')}">Read the blog${icon('arrow')}</a>
    </div>
  </div>
</section>`;
}

function aboutFaq() {
  const faq = [
    { q: 'What do I need to bring?', a: 'A valid government-issued photo ID. You must be 21 or older to shop, in store and for delivery.' },
    { q: 'What are your hours?', a: 'Both stores are open every day, 10am–8pm. Same-day delivery runs 11am–7pm.' },
    { q: 'Do you deliver?', a: 'Yes. Same-day delivery from Whitehall and Menands, free per each store’s menu. Order on the [live menu](/whitehall/) and check your address at checkout. [How delivery works](/delivery/).' },
    { q: 'How can I pay?', a: 'Whitehall: Pay by Phone, Debit Card, Pay by Bank or Cash. Menands: Debit Card, Pay by Bank or Cash.' },
    { q: 'Do you really price match?', a: 'Yes: “We price match guarantee with ANY recreational dispensary in the Capitol Region!” Ask us at the counter or call the store. [Deals & price match](/deals/).' },
    { q: 'How do Rewards work?', a: 'Join for 50 points. Earn 1 to 1.75 points per $1 by tier; 100 points take $5 off a $6+ purchase and 250 points take $15 off $16+. [See the tiers](/loyalty-program/).' },
  ];
  return `<section class="band band--paper aboutfaq">
  <div class="wrap aboutfaq__grid">
    <div class="aboutfaq__about" data-reveal>
      ${kicker('About Northern Lights')}
      ${dh('Family-owned, in *Whitehall* and Menands.', 'dh--md')}
      ${brand.about.map((p) => `<p>${esc(p)}</p>`).join('')}
      <div class="ctarow"><a class="btn btn--ghost" href="${href('/about-us/')}">Our story${icon('arrow')}</a></div>
    </div>
    <div class="aboutfaq__faq" data-reveal="right">
      ${kicker('Good questions')}
      ${faqList(faq, 1)}
      <a class="aboutfaq__more" href="${href('/faq/')}">All FAQs${icon('arrow')}</a>
    </div>
  </div>
</section>`;
}

export function pages() {
  return [{
    path: '/', type: 'home',
    title: 'Northern Lights Dispensary | Whitehall & Menands, NY',
    description: 'Family-owned cannabis dispensary on Broadway in Whitehall, NY, with a sister store in Menands near Albany. Open daily 10am–8pm, same-day delivery, price match.',
    jsonld: [orgLd(), ...stores.map(storeLd)],
    main: hero() + choose() + shelves() + livingRoom() + deals() + rewards() + fourSeasons() + neighbors() + nights() + aboutFaq(),
  }];
}

// the home bands, for the design-lab pages (src/pages/lab-*.mjs) that try other heroes above the same page
export const sections = { hero, choose, shelves, livingRoom, deals, rewards, fourSeasons, neighbors, nights, aboutFaq };
export const homeJsonld = () => [orgLd(), ...stores.map(storeLd)];
