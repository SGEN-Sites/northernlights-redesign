# Northern Lights Dispensary: website redesign concept ("Lights on Broadway")

A complete redesign concept for [northernlightsdispo.com](https://northernlightsdispo.com), prepared for Northern Lights
Dispensary (Whitehall and Menands, New York). **This is a pitch preview, not the live site.**

**Preview:** https://sgen-sites.github.io/northernlights-redesign/ (noindex). Every Shop and category button opens the
store's own live menu, already on that shelf, with its products and cart.

## What is in it

- 78 HTML files: the live site's pages at their live URLs (home, /whitehall/, /menands/, /loyalty-program/,
  /contact/, /policies/, /vendor-intake/; the six testimonial posts now redirect to /reviews/), plus the page types of a
  full regional dispensary site: a live-menu page for every category each store carries, specials and brands per store,
  Shop and Deals, a page per store, Locations, Same-day Delivery, Areas We Serve (16 town pages), Rewards, Events,
  Learn (4 guides), a blog, FAQ, Reviews, Brands We Carry, About, Careers and an HTML site map.
- "Lights on Broadway": the aurora over the south end of Lake Champlain, the red clapboard store on Whitehall's
  Broadway, the jam-band living room inside, and the two stores drawn as connected points of light on one living map,
  Whitehall first, in the brand's own navy, teal and orchid (see `docs/DESIGN.md`).
- Pick **Whitehall** (the default) or **Menands** anywhere (21+ gate, header chip, store cards, sticky store bar with
  Shop now, Call, Directions and today's hours); every Shop, Specials and category button follows that choice.
- Every visible fact traces to the live site, the stores' own menus or the owner's brief, recorded in
  `facts/client-facts.json`. New pages are written from those facts only; open questions are in `docs/PITCH-NOTES.md`.

## Build

Node 18+ and nothing else: no framework, no dependencies.

```bash
node src/build.mjs                                                                   # dist/ (production URLs)
node src/build.mjs --preview --out dist-preview --base /northernlights-redesign/     # the Pages preview (noindex)
```

## Verification on record

| check | result | evidence |
|---|---|---|
| every Shop, Specials and category destination shows products, prices and a working cart | 29/29 pass | `audit/menu-verification.json` |
| site-reforge gate | 12 pass, 2 fail, 15 unproven | `audit/gate.json`, `docs/PUBLISH.md` |
| the live preview: pages answer 200 with noindex; gate, store switch and sticky bar work | 11/13 pass | `audit/preview-smoke.json` |

## Imagery and marks

25 images are AI-generated mood scenes and product-category illustrations (no people, no real storefronts): each
carries `data-ai="generated"` on the page and IPTC "trainedAlgorithmicMedia" in its metadata, and is labelled as an
illustration in its alt text. 2 client photos were enlarged with an AI upscaler (no content change) and carry
"compositeWithTrainedAlgorithmicMedia". The hero loop is generated from the hero illustration. Everything else is the
client's own artwork. Northern Lights names, marks, photography and copy belong to their owner.
