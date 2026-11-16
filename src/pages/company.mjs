// company.mjs: about, reviews, events, careers, contact, vendor intake, Rewards (the live site's /loyalty-program/)
// and policies (verbatim). Copy: the live capture (facts/client-facts.json) and src/content/places.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, href, img, icon, inline, brandImg } from '../lib/html.mjs';
import { pageHero, blocks, faqList, kicker, dh, tiers, reviewDeck, floatObj, light, statusSpan } from '../lib/parts.mjs';
import { storeCard, orgLd } from '../lib/layout.mjs';
import { livingMap } from '../lib/map.mjs';
import { brand, stores, loyalty, reviews } from '../content/site.mjs';
import * as P from '../content/places.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const POL = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/policies.json'), 'utf8'));
const crumbsFor = (...xs) => [{ label: 'Home', href: '/' }, ...xs];

function about() {
  const c = P.about;
  const cr = crumbsFor({ label: 'About us', href: '/about-us/' });
  return {
    path: '/about-us/', type: 'about', title: 'About Northern Lights Dispensary | Whitehall & Menands', description: 'Northern Lights is a family-owned, adult-use cannabis retailer on Broadway in Whitehall, NY, with a sister store in Menands. Fair prices, reliable service, community.',
    crumbs: cr, jsonld: [orgLd()],
    main: pageHero({ kicker: 'About Northern Lights', h1: 'Family-owned, *lit from Broadway.*', lede: 'A neighborhood dispensary at the south tip of Lake Champlain, and its sister store just off I-787 near Albany.', image: 'canal-golden', crumbs: cr }) + `
<section class="band band--tight">
  <div class="wrap twocol twocol--about">
    <div class="prose" data-reveal>
      <h2 class="prose__h2">In our own words</h2>
      ${brand.about.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${blocks(c.story)}
    </div>
    <aside class="about__art about__art--map" data-reveal="right">
      ${livingMap({ id: 'about-top' })}
    </aside>
  </div>
</section>
<section class="band band--night-2 band--tight">
  <div class="wrap">
    <div class="band__head band__head--center" data-reveal>${kicker('What we stand for')}${dh('Fair prices. Reliable service. *Community.*', 'dh--md')}</div>
    <ul class="values">${c.values.map((v, i) => `<li class="value glass" data-reveal style="--d:${i * 100}"><span class="value__n">0${i + 1}</span><h3>${inline(v.title)}</h3><p>${inline(v.text)}</p></li>`).join('')}</ul>
  </div>
</section>
<section class="band band--tight">
  <div class="wrap twocol">
    <div class="about__two" data-reveal>${kicker('Two stores, one family')}${dh('Whitehall first, *Menands close behind.*', 'dh--md')}<div class="about__stores">${stores.map((s) => storeCard(s)).join('')}</div></div>
  </div>
</section>`,
  };
}

function reviewsPage() {
  const cr = crumbsFor({ label: 'Reviews', href: '/reviews/' });
  return {
    path: '/reviews/', type: 'reviews', title: 'Customer Reviews | Northern Lights Dispensary', description: 'Google reviews of Northern Lights Dispensary, shared word for word on our site: friendly budtenders, fair prices and a chill, welcoming shop in Whitehall and Menands.',
    crumbs: cr,
    main: pageHero({ kicker: 'Reviews', h1: 'What the *neighbors* say.', lede: 'Six Google reviews the shop republished on its own site, shown word for word.', image: 'living-room', crumbs: cr, variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap">
    <ul class="rgrid">${reviews.map((r, i) => `<li class="rgrid__i" id="${r.id}" data-reveal style="--d:${(i % 3) * 90}"><figure class="rcard rcard--flat"><div class="rcard__stars" aria-label="Google review">★★★★★<span>Google review</span></div><blockquote><p>${esc(r.text)}</p></blockquote><figcaption><span class="rcard__av" aria-hidden="true">${esc(r.name[0])}</span><b>${esc(r.name)}</b><small>as published on our site</small></figcaption></figure></li>`).join('')}</ul>
    <p class="rgrid__note">Reviews are shown as the shop published them in March 2026; they don’t name which store each one is about.</p>
  </div>
</section>`,
  };
}

function eventsPage() {
  const c = P.events; const cr = crumbsFor({ label: 'Events', href: '/events/' });
  return {
    path: '/events/', type: 'events', title: c.title, description: c.description, crumbs: cr,
    main: pageHero({ kicker: c.kicker, h1: c.h1, lede: c.lede, image: 'events-stage', crumbs: cr, cta: `<div class="ctarow">${brand.social.map((s, i) => `<a class="btn ${i ? 'btn--ghost' : 'btn--lamp'}" href="${esc(s.href)}" target="_blank" rel="noopener">Follow on ${esc(s.name)}${icon(s.icon)}</a>`).join('')}</div>` }) + `
<section class="band band--tight">
  <div class="wrap twocol">
    <div class="prose" data-reveal>${blocks(c.blocks)}</div>
    <aside class="events__art" data-reveal="right">${floatObj('cut-guitar', 'events__guitar', '-0.1')}<div class="events__card glass"><p class="kicker">Next night</p><p class="events__big">Watch Instagram</p><p>Dates go up on our social pages first. No dates are listed here because none are posted yet.</p><a class="btn btn--lamp btn--sm" href="${esc(brand.social[0].href)}" target="_blank" rel="noopener">@northernlightsny${icon('arrow-ne')}</a></div></aside>
  </div>
</section>`,
  };
}

function careers() {
  const c = P.careers; const cr = crumbsFor({ label: 'Careers', href: '/careers/' });
  return {
    path: '/careers/', type: 'careers', title: c.title, description: c.description, crumbs: cr,
    main: pageHero({ kicker: c.kicker, h1: c.h1, lede: c.lede, image: 'living-room', crumbs: cr, variant: 'phero--short', cta: `<div class="ctarow"><a class="btn btn--teal" href="${href('/contact/')}">Get in touch${icon('arrow')}</a></div>` }) + `
<section class="band band--tight"><div class="wrap"><div class="prose prose--wide" data-reveal>${blocks(c.blocks)}</div></div></section>`,
  };
}

const field = (f) => {
  const id = 'f-' + f.name;
  if (f.type === 'select') return `<label class="fld fld--full" for="${id}"><span>${esc(f.label)}${f.req ? ' <i>(Required)</i>' : ''}</span><select id="${id}" name="${f.name}"${f.req ? ' required' : ''}>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>`;
  if (f.type === 'textarea') return `<label class="fld fld--full" for="${id}"><span>${esc(f.label)}${f.req ? ' <i>(Required)</i>' : ''}</span><textarea id="${id}" name="${f.name}" rows="5"${f.req ? ' required' : ''}></textarea></label>`;
  return `<label class="fld${f.full ? ' fld--full' : ''}" for="${id}"><span>${esc(f.label)}${f.req ? ' <i>(Required)</i>' : ''}</span><input id="${id}" name="${f.name}" type="${f.type || 'text'}" autocomplete="${f.ac || 'off'}"${f.req ? ' required' : ''}></label>`;
};
const form = (fields, submit) => `<form class="form glass" data-demo-form novalidate>${fields.map(field).join('')}<div class="form__foot"><button class="btn btn--teal" type="submit">${esc(submit)}${icon('arrow')}</button><p class="form__msg" data-demo-msg hidden>Thanks! This is a design preview, so the form isn’t connected yet. Email <a href="mailto:${brand.email}">${brand.email}</a> in the meantime.</p></div></form>`;

function contact() {
  const cr = crumbsFor({ label: 'Contact', href: '/contact/' });
  return {
    path: '/contact/', type: 'contact', title: 'Contact Northern Lights | Whitehall & Menands, NY', description: 'Call, email or message Northern Lights Dispensary in Whitehall or Menands, NY. Open every day 10am–8pm, with same-day delivery from both stores.',
    crumbs: cr,
    main: pageHero({ kicker: 'Contact', h1: 'Any questions? *Let’s talk.*', lede: 'Reach the store you shop at, or send a general note. We read every message.', image: 'lake-dawn', crumbs: cr, variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap contact">
    <div data-reveal>${form([
      { name: 'first', label: 'First name', req: true, ac: 'given-name' }, { name: 'last', label: 'Last name', req: true, ac: 'family-name' },
      { name: 'email', label: 'Email', type: 'email', req: true, ac: 'email' }, { name: 'phone', label: 'Phone', type: 'tel', ac: 'tel' },
      { name: 'reason', label: 'How would you like to contact us?', type: 'select', req: true, options: ['Contact the Whitehall Dispensary', 'Contact the Menands Dispensary', 'General Contact'] },
      { name: 'message', label: 'Message', type: 'textarea', req: true },
    ], 'Send message')}</div>
    <aside class="contact__side" data-reveal="right">${stores.map((s) => storeCard(s)).join('')}<a class="contact__mail glass" href="mailto:${brand.email}">${icon('mail')}<span><small>Email</small><b>${brand.email}</b></span></a><a class="contact__mail glass" href="${href('/vendor-intake/')}">${icon('tag')}<span><small>Brands and vendors</small><b>Vendor intake form</b></span></a></aside>
  </div>
</section>`,
  };
}

function vendor() {
  const cr = crumbsFor({ label: 'Vendor intake', href: '/vendor-intake/' });
  return {
    path: '/vendor-intake/', type: 'contact', title: 'Vendor Intake | Northern Lights Dispensary', description: 'Licensed cannabis brands and vendors: introduce your company to Northern Lights in Whitehall and Menands, NY, with your licence number and links to your products.',
    crumbs: cr,
    main: pageHero({ kicker: 'Vendor intake', h1: 'Brands, *say hello.*', lede: 'Licensed brands and vendors can introduce themselves here. Tell us who you are and where to see your products; we’ll be in touch.', image: 'events-stage', crumbs: cr, variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap contact">
    <div data-reveal>${form([
      { name: 'company', label: 'Company name', req: true, full: true, ac: 'organization' },
      { name: 'first', label: 'First name', req: true, ac: 'given-name' }, { name: 'last', label: 'Last name', req: true, ac: 'family-name' },
      { name: 'email', label: 'Email', type: 'email', req: true, ac: 'email' }, { name: 'phone', label: 'Phone', type: 'tel', ac: 'tel' },
      { name: 'licence', label: 'License number, if applicable', full: true },
      { name: 'links', label: 'Company website and/or social media links', req: true, full: true, ac: 'url' },
    ], 'Submit')}</div>
    <aside class="contact__side" data-reveal="right"><div class="sinfo__box glass"><h2 class="sinfo__h">${icon('music')}Pop-ups</h2><p>Music and brand pop-up nights happen at both stores. Mention it if you’d like to host one. <a href="${href('/events/')}">About events</a></p></div><a class="contact__mail glass" href="mailto:${brand.email}">${icon('mail')}<span><small>Email</small><b>${brand.email}</b></span></a></aside>
  </div>
</section>`,
  };
}

function rewardsPage() {
  const cr = crumbsFor({ label: 'Rewards', href: '/loyalty-program/' });
  return {
    path: '/loyalty-program/', type: 'rewards', title: 'Rewards Program: 50 Points to Start | Northern Lights', description: 'Join Northern Lights Rewards for 50 points. Climb from Aurora to Borealis, Zenith and Northern Light, earn up to 1.75 points per $1 and save $5 or $15.',
    crumbs: cr,
    main: pageHero({ kicker: 'Northern Lights Rewards', h1: 'Receive *50 points* when you sign up.', lede: 'Begin in Aurora. Advance through Borealis and Zenith. Become a Northern Light. The more you spend, the more you earn.', image: 'hero-aurora', crumbs: cr, cta: `<div class="ctarow"><a class="btn btn--orchid btn--lg" href="#join">Join now${icon('arrow')}</a><a class="btn btn--ghost btn--lg" href="#terms">Read the terms${icon('arrow')}</a></div>` }) + `
<section class="band band--tight rewardsp">
  <div class="band__clip" aria-hidden="true"><canvas class="aurora-canvas" data-aurora="tiers"></canvas></div>
  <div class="wrap">${tiers()}
    <ul class="redeem" data-reveal>${loyalty.redeem.map((r) => `<li class="glass"><b>${r.pts}</b><span>points = <strong>${r.value}</strong> off a purchase of ${r.min} or more <small>(before tax)</small></span></li>`).join('')}<li class="glass redeem__rule"><span>${loyalty.rules.map(esc).join(' ')}</span></li></ul>
  </div>
</section>
<section class="band band--tight" id="join">
  <div class="wrap join">
    <div data-reveal>${kicker('Join Rewards')}${dh('Sign up in a minute, *start at 50.*', 'dh--md')}<p class="lede">Use the sign-up form here. Points are credited to your verified customer profile at either store.</p><p class="join__retro">${esc(loyalty.retro)}</p></div>
    <div class="join__frame glass" data-reveal="right"><iframe src="${esc(brand.loyaltyJoin)}" title="Northern Lights Rewards sign-up" loading="lazy"></iframe><p class="join__alt">Form not showing? <a href="${esc(brand.loyaltyJoin)}" target="_blank" rel="noopener">Open the sign-up page${icon('arrow-ne')}</a></p></div>
  </div>
</section>
<section class="band band--paper band--tight" id="terms">
  <div class="wrap">
    <div class="band__head" data-reveal>${kicker('Program terms')}${dh('Northern Lights Loyalty Program *Terms & Conditions*', 'dh--md')}</div>
    <div class="terms">
      <details open><summary>Eligibility${icon('plus')}</summary><p>Participation in the Northern Lights Loyalty Program is limited to customers who are 21 years of age or older and maintain a verified customer profile.</p></details>
      <details><summary>Enrollment${icon('plus')}</summary><p>Customers may enroll through approved Northern Lights channels.</p><p>Upon enrollment, participants will receive 50 bonus loyalty points.</p></details>
      <details><summary>Retroactive Points${icon('plus')}</summary><p>${esc(loyalty.retro)}</p></details>
      <details><summary>Earning Points${icon('plus')}</summary><p>Participants earn loyalty points on eligible purchases.</p><p>Point earning rates are determined by loyalty tier:</p><ul>${loyalty.tiers.map((t) => `<li><b>${esc(t.name)}</b>: Annual Spend: ${esc(t.spend)}. Earn ${esc(t.earn)} ${t.earn === '1' ? 'point' : 'points'} per $1 spent${t.bonus ? `. ${esc(t.bonus)}-point tier achievement bonus` : ''}.</li>`).join('')}</ul><p>Tier status is based on cumulative annual eligible purchases and is updated automatically.</p></details>
      <details><summary>Redeeming Points${icon('plus')}</summary><p>Participants may redeem points as follows:</p><ul><li>100 points may be redeemed for $5 in loyalty value toward a purchase of $6.00 or more (before tax).</li><li>250 points may be redeemed for $15 in loyalty value toward a purchase of $16.00 or more (before tax).</li></ul><p>Additional redemption rules:</p><ul>${loyalty.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul><p>Northern Lights reserves the right to modify redemption options, point values, or program requirements as necessary.</p></details>
      <details><summary>Program Changes${icon('plus')}</summary><p>Northern Lights may modify, suspend, or discontinue the Loyalty Program at any time, subject to applicable law.</p></details>
      <details><summary>Privacy${icon('plus')}</summary><p>Customer information collected through the Loyalty Program is governed by the Northern Lights Privacy Policy.</p></details>
      <details><summary>Required Notice${icon('plus')}</summary><p>Adult-use cannabis products are for use only by persons 21 years and older.</p><p>KEEP OUT OF REACH OF CHILDREN AND PETS.</p><p>Cannabis can impair concentration, coordination, and judgment. Do not operate a vehicle or machinery under the influence of cannabis.</p><p>Using cannabis in any form while pregnant or chest/breastfeeding may be harmful. There is no known safe amount of cannabis use during pregnancy.</p></details>
    </div>
  </div>
</section>`,
  };
}

function policies() {
  const cr = crumbsFor({ label: 'Policies', href: '/policies/' });
  return {
    path: '/policies/', type: 'policies', title: 'Policies | Northern Lights Dispensary', description: 'Northern Lights Dispensary policies: the end-user licence agreement for the Northern Lights NY app, the privacy policy and the website terms and conditions.',
    crumbs: cr,
    main: pageHero({ kicker: 'Policies', h1: 'Northern Lights *Dispensary*', lede: 'The EULA, privacy policy and terms, exactly as published on the current site.', image: 'lake-dawn', crumbs: cr, variant: 'phero--short' }) + `
<section class="band band--tight">
  <div class="wrap">
    <div class="terms terms--dark">${POL.sections.map((s, i) => `<details${i === 1 ? ' open' : ''}><summary>${esc(s.title)}${icon('plus')}</summary><div class="terms__body">${s.blocks.map((b) => (b.t === 'li' ? `<p class="terms__li">• ${esc(b.text)}</p>` : b.t === 'h' ? `<h3>${esc(b.text)}</h3>` : `<p>${esc(b.text)}</p>`)).join('')}</div></details>`).join('')}</div>
  </div>
</section>`,
  };
}

export function pages() {
  return [about(), reviewsPage(), eventsPage(), careers(), contact(), vendor(), rewardsPage(), policies()];
}
