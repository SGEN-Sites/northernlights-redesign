# Pitch notes: Northern Lights Dispensary redesign

Preview only (noindex). Everything below is what to tell the client, and what to confirm before any launch.

## Kept from the live site

- Every live URL: `/`, `/whitehall/`, `/menands/`, `/loyalty-program/`, `/contact/`, `/policies/`, `/vendor-intake/`.
  The six testimonial posts (`/testimonial/<name>-google-reviews/`) redirect to `/reviews/#<name>`; the author
  archive redirects to `/about-us/`.
- Both stores' own online menus (the same embedded menus the live site uses), now opened straight on a shelf.
- The About text, the loyalty terms, the policies (EULA, privacy, terms) and the six reviews, word for word.
- The brand: the aurora badge, the NL monogram, the wordmark, navy, teal and orchid, the aurora topbar, the 21+ gate
  wording, the licence numbers and the state warnings.

## New

- A live-menu page for every category each store carries (Whitehall 9, Menands 10), specials and brands per store,
  `/shop/` and `/deals/` (both open the visitor's store), so no Shop or category button lands on an empty page.
- A page per store, Locations, Same-day Delivery, Areas We Serve with 16 town pages, Learn (4 guides), a blog
  (4 posts), FAQ, Reviews, Brands We Carry, About, Events, Careers and an HTML site map.
- Store choice everywhere (Whitehall by default), live open/closed status, and a sticky store bar with Shop now,
  Call, Directions and today's hours.
- "Lights on Broadway" art direction (see `docs/DESIGN.md`) with AI-generated mood scenes and product illustrations,
  labelled as illustrations.

## Questions for the client (before launch)

1. **"The only licensed dispensary in town"** (Whitehall) came from the owner's brief; it is not printed on the site
   yet. Confirm, then it can be added to the Whitehall page.
2. **Licences:** which of OCM-CAURD-24-000059 and OCM-CAURD-25-000314 belongs to which store?
3. **The app:** the policies mention a "Northern Lights NY" app (Apple and Google). No store links were found, so no
   "Download our app" page was built. Send the links to add one.
4. **Price match how-to:** the site says "ask us at the counter or call the store". Confirm the process (proof needed?
   in-store only? online orders?).
5. **Delivery:** both menus say free delivery, 11am to 7pm. Confirm the delivery area, any minimum, and that delivery
   runs from both stores every day.
6. **Hours:** the site uses 10am to 8pm every day for both stores (live topbar and both menus). Holidays?
7. **Reviews:** the six Google reviews don't say which store they're about. One review calls the business "minority
   and veteran owned"; it is shown only as the customer's words. Confirm before we ever say it ourselves.
8. **Imagery:** the living room, seasons, canal, lake, road, stage and product images are AI illustrations of the
   feel described in the brief, not photos of the store. Real interior photos (the guitar, the rug, the armchair,
   the Jerry Garcia portrait) and a daytime Whitehall storefront photo would replace them. The Whitehall photo shows
   people from the Chamber of Commerce visit: confirm we may keep using it.
9. **Menands art gallery:** the menu says local artists can ask about showing work; confirm it's still open to that.
10. **Forms:** contact and vendor intake mirror the live fields but are not connected in the preview; reconnect the
    form handler at launch. The Rewards sign-up uses the live loyalty provider's sign-up form.
11. **Specials and brands:** the brands page lists what each menu showed on November 16, 2026. Specials are never
    printed; the pages open the live specials.
12. **Hidden menu name:** the stores' menu profiles are named "Northern Lights - Whitehall" and "Northern Lights -
    Menands" (shown inside the cart); fine as is.
