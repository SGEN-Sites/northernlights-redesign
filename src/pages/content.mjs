// content.mjs: Learn (hub + guides), the blog (hub + posts), the FAQ and the brands we carry.
// Copy: src/content/learn.mjs (written to private/CONTENT-CONTRACT.md) and the live menus' brand lists.
import { esc, href, img, icon, inline } from '../lib/html.mjs';
import { pageHero, blocks, faqList, kicker, dh, catGrid, floatObj } from '../lib/parts.mjs';
import { brand, stores, brandsCarried, sharedCats } from '../content/site.mjs';
import * as L from '../content/learn.mjs';

const GUIDE_IMG = { '/learn/first-visit/': 'living-room', '/learn/cannabis-products/': 'learn-bud', '/learn/strain-types/': 'season-spring', '/learn/new-york-cannabis-laws/': 'canal-golden' };
const GUIDE_IC = { '/learn/first-visit/': 'id', '/learn/cannabis-products/': 'leaf', '/learn/strain-types/': 'spark', '/learn/new-york-cannabis-laws/': 'check' };
const POST_IMG = { Delivery: 'delivery-road', Seasons: 'season-autumn', Rewards: 'lake-dawn', Guides: 'canal-golden' };
const postImg = (p) => (/price-match/.test(p.slug) ? 'city-river' : POST_IMG[p.tag] || 'hero-aurora');
const date = (s) => new Date(s + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const words = (bl) => bl.map((b) => [b.text, ...(b.items || []).map((i) => (typeof i === 'string' ? i : `${i.q} ${i.a} ${i.label || ''}`))].join(' ')).join(' ').split(/\s+/).length;

const crumbsFor = (...xs) => [{ label: 'Home', href: '/' }, ...xs];
// a reading page: sticky table of contents from the h2s, the prose, a related rail
function reading({ p, crumbs, image, related = [], aside = '' }) {
  const toc = (p.blocks || []).filter((b) => b.t === 'h2').map((b, i) => ({ id: 's' + (i + 1), text: b.text }));
  let n = 0;
  const body = blocks(p.blocks).replace(/<h2 class="prose__h2">/g, () => `<h2 class="prose__h2" id="s${++n}">`);
  return pageHero({ kicker: p.kicker, h1: p.h1, lede: p.lede, image, crumbs }) + `
<section class="band band--tight read">
  <div class="wrap read__grid">
    <aside class="read__toc" aria-label="On this page">${toc.length > 2 ? `<p class="read__tt">On this page</p><ol>${toc.map((t) => `<li><a href="#${t.id}">${inline(t.text)}</a></li>`).join('')}</ol>` : ''}${aside}</aside>
    <article class="prose read__body">${body}</article>
  </div>
</section>
${related.length ? `<section class="band band--night-2 band--tight"><div class="wrap"><div class="band__head" data-reveal>${kicker('Keep reading')}</div><ul class="cards3">${related.map(card).join('')}</ul></div></section>` : ''}`;
}
const card = (x, i = 0) => `<li class="pcard" data-reveal style="--d:${i * 80}"><a href="${href(x.slug)}"><span class="pcard__img">${img(x.img || postImg(x), { decorative: true, sizes: '(max-width: 760px) 92vw, 380px', min: 700 })}</span><span class="pcard__body"><small>${esc(x.tag || x.kicker || '')}${x.minutes ? ` · ${x.minutes} min read` : ''}</small><b>${esc(x.h1 || x.title)}</b><span>${esc(x.lede || x.description || '')}</span></span></a></li>`;

function learnHub() {
  const c = L.learnHub;
  return {
    path: '/learn/', type: 'learn', title: c.title, description: c.description, crumbs: crumbsFor({ label: 'Learn', href: '/learn/' }),
    main: pageHero({ kicker: c.kicker, h1: c.h1, lede: c.lede, image: 'learn-bud', crumbs: crumbsFor({ label: 'Learn', href: '/learn/' }) }) + `
<section class="band band--tight">
  <div class="wrap">
    <ul class="glist">${L.guides.map((g, i) => `<li data-reveal style="--d:${i * 80}"><a class="gcard" href="${href(g.slug)}"><span class="gcard__ic">${icon(GUIDE_IC[g.slug] || 'spark')}</span><span class="gcard__n">0${i + 1}</span><b>${esc(g.h1)}</b><span>${esc(g.lede)}</span><span class="gcard__go">Read the guide${icon('arrow')}</span></a></li>`).join('')}</ul>
    <div class="prose prose--wide learn__intro" data-reveal>${blocks(c.blocks)}</div>
  </div>
</section>
<section class="band band--night-2 band--tight">
  <div class="wrap"><div class="band__head band__head--split" data-reveal><div>${kicker('From the blog')}${dh('Notes from *Broadway.*', 'dh--md')}</div><p><a class="btn btn--ghost" href="${href('/blog/')}">All posts${icon('arrow')}</a></p></div><ul class="cards3">${L.posts.slice(0, 3).map(card).join('')}</ul></div>
</section>`,
  };
}

function guide(g, i) {
  const crumbs = crumbsFor({ label: 'Learn', href: '/learn/' }, { label: g.h1, href: g.slug });
  const others = L.guides.filter((x) => x.slug !== g.slug).map((x) => ({ ...x, img: GUIDE_IMG[x.slug], tag: 'Guide' }));
  const faqs = (g.blocks || []).filter((b) => b.t === 'faq').flatMap((b) => b.items);
  return {
    path: g.slug, type: 'guide', title: g.title, description: g.description, crumbs, ogType: 'article',
    jsonld: faqs.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '') } })) }] : [],
    main: reading({ p: g, crumbs, image: GUIDE_IMG[g.slug] || 'learn-bud', related: others.slice(0, 3), aside: g.slug === '/learn/cannabis-products/' ? '' : `<div class="read__shop glass"><p>Ready to shop?</p>${stores.map((s, k) => `<a class="btn ${k ? 'btn--ghost' : 'btn--teal'} btn--sm" href="${href(s.menuPage)}">${esc(s.city)} menu${icon('bag')}</a>`).join('')}</div>` }),
  };
}

function blogHub() {
  const tags = [...new Set(L.posts.map((p) => p.tag))];
  return {
    path: '/blog/', type: 'blog', title: 'The Northern Lights Blog | Northern Lights', description: 'Notes from Broadway: same-day delivery, the price match, Rewards and a year at the south tip of Lake Champlain, from the Whitehall and Menands stores.',
    crumbs: crumbsFor({ label: 'Blog', href: '/blog/' }),
    main: pageHero({ kicker: 'The Northern Lights blog', h1: 'Notes from *Broadway.*', lede: 'Plain-spoken posts from our Whitehall and Menands stores: how delivery, the price match and Rewards work, and what a year at the south tip of Lake Champlain looks like.', image: 'season-autumn', crumbs: crumbsFor({ label: 'Blog', href: '/blog/' }), variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap">
    <div class="chips blog__filter" data-filter-group="posts" role="group" aria-label="Filter posts"><button class="chip2" type="button" data-filter="all" aria-pressed="true">All</button>${tags.map((t) => `<button class="chip2" type="button" data-filter="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div>
    <ul class="cards3 blog__list" id="posts">${L.posts.map((p, i) => card(p, i).replace('<li class="pcard"', `<li class="pcard" data-tags="${esc(p.tag)}"`)).join('')}</ul>
  </div>
</section>`,
  };
}

function post(p) {
  const crumbs = crumbsFor({ label: 'Blog', href: '/blog/' }, { label: p.h1, href: p.slug });
  const others = L.posts.filter((x) => x.slug !== p.slug);
  return {
    path: p.slug, type: 'post', title: p.title, description: p.description, crumbs, ogType: 'article',
    jsonld: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.h1, description: p.description, datePublished: p.date, author: { '@type': 'Organization', name: brand.name }, publisher: { '@type': 'Organization', name: brand.name } }],
    main: reading({ p: { ...p, kicker: `${p.tag} · ${date(p.date)} · ${p.minutes} min read` }, crumbs, image: postImg(p), related: others.slice(0, 3) }),
  };
}

function faq() {
  const c = L.faq;
  const all = c.groups.flatMap((g) => g.items);
  return {
    path: '/faq/', type: 'faq', title: c.title, description: c.description, crumbs: crumbsFor({ label: 'FAQ', href: '/faq/' }),
    jsonld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: all.map((f) => ({ '@type': 'Question', name: f.q.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '') } })) }],
    main: pageHero({ kicker: c.kicker, h1: c.h1, lede: c.lede, image: 'living-room', crumbs: crumbsFor({ label: 'FAQ', href: '/faq/' }), variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap faqpage">
    <nav class="faqpage__nav" aria-label="FAQ topics"><ol>${c.groups.map((g, i) => `<li><a href="#faq-${i + 1}">${esc(g.title)}</a></li>`).join('')}</ol></nav>
    <div class="faqpage__groups">${c.groups.map((g, i) => `<div class="faqpage__grp" id="faq-${i + 1}" data-reveal><h2 class="dh dh--sm">${esc(g.title)}</h2>${faqList(g.items, i === 0 ? 1 : 0)}</div>`).join('')}</div>
  </div>
</section>`,
  };
}

function brands() {
  const both = brandsCarried.whitehall.filter((b) => brandsCarried.menands.some((m) => m.toLowerCase() === b.toLowerCase() || m.toLowerCase().replace(/s$/, '') === b.toLowerCase().replace(/s$/, '')));
  const wall = (list, cls) => `<ul class="bwall ${cls}">${list.map((b, i) => `<li style="--i:${i % 9}">${esc(b)}</li>`).join('')}</ul>`;
  return {
    path: '/brands/', type: 'brands', title: 'Cannabis Brands We Carry | Northern Lights', description: 'The brands on the Northern Lights Whitehall and Menands menus, from New York craft growers to familiar names. Browse by brand on each store’s live menu.',
    crumbs: crumbsFor({ label: 'Brands we carry', href: '/brands/' }),
    main: pageHero({ kicker: 'Brands we carry', h1: 'New York brands on *our shelves.*', lede: 'The brands listed on each store’s menu when we last checked (November 16, 2026). Shelves change; the live menu is always the final word.', image: 'learn-bud', crumbs: crumbsFor({ label: 'Brands we carry', href: '/brands/' }), variant: 'phero--short', cta: `<div class="ctarow">${stores.map((s, i) => `<a class="btn ${i ? 'btn--ghost' : 'btn--teal'}" href="${href(s.menuPage + 'brands/')}">Shop by brand at ${esc(s.city)}${icon('bag')}</a>`).join('')}</div>` }) + `
<section class="band band--tight">
  <div class="wrap brands">
    ${stores.map((s) => `<div class="brands__grp" data-reveal><div class="brands__head"><h2 class="dh dh--sm">${esc(s.city)} <small>${brandsCarried[s.id].length} brands</small></h2><a class="btn btn--ghost btn--sm" href="${href(s.menuPage + 'brands/')}">Browse on the ${esc(s.city)} menu${icon('arrow')}</a></div>${wall(brandsCarried[s.id], 'bwall--' + s.id)}</div>`).join('')}
    <p class="brands__note">Brand names as listed on each store’s menu. Carrying a brand doesn’t mean every product from it is in stock; check the live menu.</p>
  </div>
</section>`,
  };
}

export function pages() {
  return [learnHub(), ...L.guides.map(guide), blogHub(), ...L.posts.map(post), faq(), brands()];
}
