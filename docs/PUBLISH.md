# Published preview

- **Preview (noindex):** https://sgen-sites.github.io/northernlights-redesign/
- **Repo:** https://github.com/SGEN-Sites/northernlights-redesign (`main` = source, docs, evidence; `gh-pages` = the preview)
- Round 1 published 2026-11-16 (main d116caa, gh-pages 7fa6153); round 1.1 the same morning with the final location,
  town and company copy.
- Round 2 (2026-11-16): polaroids and tape removed, aurora curtain hero, reactive layer, seamless bands.
- Round 3 (2026-11-16 12:12, main 5608bf4, gh-pages 2284fed): no framed photo containers, no coin, hero A kept, fixed
  category tiles, glowing-wave dividers, solid mega menus, hero options B–D at `/hero-options/`. Scan CLEAN, smoke
  12/12, menus 29/29 live.
- Round 4 (2026-11-16 12:35, main 56cf330, gh-pages 4404137): no eyebrow dashes, balanced deals bento, centred shelves
  line, flush store cards, full-width stacked CTAs on phones. Smoke 12/12 live.
- Round 5 (2026-11-16 14:04, main 03e4315, gh-pages b69575c): cinematic AI-edited storefront photos (no people, signs
  kept, labelled), the map store switcher on home and /locations/ (tap a light = set your store; tall storefront frame),
  the new Locations hub, the owner's "Logo match" fonts (Merriweather wdth 87 + Roboto Slab + Jost, self-hosted), three
  splash options at /splash-options/ (try-out only: ?splash=1|2|3); decided labs (hero B-D, fonts) archived.
  Checks: publish scan CLEAN, sr-decontaminate CLEAN, sweep 172/172 ok (43 pages x 4 widths), smoke 12/12 live,
  menus 29/29 live, store switcher driven in Chromium (map light / pin / tab), fonts measured (812 px at wdth 87).
  A docs-only republish followed (main bc3cdd4, gh-pages 41bc443).
- Round 6 (2026-11-16, main e1900b5, gh-pages c82b8c1): the owner's intro splash, option 2 "Two Lights", for every visitor
  once per session (never under reduced motion; `?splash=off` skips it); the options page archived. Checks: publish scan
  CLEAN, smoke 13/13 live (new: the splash plays first and hands off to the 21+ gate with focus on Yes), menus 29/29
  live, splash behaviour on the live URL for first visit (phone, desktop), returning visitor, menu-page landing,
  ?splash=off and reduced motion (private/splash-live.mjs).
- Round 6.1 (2026-11-16, main 1fe9508, gh-pages 7a60739): the owner's iPhone showed the hero's gradient accent word
  ("Broadway.") invisible. Cause: WebKit does not paint a parent's background-clip:text gradient through animated
  inline-block children, and the split-word reveal wrapped each word of the accent in one. Fix: the accent <em> rises as
  one piece (src/scripts/site.js) with a hair of padding for the italic overhang. Reproduced and verified in Playwright
  WebKit (0.0% -> 34% painted). publish.sh now also runs private/webkit-smoke.mjs (9/9 live: splash -> gate -> store,
  switcher by tab and map light, storefront photo, sticky bar, no errors) and private/webkit-accent.mjs. Smoke 13/13,
  menus 29/29 live.

## Checks on record

| check | result | evidence |
|---|---|---|
| Every Shop, Specials and category destination opens that store's live menu on that shelf (both stores, every category, specials, brands, /shop/ and /deals/ for each store), on the live preview | 29/29 | `audit/menu-verification.json` (`results`) |
| Products, prices and a working cart, in a real browser | Whitehall vapes and Menands edibles added to cart (cart shows the right store, subtotal and checkout); Menands specials, Whitehall brands, live-preview pre-rolls loaded | `audit/menu-verification.json` (`realBrowser`) |
| Every page on the live preview answers 200 with its own title and noindex; robots.txt disallows all | 70 pages, 7 redirects | `audit/preview-smoke.json` |
| Phone (390x844, touch): 21+ gate, Whitehall listed first, store pick closes it; sticky bar (Shop now, Call, Directions, today's hours) hidden over the hero, shown past it, inside the screen, all for the chosen store; category tiles follow the store; no script errors | pass | `audit/preview-smoke.json` |
| Phone width sweep of all 43 content pages: no sideways scroll, no script errors, no broken images | 43/43 | local run of `tools/shot.mjs` |
| No keys or credentials, no other client or reference-site names, in either public tree | CLEAN | `tools/publish-copy.mjs` (fail-closed, runs on every publish) |
| No trace of the old platform (WordPress, Divi) | CLEAN | `sr-decontaminate --strict` |

## site-reforge gate

`sr-gate` is NOT-READY: 12 pass, 2 fail, 15 unproven. The heavy comparison stages (plan ledger, parity, fabrication,
pixel diff, responsive sweep, SEO report, motion inventory, presets) were not run, by the operator's instruction to skip
unnecessary verification for a prospect preview. The two FAILs: C13 (the redesign's own palette is written as colour
literals in places instead of tokens) and C25 (handoff docs, now written). A pixel match to the old site (C22) does not
apply to a total redesign.
