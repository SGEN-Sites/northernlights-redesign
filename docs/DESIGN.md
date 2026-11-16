# Design: "Lights on Broadway"

A warm, grounded, community-first redesign for Northern Lights Dispensary: Whitehall and the North Country, not outer
space. The aurora glows over the south end of Lake Champlain; inside, a red clapboard building on Broadway feels like a
jam-band living room in a village general store. Whitehall shines first; Menands, its sister store near Albany, is the
second point of light on the same map.

## Brand, kept and elevated

| element | live site | redesign |
|---|---|---|
| night sky | navy `#071528` (measured) | the base plane, with deeper `#030a14` and raised `#0f2747` steps |
| glow | teal `#52EBC8`, orchid `#D369FF` (measured) | teal = Whitehall, primary buttons; orchid = Menands, Rewards |
| aurora badge | round badge, spike motif, NL monogram | its spikes drawn live as the aurora (canvas + the WebGL curtain); the monogram on the 21+ gate (the 3D coin was tried and dropped by the owner, round 3) |
| aurora strip | gradient topbar | kept as the topbar; the same gradient fills one accent word per heading |
| display face | Vallejo Black (commercial) | Merriweather Black at its narrowest width and display optical size (open licence), the closest open match to the logo's heavy "NORTHERN LIGHTS"; true-italic accent words. The owner's pick from the font lab (round 5; Fraunces before; the lab is archived in `private/labs-archive/`) |
| body face | Futura Book (commercial) | Jost (open licence, Futura-inspired) |
| eyebrows | Roboto Slab 700 (the logo's "DISPENSARY") | Roboto Slab bold, tracked .26em, like the logo's "· DISPENSARY ·" |

## Three planes

1. **Night**: navy bands, the live aurora canvas, starfields, the living map.
2. **Lamplight**: inside the store (amber, lamp, clapboard red, wood); the living-room band, events, the paper band.
3. **Glass**: selective frosted panels over imagery (gate, switcher, store cards, sticky bar, mega menus).

## Signature moments

- Hero (option A, the owner's pick): the aurora over the lake (still + generated 5 s loop) under a live WebGL aurora
  curtain (`src/scripts/aurora-gl.js`, an original build) whose hem dips toward the pointer; copy only, no framed art.
  Options B "Aurora Stage", C "Two Lights" and D "Orbit" were built for comparison and are archived in
  `private/labs-archive/` (restore by moving the three files back into src/).
- No framed photo containers (owner, round 3): no arches, rings, crowns, medallions, polaroids or tape. Photos are
  plain, softly rounded and lit by the scene around them; cards are flush (photo on top, details below, nothing
  overlapping; owner, round 4).
- Storefronts (round 5): the client's two store photos re-made at the owner's request as cinematic AI edits (no people,
  third-party signs removed, blue hour / dusk; the building, its signs and their text kept). Labelled `ai: edited` and
  IPTC `compositeWithTrainedAlgorithmicMedia`.
- The store switcher (home "Where are you shopping today?" and `/locations/`, owner round 5): the living map is the
  switcher. Tap a light, its label or a tab, and that store becomes the visitor's store (header chip, sticky bar, every
  Shop link), and its storefront fills a tall 3:4 frame beside its details (hours, delivery, curbside, payment, phone,
  directions). Both panels are in the HTML; `html[data-store]` picks one before first paint. The Locations page follows
  it with the delivery and "which store is closer" image tiles.
- One living map: the Upper Hudson, Lake George and the south end of Lake Champlain drawn from real coordinates; the
  Champlain Canal; the two stores as points of light; Whitehall lights first and the light travels down to Menands.
- Category tiles: AI product cut-outs on one shared baseline (fixed image stage, `object-fit: contain`), each opening the live menu on that shelf.
- Seamless night bands; glowing-wave dividers at every tone change and chapter break (`src/lib/dividers.mjs`, `src/scripts/waves.js`: an original WebGL crest in teal, blue and violet that lifts toward the pointer, at most 5 live per page, a static SVG copy otherwise), colour-matched across each seam; and an aurora ribbon carrying the stores' own lines into the living room.
- The living room: the interior as a plain, lamp-lit picture, with the guitar and a pothos floating out of it.
- Splash options (`/splash-options/`, noindex; owner to pick): 1 Aurora Ignition (the badge's spikes rise, the
  wordmark resolves, the night lifts away), 2 Two Lights (Whitehall lights, a point runs the route to Menands, an
  aurora wash), 3 Badge Reveal (the badge draws itself, an iris opens). Try-out only (`?splash=1|2|3`, the switcher,
  `?splash=off`); never under reduced motion; skippable; hands off to the 21+ gate. To ship one: set `LIVE` in
  `src/scripts/splash.js` (once per session) and add `||!sessionStorage.getItem('nl.splashed')` to the head line.
- Rewards: the four real tiers as rising aurora rays.
- Four seasons: staggered cards with the shop's own humor.

## Motion

Reveal on scroll, split-word headings, parallax (`data-depth`), magnetic buttons (fine pointers only), the aurora
curtain, the glowing waves, the aurora ribbon, the map thread, the review deck, and a reactive layer: the aurora follows the pointer and
the scroll, cards light up under the pointer, the hero layers move against the pointer, a scroll-progress aurora line. Everything is visible without JS and still under
`prefers-reduced-motion` (the canvas draws one frame, loops never load).

## Store system

Whitehall is the default everywhere. Choosing a store (gate step 2, header chip, store cards, the shelves toggle, the
sticky bar) retargets every Shop, Specials and category link, the phone, directions and today's hours. A category a
store does not carry keeps pointing at the store that does (Orals: Whitehall; CBD and Apparel: Menands).
