// html.mjs: tiny helpers shared by every template. No dependencies. (Adapted from an earlier redesign of ours.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_STORE, catPath, catById, storeById } from '../content/site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let BASE = '/';
export const setBase = (b) => { BASE = b.endsWith('/') ? b : b + '/'; };
export const base = () => BASE;

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const attrs = (o) => Object.entries(o).filter(([, v]) => v !== false && v != null).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`)).join('');

// internal URL -> base-prefixed path; external and special schemes stay as they are
export function href(u) {
  if (!u) return BASE;
  if (/^(mailto:|tel:|#|data:|https?:\/\/)/.test(u)) return u;
  if (!u.startsWith('/')) return u;
  const [pathPart, rest = ''] = u.split(/(?=[?#])/);
  let clean = pathPart;
  if (clean !== '/' && !/\.[a-z0-9]+$/i.test(clean) && !clean.endsWith('/')) clean += '/';
  return BASE + clean.replace(/^\//, '') + rest;
}
export const asset = (p) => BASE + 'assets/' + p.replace(/^\//, '');
export const isExternal = (u) => /^https?:\/\//.test(u);

// ---- images (src/content/images.json, written by tools/process-images.py) ----
let REG = null;
const reg = () => REG || (REG = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/images.json'), 'utf8')));
export const imgInfo = (id) => reg().img[id] || null;
export const brandMark = (id) => reg().brand[id];
// <img> with srcset from the registry. opts: { alt, sizes, cls, eager, decorative, min, depth, style }
export function img(id, opts = {}) {
  const r = imgInfo(id);
  if (!r) throw new Error('image not in registry: ' + id);
  const files = r.files;
  const big = files[files.length - 1];
  const small = files.find((f) => f.w >= (opts.min || 700)) || big;
  const alt = opts.decorative ? '' : opts.alt ?? r.alt ?? '';
  const a = {
    src: asset(small.file), srcset: files.map((f) => `${asset(f.file)} ${f.w}w`).join(', '), sizes: opts.sizes || '100vw',
    width: big.w, height: big.h, alt, loading: opts.eager ? 'eager' : 'lazy', decoding: 'async', fetchpriority: opts.eager ? 'high' : null,
    class: opts.cls || null, style: opts.style || null, 'data-ai': r.ai || null, 'aria-hidden': opts.decorative ? 'true' : null,
    'data-depth': opts.depth ?? null,
  };
  return `<img${attrs(a)}>`;
}
export function brandImg(id, opts = {}) {
  const b = brandMark(id);
  return `<img${attrs({ src: asset(b.file), width: b.w, height: b.h, alt: opts.alt ?? '', class: opts.cls || null, loading: opts.eager ? 'eager' : 'lazy', decoding: 'async', 'aria-hidden': opts.alt ? null : 'true' })}>`;
}

// ---- store-aware product links: the default store's page in the HTML (works without JS), retargeted by site.js ----
// A category link always lands on a page that embeds the live menu opened on that category, at the visitor's store
// when that store carries the category, otherwise at the store that does.
export function catLink(catId, inner, opts = {}) {
  const c = catById(catId);
  return `<a${attrs({ href: href(catPath(opts.store || DEFAULT_STORE, catId)), 'data-cat': opts.store ? null : catId, class: opts.cls || null, 'aria-label': opts.aria || null })}>${inner ?? esc(c.label)}</a>`;
}
// the visitor's store: menu | specials | page | brands
export function storeLink(kind, inner, opts = {}) {
  const s = storeById(DEFAULT_STORE);
  const to = { menu: s.menuPage, specials: s.menuPage + 'specials/', page: s.page, brands: s.menuPage + 'brands/' }[kind];
  return `<a${attrs({ href: href(to), 'data-store-href': kind, class: opts.cls || null, 'aria-label': opts.aria || null })}>${inner}</a>`;
}

// inline markup used in content files: [label](/path/) and **bold**
export function inline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      const u = url.replace(/&amp;/g, '&');
      const ext = isExternal(u);
      return `<a href="${esc(href(u))}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
}

// ---- icons (inline SVG, 24px grid, stroke currentColor) ----
const P = {
  'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-ne': '<path d="M7 17 17 7M9 7h8v8"/>',
  'arrow-l': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  'chev': '<path d="m6 9 6 6 6-6"/>',
  'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  'pin': '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'bag': '<path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  'star': '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'close': '<path d="M6 6l12 12M18 6 6 18"/>',
  'menu': '<path d="M4 7h16M4 12h16M4 17h10"/>',
  'route': '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>',
  'truck': '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  'tag': '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  'gift': '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1s6 1 6 1zm0 0c2-4 6-4 6-1s-6 1-6 1z"/>',
  'id': '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h3"/>',
  'cash': '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  'spark': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  'music': '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  'leaf': '<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19 13 11"/>',
  'heart': '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  'check': '<path d="m5 12 5 5L20 7"/>',
  'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'facebook': '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  'instagram': '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
  'play': '<path d="M8 5v14l11-7z"/>',
  'pause': '<path d="M8 5v14M16 5v14"/>',
  'moon': '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  'snow': '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9 4.5l3 2 3-2M9 19.5l3-2 3 2"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'flower': '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C12 6 14 4 12 3c-2 1 0 3 0 6.5zM12 14.5c0 3.5-2 5.5 0 6.5 2-1 0-3 0-6.5zM9.5 12C6 12 4 10 3 12c1 2 3 0 6.5 0zM14.5 12c3.5 0 5.5 2 6.5 0-1-2-3 0-6.5 0z"/>',
  'maple': '<path d="M12 21v-6M12 15l-6 1 2-3-4-3h3L5 6l4 1 1-3 2 3 2-3 1 3 4-1-2 4h3l-4 3 2 3z"/>',
};
export const icon = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[n] || ''}</svg>`;

export const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
