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
| aurora badge | round badge, spike motif, NL monogram | the badge as a spinning 3D coin (drag to spin); its spikes drawn live as the aurora on canvas; the monogram on the 21+ gate |
| aurora strip | gradient topbar | kept as the topbar; the same gradient fills one accent word per heading |
| display face | Vallejo Black (commercial) | Fraunces (open licence): heavy, soft serif with a 70s warmth; italic accent words |
| body face | Futura Book (commercial) | Jost (open licence, Futura-inspired) |

## Three planes

1. **Night**: navy bands, the live aurora canvas, starfields, the living map.
2. **Lamplight**: inside the store (amber, lamp, clapboard red, wood); the living-room band, events, the paper band.
3. **Glass**: selective frosted panels over imagery (gate, switcher, store cards, sticky bar, mega menus).

## Signature moments

- Hero: the aurora over the lake (still + generated 5 s loop), live canvas aurora, the 3D badge coin, and the real
  Whitehall storefront in the Northern Lights frame.
- The Northern Lights frame (`nlFrame`, `src/styles/frames.css`), drawn from the client's own badge: a slowly turning
  aurora ring in the badge's violet-to-teal gradient, the logo's spike crown rising behind the top edge, the badge's
  crescent moon and four-point stars, the badge's thin inner ring on the round variant, and a glass caption lit by
  the store's own light. Arch (hero), round medallion (store pages, About) and landscape (the living room) variants.
- One living map: the Upper Hudson, Lake George and the south end of Lake Champlain drawn from real coordinates; the
  Champlain Canal; the two stores as points of light; Whitehall lights first and the light travels down to Menands.
- Category tiles: AI product cut-outs standing out of their cards, tilting in 3D, each opening the live menu on that shelf.
- Seamless night bands; dividers drawn from the badge (mountain ridge into the warm and light bands, lake ripples out of them) and an aurora ribbon carrying the stores' own lines into the living room.
- The living room: the interior in the landscape frame, with the guitar and a pothos floating out of it.
- Rewards: the four real tiers as rising aurora rays.
- Four seasons: staggered cards with the shop's own humor.

## Motion

Reveal on scroll, split-word headings, parallax (`data-depth`), 3D tilt and magnetic buttons (fine pointers only), the
coin spin, the aurora ribbon, the map thread, the review deck, and a reactive layer: the aurora follows the pointer and
the scroll, cards light up under the pointer, the hero layers move against the pointer, a scroll-progress aurora line. Everything is visible without JS and still under
`prefers-reduced-motion` (the canvas draws one frame, loops never load).

## Store system

Whitehall is the default everywhere. Choosing a store (gate step 2, header chip, store cards, the shelves toggle, the
sticky bar) retargets every Shop, Specials and category link, the phone, directions and today's hours. A category a
store does not carry keeps pointing at the store that does (Orals: Whitehall; CBD and Apparel: Menands).
