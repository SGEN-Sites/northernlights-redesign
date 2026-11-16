// site.mjs: every fact the templates print, in one place. Values come from facts/client-facts.json (live capture, the
// stores' own menus, the operator brief). Nothing here is typed from memory.
export const ORIGIN = 'https://northernlightsdispo.com';
export const DEFAULT_STORE = 'whitehall'; // operator: Whitehall is always the first and default location

export const brand = {
  name: 'Northern Lights Dispensary',
  short: 'Northern Lights',
  concept: 'Lights on Broadway',
  entity: 'Thinc Intellectual Property Holdings, LLC',
  copyright: `All Rights Reserved Copyright © ${new Date().getFullYear()} Thinc Intellectual Property Holdings, LLC`,
  licences: 'New York State Cannabis Licenses: OCM-CAURD-24-000059 / OCM-CAURD-25-000314',
  email: 'info@northernlightsdispo.com',
  hoursLine: 'Open every day, 10am–8pm',
  deliveryLine: 'Same-day delivery now available',
  priceMatch: 'We price match guarantee with ANY recreational dispensary in the Capitol Region!',
  warning: 'For use only by adults 21 years of age and older. Keep out of reach of children and pets. In case of accidental ingestion or overconsumption, contact the National Poison Control Center hotline 1-800-222-1222 or call 9-1-1. Please consume responsibly. Cannabis is not recommended for use by persons who are pregnant or nursing.',
  hopeline: 'Concerned about your cannabis use? Text HOPENY, call 1-877-8-HOPENY, or visit',
  hopelineUrl: 'https://oasas.ny.gov/HOPELine',
  ocm: 'https://cannabis.ny.gov/adult-use-information',
  ocmVerify: 'https://cannabis.ny.gov/dispensary-location-verification',
  social: [
    { name: 'Instagram', href: 'https://www.instagram.com/northernlightsny', icon: 'instagram' },
    { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61553986115913', icon: 'facebook' },
  ],
  loyaltyJoin: 'https://lab.alpineiq.com/join/c/4106/105518',
  about: [
    'Northern Lights is a family-owned and operated adult-use cannabis retailer serving communities across New York. We’re committed to creating a welcoming, professional environment where adults 21 and over can explore carefully selected cannabis products with confidence.',
    'Our approach is simple: offer fair pricing, reliable service, and a thoughtful customer experience. We proudly match any local price to ensure our customers receive consistent value, and we provide convenient delivery options to meet you wherever you are.',
    'At Northern Lights, we focus on quality, transparency, and community—helping you make informed choices in a space built on trust and respect.',
  ],
  gate: { hello: 'Welcome to Northern Lights Dispensary.', sub: 'Explore the menu & enhance your journey!', q: 'Are you 21 or over?', yes: 'Yes, I Am 21 Or Over', no: 'No, I Am Not 21 Yet' },
  separateCarts: 'Each store keeps its own menu and its own cart. Switching stores keeps you on the same shelf at the other store.',
};

// in-store hours, 24h [open, close] per weekday Sun..Sat (live topbar "Open Every Day: 10am-8pm"; both menus: In-Store 10am - 8pm)
const DAILY_10_8 = [[10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20], [10, 20]];

export const stores = [
  {
    id: 'whitehall', n: '01', name: 'Northern Lights Whitehall', city: 'Whitehall', region: 'NY', street: '132 Broadway', zip: '12887',
    phone: '(518) 499-5235', tel: '+15184995235',
    directions: 'https://www.google.com/maps/dir/?api=1&destination=Northern+Lights+Dispensary%2C+132+Broadway%2C+Whitehall%2C+NY+12887',
    mapEmbed: 'https://www.google.com/maps?q=132+Broadway,+Whitehall,+NY+12887&output=embed',
    hours: DAILY_10_8, delivery: '11am–7pm', curbside: null,
    payment: ['Pay by Phone', 'Debit Card', 'Pay by Bank', 'Cash'],
    menuPage: '/whitehall/', page: '/locations/whitehall-ny/',
    script: 'https://dutchie.com/api/v2/embedded-menu/6875670784d8c6f938461526.js',
    banner: 'The BEST place in the capital region. Here at Northern Lights WHITEHALL, you’ll find a quick witted staff that’s knowledgeable in the cannabis industry, great vibes, occasional music and Brand Pop-Up events!',
    tagline: 'At the south tip of Lake Champlain',
    geo: { lat: 43.5554, lng: -73.4037 },
    photo: 'store-whitehall',
  },
  {
    id: 'menands', n: '02', name: 'Northern Lights Menands', city: 'Menands', region: 'NY', street: '100 Broadway #8', zip: '12204',
    phone: '(518) 472-0278', tel: '+15184720278',
    directions: 'https://www.google.com/maps/dir/?api=1&destination=Northern+Lights+Dispensary%2C+100+Broadway+%238%2C+Menands%2C+NY+12204',
    mapEmbed: 'https://www.google.com/maps?q=100+Broadway+%238,+Menands,+NY+12204&output=embed',
    hours: DAILY_10_8, delivery: '11am–7pm', curbside: '10am–8pm',
    payment: ['Debit Card', 'Pay by Bank', 'Cash'],
    menuPage: '/menands/', page: '/locations/menands-ny/',
    script: 'https://dutchie.com/api/v2/embedded-menu/64baebe17c24f80009d63c9f.js',
    banner: 'Here at Northern Lights MENANDS, you’ll find a quick witted staff that’s knowledgeable in the cannabis industry, great vibes, a small family obtained art gallery, occasional music and Brand Pop-Up events! (Contact us today if you’d like to get some of your personal artwork in there!)',
    tagline: 'Just off I-787, near Albany',
    geo: { lat: 42.692, lng: -73.7246 },
    photo: 'store-menands',
  },
];
export const storeById = (id) => stores.find((s) => s.id === id) || stores[0];

// The live menus' own category slugs (verified with products at each store, 2026-11-16, facts/client-facts.json).
export const categories = [
  { id: 'flower', label: 'Flower', short: 'Flower', obj: 'cut-flower', line: 'Whole buds, eighths to ounces' },
  { id: 'pre-rolls', label: 'Pre-Rolls', short: 'Pre-Rolls', obj: 'cut-prerolls', line: 'Singles, packs and infused' },
  { id: 'vaporizers', label: 'Vapes', short: 'Vapes', obj: 'cut-vapes', line: 'Carts and all-in-ones' },
  { id: 'concentrates', label: 'Concentrates', short: 'Concentrates', obj: 'cut-concentrates', line: 'Rosin, resin, badder and more' },
  { id: 'edibles', label: 'Edibles', short: 'Edibles', obj: 'cut-edibles', line: 'Gummies, chews and treats' },
  { id: 'orals', label: 'Orals', short: 'Orals', obj: 'cut-orals', line: 'Drops, mints and capsules' },
  { id: 'tinctures', label: 'Tinctures', short: 'Tinctures', obj: 'cut-tinctures', line: 'Measured by the dropper' },
  { id: 'topicals', label: 'Topicals', short: 'Topicals', obj: 'cut-topicals', line: 'Balms and lotions' },
  { id: 'cbd', label: 'CBD', short: 'CBD', obj: 'cut-cbd', line: 'CBD-forward picks' },
  { id: 'accessories', label: 'Accessories', short: 'Gear', obj: 'cut-accessories', line: 'Grinders, papers and gear' },
  { id: 'apparel', label: 'Apparel', short: 'Apparel', obj: 'cut-apparel', line: 'Tees and hats' },
];
export const storeCats = {
  whitehall: ['flower', 'pre-rolls', 'vaporizers', 'concentrates', 'edibles', 'orals', 'tinctures', 'topicals', 'accessories'],
  menands: ['flower', 'pre-rolls', 'vaporizers', 'concentrates', 'edibles', 'tinctures', 'topicals', 'cbd', 'accessories', 'apparel'],
};
export const sharedCats = storeCats.whitehall.filter((c) => storeCats.menands.includes(c)); // the 8 both stores carry
export const catById = (id) => categories.find((c) => c.id === id);
// the in-site product page for a store + category (each one embeds that store's live menu, opened on the category)
export const catPath = (storeId, catId) => {
  const has = storeCats[storeId].includes(catId);
  const sid = has ? storeId : storeCats[DEFAULT_STORE].includes(catId) ? DEFAULT_STORE : stores.find((s) => storeCats[s.id].includes(catId)).id;
  return `/${sid}/${catId}/`;
};

export const nav = {
  shop: {
    label: 'Shop', mega: true,
    groups: [
      { title: 'Live menus', links: [{ label: 'Whitehall menu', href: '/whitehall/', note: 'Our first stop' }, { label: 'Menands menu', href: '/menands/', note: 'Near Albany' }] },
      { title: 'Shop by category', cats: true },
      { title: 'Save', links: [{ label: 'Today’s specials', specials: true }, { label: 'Price match', href: '/deals/#price-match' }, { label: 'Brands we carry', href: '/brands/' }] },
    ],
  },
  locations: {
    label: 'Locations', mega: true,
    groups: [
      { title: 'Our stores', links: [{ label: 'Whitehall, NY', href: '/locations/whitehall-ny/' }, { label: 'Menands, NY', href: '/locations/menands-ny/' }, { label: 'All locations', href: '/locations/' }] },
      { title: 'Getting it to you', links: [{ label: 'Same-day delivery', href: '/delivery/' }, { label: 'Areas we serve', href: '/dispensary-near/' }] },
    ],
  },
  learn: {
    label: 'Learn', mega: true,
    groups: [
      { title: 'Guides', links: [{ label: 'Your first visit', href: '/learn/first-visit/' }, { label: 'Cannabis products', href: '/learn/cannabis-products/' }, { label: 'Strain types', href: '/learn/strain-types/' }, { label: 'New York cannabis laws', href: '/learn/new-york-cannabis-laws/' }] },
      { title: 'Read', links: [{ label: 'The Northern Lights blog', href: '/blog/' }, { label: 'Learn hub', href: '/learn/' }, { label: 'FAQ', href: '/faq/' }] },
    ],
  },
  about: {
    label: 'About', mega: true,
    groups: [
      { title: 'Northern Lights', links: [{ label: 'About us', href: '/about-us/' }, { label: 'Reviews', href: '/reviews/' }, { label: 'Events', href: '/events/' }, { label: 'Careers', href: '/careers/' }] },
      { title: 'Get in touch', links: [{ label: 'Contact', href: '/contact/' }, { label: 'Vendor intake', href: '/vendor-intake/' }, { label: 'Policies', href: '/policies/' }] },
    ],
  },
  flat: [
    { label: 'Deals', href: '/deals/' },
    { label: 'Rewards', href: '/loyalty-program/' },
    { label: 'Events', href: '/events/' },
  ],
};

export const footerCols = [
  { title: 'Shop', links: [{ label: 'Whitehall menu', href: '/whitehall/' }, { label: 'Menands menu', href: '/menands/' }, { label: 'Deals & price match', href: '/deals/' }, { label: 'Brands we carry', href: '/brands/' }, { label: 'Rewards', href: '/loyalty-program/' }] },
  { title: 'Visit', links: [{ label: 'Whitehall, NY', href: '/locations/whitehall-ny/' }, { label: 'Menands, NY', href: '/locations/menands-ny/' }, { label: 'Same-day delivery', href: '/delivery/' }, { label: 'Areas we serve', href: '/dispensary-near/' }, { label: 'Events', href: '/events/' }] },
  { title: 'Learn', links: [{ label: 'Your first visit', href: '/learn/first-visit/' }, { label: 'Cannabis products', href: '/learn/cannabis-products/' }, { label: 'Strain types', href: '/learn/strain-types/' }, { label: 'NY cannabis laws', href: '/learn/new-york-cannabis-laws/' }, { label: 'Blog', href: '/blog/' }] },
  { title: 'Company', links: [{ label: 'About us', href: '/about-us/' }, { label: 'Reviews', href: '/reviews/' }, { label: 'FAQ', href: '/faq/' }, { label: 'Careers', href: '/careers/' }, { label: 'Contact', href: '/contact/' }, { label: 'Vendor intake', href: '/vendor-intake/' }, { label: 'Policies', href: '/policies/' }] },
];

export const loyalty = {
  bonus: 50,
  tiers: [
    { name: 'Aurora', spend: '$0–999', earn: '1', bonus: null, rays: 3 },
    { name: 'Borealis', spend: '$1,000–2,499', earn: '1.25', bonus: '250', rays: 5 },
    { name: 'Zenith', spend: '$2,500–4,999', earn: '1.5', bonus: '500', rays: 7 },
    { name: 'Northern Light', spend: '$5,000+', earn: '1.75', bonus: '1,000', rays: 10 },
  ],
  redeem: [{ pts: 100, value: '$5', min: '$6.00' }, { pts: 250, value: '$15', min: '$16.00' }],
  rules: ['Only one loyalty redemption may be used per calendar day.', 'Loyalty redemptions may not be combined or stacked.', 'Points may not be redeemed for cash.', 'Points are non-transferable.'],
  retro: 'All eligible purchases made on or after January 1, 2026 will be credited to a participant’s account once enrollment is completed and purchases are associated with the participant’s verified customer profile.',
};

export const reviews = [
  { name: 'Breanna', id: 'breanna', text: 'I come here often and usually do a pick up order that’s ready right away. Dejon usually assists me and he is very personable and knows his stuff! It’s clean and overall a nice atmosphere if you’re stopping in or hanging around when there is entertainment! Thankyou so much.' },
  { name: 'Christopher', id: 'christopher', text: 'The customer service you receive at Northern lights dispensary is way above and beyond. Now eligible friendly employees. The prices are amazing. They have deals and specials and bargains you would not even believe. Just an amazing experience overall. I couldn’t be more satisfied Just very very good.' },
  { name: 'Eric', id: 'eric', text: 'I’ve been here a few times now, and I love the wide variety of selection offered at this store. Everything is very reasonably priced and the staff is helpful and accessible. All products that I have bought from here have been spectacular. Highly recommend visiting if you’re in the Albany-suburbs area. Thanks, NL!' },
  { name: 'Fern', id: 'fern', text: 'Solid spot with a chill vibe. Clean layout, friendly staff, and an easy shopping experience. Definitely somewhere I’d return to. In addition, they’re a minority and veteran owned brand, would be a great move.' },
  { name: 'Kody', id: 'kody', text: 'Leading dispensary on their turf by far. The bud tenders are super knowledgeable, and they always have the right thing for what I’m feeling. The best part- it’s a comfortable, welcoming shopping environment. Highly recommend their Grassroots Diamond Flower and Select 2g vape!' },
  { name: 'Tanya', id: 'tanya', text: 'This is by far the best dispensary in this area. Not only do they have knowledge of what is best for each customer, they truly help. Anyone can open a business — not everyone can provide the type of customer service this company has acquired. I come from an upper management retail and medical (pharmacy) background and typically do not leave Google reviews, but this company has pulled out all the stops… This will be my sole dispensary going forward. If you want great service with reasonable prices, this is the dispensary for you. They’ve helped me, my sister, and at least 10 other friends. They are fantastic.' },
];

export const brandsCarried = {
  whitehall: ['1906', 'Alchemy Pure', 'Animal House', 'Ayrloom', 'Blotter', 'Bodega Boys', 'Breakfast Connections', 'Cannabals', 'CHAOS', 'Cheeba Chews', 'Chew & Chill', 'Dank By Definition', 'Eureka', 'Fernway', 'Florist Farms', 'Grön', 'Harney Brothers', 'Healium', 'High Falls Canna', 'Honey King', 'Hudson Cannabis', 'Hurley Grown', 'Jaunty', 'Jeeter', 'Jetpacks', 'Kingsroad', 'LEAL', 'Lost Farm', 'Luci', 'Mark Turks Farms', 'MB Farms', 'Mfused', 'Mildly Moronic', 'Off Hours', 'OMO Labs', 'PICC', 'Pot & Head', 'Super Fog', 'TerpX', 'Untitled'],
  menands: ['1937', 'Akron Bloom', 'Animal House', 'Ayrloom', 'Bodega Boys', 'Boukét', 'Breakfast Connections', 'Camino', 'Cannabals', 'Cheeba Chews', 'Chew & Chill', 'Eaton Botanicals', 'Especially Green', 'Florette', 'Florist Farms', 'Golden Garden', 'Goodlyfe', 'Green Gruff', 'Grön', 'Hashies', 'Head & Heal', 'Heady Tree', 'Heavy Hitters', 'High Falls Canna', 'High Peaks', 'Honest', 'Honey King', 'Jaunty', 'Jeeter', 'Jetpacks', 'Knack', 'KSHN', 'LEAL', 'Lost Farms', 'Luci', 'Magnitude', 'Mark Turks Farms', 'Mfused', 'Nanticoke', 'Natural Xotics', 'Off Hours', 'Phill’s Nice', 'PICC', 'Presidential', 'PUFF Pre-Rolls', 'Revert', 'Rove', 'SunDrift', 'Super Fog', 'TerpX', 'The Gram', 'To The Moon', 'Untitled', 'Zonk'],
};
