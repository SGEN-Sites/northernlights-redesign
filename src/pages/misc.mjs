// misc.mjs: the HTML site map, the 404, and redirects that carry the live site's other URLs forward
// (its six testimonial posts now live on /reviews/; its author archive goes to /about-us/).
import { esc, href, icon } from '../lib/html.mjs';
import { pageHero, kicker, dh } from '../lib/parts.mjs';
import { stores, storeCats, catById, reviews, nav } from '../content/site.mjs';
import * as P from '../content/places.mjs';
import * as L from '../content/learn.mjs';

function sitemap() {
  const groups = [
    ['Shop', [['Shop (your store)', '/shop/'], ['Deals & price match', '/deals/'], ...stores.flatMap((s) => [[`${s.city} menu`, s.menuPage], ...storeCats[s.id].map((c) => [`${s.city}: ${catById(c).label}`, `/${s.id}/${c}/`]), [`${s.city}: Specials`, `/${s.id}/specials/`], [`${s.city}: Brands`, `/${s.id}/brands/`]]), ['Brands we carry', '/brands/']]],
    ['Locations', [['All locations', '/locations/'], ...stores.map((s) => [`${s.city}, ${s.region}`, s.page]), ['Same-day delivery', '/delivery/'], ['Areas we serve', '/dispensary-near/'], ...P.areas.towns.map((t) => [`${t.town}, ${t.state}`, t.slug])]],
    ['Learn', [['Learn hub', '/learn/'], ...L.guides.map((g) => [g.h1, g.slug]), ['Blog', '/blog/'], ...L.posts.map((p) => [p.h1, p.slug]), ['FAQ', '/faq/']]],
    ['Northern Lights', [['Home', '/'], ['About us', '/about-us/'], ['Reviews', '/reviews/'], ['Rewards', '/loyalty-program/'], ['Events', '/events/'], ['Careers', '/careers/'], ['Contact', '/contact/'], ['Vendor intake', '/vendor-intake/'], ['Policies', '/policies/']]],
  ];
  const cr = [{ label: 'Home', href: '/' }, { label: 'Site map', href: '/sitemap/' }];
  return {
    path: '/sitemap/', type: 'sitemap', title: 'Site Map | Northern Lights Dispensary', description: 'Every page on the Northern Lights Dispensary site: both stores’ live menus by category, locations, delivery, areas we serve, Learn, the blog, Rewards and more.',
    crumbs: cr,
    main: pageHero({ kicker: 'Site map', h1: 'Every page, *one list.*', image: 'lake-dawn', crumbs: cr, variant: 'phero--short' }) + `
<section class="band band--tight"><div class="wrap smap">${groups.map(([t, links]) => `<div class="smap__g"><h2 class="dh dh--sm">${esc(t)}</h2><ul>${links.map(([l, h]) => `<li><a href="${href(h)}">${esc(l)}</a></li>`).join('')}</ul></div>`).join('')}</div></section>`,
  };
}

function notFound() {
  return {
    path: '/404/', file: '404.html', type: 'notfound', noindex: true, title: 'Page not found | Northern Lights', description: 'This page drifted off with the northern lights.',
    main: pageHero({ kicker: 'Error 404', h1: 'This page drifted off *with the aurora.*', lede: 'The link may be old or mistyped. Try the menu, your store, or the home page.', image: 'hero-aurora', cta: `<div class="ctarow"><a class="btn btn--teal" href="${href('/')}">Home${icon('arrow')}</a><a class="btn btn--ghost" href="${href('/whitehall/')}">Whitehall menu${icon('bag')}</a><a class="btn btn--ghost" href="${href('/menands/')}">Menands menu${icon('bag')}</a></div>` }),
  };
}

export function pages() {
  return [
    sitemap(), notFound(),
    ...reviews.map((r) => ({ path: `/testimonial/${r.id}-google-reviews/`, redirect: `/reviews/#${r.id}`, title: `${r.name} | Google Reviews` })),
    { path: '/author/imcoffice/', redirect: '/about-us/', title: 'About Northern Lights' },
  ];
}
