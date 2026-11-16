// lab-splash.mjs: the splash options lab (round 3, lane S). The owner asked for "3 dynamic options for splash
// animation. Solid, Epic, Splash animations.": a short brand intro on a visitor's first page load that hands off to the
// 21+ gate. One noindex page, /splash-options/: a card per option (a still of its finished frame, Play here, Try it on
// the site) and how each hands off to the gate. The splashes are built and played by src/scripts/splash.js (any page
// plays one with ?splash=1|2|3, remembered for the session; ?splash=off clears it); styles in src/styles/splash.css
// (classes spl*, s1-s3*, spx*, spi*).
import { esc, href, icon } from '../lib/html.mjs';
import { pageHero } from '../lib/parts.mjs';
import { brand } from '../content/site.mjs';

const OPTS = [
  { k: 1, name: 'Aurora Ignition', tag: 'Cinematic', secs: '3.1',
    line: 'The badge’s aurora spikes rise one by one out of a dark horizon, then the whole night lifts away like a curtain.',
    beats: ['A line of light opens the horizon over the lake', 'Eighteen spikes rise in the brand gradient, shimmer, and reflect in the water', 'The crescent moon and the stars come on', 'The wordmark resolves under a sweep of light; “· Dispensary ·” letter-spaces in', 'The curtain lifts, its aurora hem sweeping up over the page'] },
  { k: 2, name: 'Two Lights', tag: 'The two stores', secs: '3.1',
    line: 'Whitehall lights first on a dark map of the North Country, and the light runs down to Menands.',
    beats: ['A night map: Lake Champlain, Lake George, the canal and the Hudson', 'Whitehall ignites in teal', 'A thread of aurora runs down the canal and the river to Menands, in orchid', 'Both bloom into a full-screen aurora wash, with the wordmark and “Whitehall · Menands”', 'The night goes, and the light dissolves into the page'] },
  { k: 3, name: 'Badge Reveal', tag: 'The badge', secs: '3.2',
    line: 'The round badge draws itself under drifting stars, the NL monogram glows at its heart, and an iris opens onto the page.',
    beats: ['A slow drift of stars', 'The ring draws; the aurora spikes fill in left to right; the moon and stars come on', 'The mountains and the lake ripples draw', 'The NL monogram glows at the centre', 'An iris opens from the badge; with the gate next, the monogram flies into the gate’s own'] },
];

// set in <head> when this page is opened in try-out mode (?splash=1|2|3, or remembered for the session), so its first
// paint is already the splash's night and nothing flashes before the splash (src/styles/splash.css fails it open)
export const splashHead = '<script>(function(r){try{var m=location.search.match(/[?&]splash=([^&#]*)/),v=m?m[1]:sessionStorage.getItem(\'nl.splash\');if(/^[123]$/.test(v)&&!matchMedia(\'(prefers-reduced-motion: reduce)\').matches)r.classList.add(\'splash-pending\');}catch(e){}})(document.documentElement);</script>';

function indexMain() {
  const card = (o) => `<li class="spi__card">
      <div class="spi__prev" data-splash-still="${o.k}" aria-hidden="true"><span class="spi__ph"></span></div>
      <div class="spi__body">
        <p class="spi__k"><b>${o.k}</b>${esc(o.tag)} · ${o.secs} s</p>
        <h2 class="spi__name">${esc(o.name)}</h2>
        <p class="spi__note">${esc(o.line)}</p>
        <ol class="spi__beats">${o.beats.map((b) => `<li>${esc(b)}</li>`).join('')}</ol>
        <div class="spi__acts">
          <button class="btn btn--teal btn--sm spi__play" type="button" data-splash-play="${o.k}">Play here${icon('play')}</button>
          <a class="btn btn--ghost btn--sm" href="${href(`/?splash=${o.k}`)}">Try it on the site${icon('arrow')}</a>
        </div>
        <p class="spi__rm">${icon('moon')}<span>Your device asks for reduced motion, so the splash does not play here; visitors with that setting go straight to the 21+ gate.</span></p>
      </div>
    </li>`;
  const step = (ico, b, t) => `<li>${icon(ico)}<span><b>${esc(b)}</b> ${esc(t)}</span></li>`;
  return pageHero({
    kicker: 'Design lab · not public',
    h1: 'Three splash intros, *one first light.*',
    lede: 'A splash is the short brand intro a visitor sees on the first page load of a visit. Each of these runs about three seconds, can be skipped at any moment, and then hands off to the 21+ gate, or straight to the page for a visitor who has already answered it.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Splash options', href: '/splash-options/' }],
    image: 'hero-aurora',
    variant: 'phero--short',
  }) + `<section class="band spi" aria-label="The three splash options">
  <div class="wrap">
    <ol class="spi__grid">${OPTS.map(card).join('')}</ol>
  </div>
</section>
<section class="band band--tight spi-hand" aria-labelledby="spi-hand-h">
  <div class="wrap spi-hand__in">
    <div class="band__head">
      <p class="kicker">The hand-off</p>
      <h2 class="dh dh--md" id="spi-hand-h">Then the <em>21+ gate.</em></h2>
      <p>“Try it on the site” plays the splash on every page you open until you close the switcher in the bottom-right corner; on the live site it would play once per visit. “Play here” shows it over this page as:</p>
      <div class="spi__as" role="group" aria-label="Play here as">
        <span>Play here as</span>
        <button type="button" data-splash-as="returning" aria-pressed="true">A returning visitor</button>
        <button type="button" data-splash-as="first" aria-pressed="false">A first-time visitor</button>
      </div>
    </div>
    <ol class="spi__steps">
      ${step('clock', 'Once per visit.', 'The splash plays on a visitor’s first page load of a session; every page after that opens straight away.')}
      ${step('id', 'First-time visitors.', `The 21+ gate waits, invisible, under the splash and rises as it leaves (in Badge Reveal the monogram flies into the gate’s own). Focus lands on “${brand.gate.yes}”.`)}
      ${step('check', 'Visitors who have answered.', 'The splash leaves straight onto the page, and the first screen’s own entrance plays as it goes.')}
      ${step('arrow', 'Skip any time.', 'A click or tap anywhere, any key (Esc), the mouse wheel, or the Skip button ends it at once.')}
      ${step('moon', 'Reduced motion.', 'Never shown to visitors who ask for reduced motion: they go straight to the gate.')}
    </ol>
  </div>
</section>`;
}

export function pages() {
  return [{
    path: '/splash-options/', type: 'page', noindex: true, bodyClass: 'spl-lab',
    title: `Splash options | ${brand.name}`,
    description: 'Design lab: three splash intros (Aurora Ignition, Two Lights, Badge Reveal), each handing off to the 21+ gate.',
    head: splashHead,
    main: indexMain(),
  }];
}
