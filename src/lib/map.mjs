// map.mjs: "one living map": the Upper Hudson and the south end of Lake Champlain drawn from real coordinates
// (equirectangular, cos-latitude corrected), with the two stores as connected points of light. Whitehall shines first,
// then the light travels down the canal and the Hudson to Menands. Geography is approximate and decorative;
// store positions are the stores' own addresses.
import { stores, DEFAULT_STORE } from '../content/site.mjs';
import { esc, href } from './html.mjs';

const LAT0 = 43.98, LAT1 = 42.58, LNG0 = -74.02, LNG1 = -73.12;
const K = 420, COS = Math.cos((43.28 * Math.PI) / 180);
const W = Math.round((LNG1 - LNG0) * COS * K), H = Math.round((LAT0 - LAT1) * K);
const P = (lat, lng) => [+((lng - LNG0) * COS * K).toFixed(1), +((LAT0 - lat) * K).toFixed(1)];
const line = (pts) => pts.map(([a, b], i) => `${i ? 'L' : 'M'}${P(a, b).join(' ')}`).join(' ');
// smooth path through points (Catmull-Rom to cubic Bezier)
function smooth(pts) {
  const q = pts.map(([a, b]) => P(a, b));
  let d = `M${q[0].join(' ')}`;
  for (let i = 0; i < q.length - 1; i++) {
    const p0 = q[i - 1] || q[i], p1 = q[i], p2 = q[i + 1], p3 = q[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1.map((v) => v.toFixed(1)).join(' ')} ${c2.map((v) => v.toFixed(1)).join(' ')} ${p2.join(' ')}`;
  }
  return d;
}

// water (approximate courses)
const champlain = [[43.98, -73.405], [43.9, -73.4], [43.85, -73.415], [43.79, -73.39], [43.72, -73.395], [43.66, -73.4], [43.61, -73.41], [43.575, -73.405], [43.556, -73.404]];
const lakeGeorge = [[43.42, -73.712], [43.47, -73.69], [43.53, -73.655], [43.6, -73.6], [43.66, -73.55], [43.72, -73.51], [43.78, -73.47], [43.84, -73.435]];
const hudson = [[43.46, -73.82], [43.38, -73.76], [43.33, -73.68], [43.305, -73.62], [43.29, -73.585], [43.24, -73.585], [43.1, -73.585], [43.0, -73.62], [42.9, -73.67], [42.8, -73.685], [42.74, -73.69], [42.7, -73.705], [42.66, -73.735], [42.62, -73.76], [42.58, -73.77]];
const mohawk = [[42.82, -74.02], [42.82, -73.95], [42.8, -73.85], [42.79, -73.76], [42.785, -73.7]];
const canal = [[43.27, -73.585], [43.33, -73.53], [43.41, -73.49], [43.47, -73.43], [43.52, -73.41], [43.555, -73.404]];
const vt = [[43.98, -73.37], [43.7, -73.37], [43.6, -73.39], [43.565, -73.37], [43.56, -73.32], [43.53, -73.27], [43.4, -73.255], [43.2, -73.26], [42.9, -73.27], [42.745, -73.27]];
const towns = [
  ['Ticonderoga', 43.848, -73.423, 'r'], ['Lake George', 43.426, -73.712, 'l'], ['Fort Ann', 43.414, -73.489, 'l'], ['Granville', 43.408, -73.259, 'r'],
  ['Glens Falls', 43.31, -73.644, 'l'], ['Hudson Falls', 43.3, -73.586, 'r'], ['Saratoga Springs', 43.083, -73.785, 'l'], ['Schenectady', 42.814, -73.94, 'b'],
  ['Troy', 42.728, -73.692, 'r'], ['Albany', 42.653, -73.756, 'l'], ['Fair Haven, VT', 43.595, -73.265, 'r'],
];

// the light's route: Whitehall, down the canal and the Hudson valley, to Menands
const W0 = stores.find((s) => s.id === 'whitehall').geo, M0 = stores.find((s) => s.id === 'menands').geo;
const thread = [[W0.lat, W0.lng], [43.47, -73.44], [43.38, -73.5], [43.27, -73.585], [43.1, -73.6], [42.92, -73.66], [42.78, -73.7], [M0.lat, M0.lng]];

// switcher: the two lights and their labels become store pickers (data-set-store, handled by site.js) and follow the
// visitor's store (data-store-card -> .is-mine); the labels are buttons, the lights a pointer shortcut (the svg stays aria-hidden)
export function livingMap({ id = 'map', compact = false, labels = true, switcher = false } = {}) {
  const st = stores.map((s) => ({ s, xy: P(s.geo.lat, s.geo.lng) }));
  const tl = (t) => { const [x, y] = P(t[1], t[2]); const dx = t[3] === 'l' ? -6 : t[3] === 'r' ? 6 : 0, dy = t[3] === 'b' ? 14 : 4; return `<g class="lm__town"><circle cx="${x}" cy="${y}" r="1.8"/>${labels ? `<text x="${x + dx}" y="${y + dy}" text-anchor="${t[3] === 'l' ? 'end' : t[3] === 'r' ? 'start' : 'middle'}">${esc(t[0])}</text>` : ''}</g>`; };
  return `<figure class="lm${compact ? ' lm--compact' : ''}${switcher ? ' lm--switch' : ''}" data-livemap aria-label="Map: Northern Lights Whitehall at the south tip of Lake Champlain and Northern Lights Menands near Albany, connected by a line of light">
  <svg class="lm__svg" viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="lm-th-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55FFD6"/><stop offset=".45" stop-color="#4089FF"/><stop offset="1" stop-color="#D369FF"/></linearGradient>
      <radialGradient id="lm-glow-${id}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".25" stop-color="#55FFD6" stop-opacity=".7"/><stop offset="1" stop-color="#55FFD6" stop-opacity="0"/></radialGradient>
      <radialGradient id="lm-glow2-${id}"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="#D369FF" stop-opacity=".65"/><stop offset="1" stop-color="#D369FF" stop-opacity="0"/></radialGradient>
      <filter id="lm-blur-${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <g class="lm__grid">${Array.from({ length: 7 }, (_, i) => `<line x1="0" x2="${W}" y1="${(H / 7) * (i + 0.5)}" y2="${(H / 7) * (i + 0.5)}"/>`).join('')}</g>
    <path class="lm__vt" d="${line(vt)}"/>
    <text class="lm__state" x="${P(43.2, -73.19)[0]}" y="${P(43.2, -73.19)[1]}" transform="rotate(90 ${P(43.2, -73.19).join(' ')})">VERMONT</text>
    <text class="lm__state" x="${P(42.96, -73.99)[0]}" y="${P(42.96, -73.99)[1]}">NEW YORK</text>
    <path class="lm__water lm__water--lake" d="${smooth(champlain)}"/>
    <path class="lm__water lm__water--lake lm__water--lg" d="${smooth(lakeGeorge)}"/>
    <path class="lm__water" d="${smooth(hudson)}"/>
    <path class="lm__water lm__water--thin" d="${smooth(mohawk)}"/>
    <path class="lm__canal" d="${smooth(canal)}"/>
    ${labels ? `<text class="lm__label lm__label--water" x="${P(43.72, -73.375)[0]}" y="${P(43.72, -73.375)[1]}">Lake Champlain</text>
    <text class="lm__label lm__label--water" x="${P(43.62, -73.68)[0]}" y="${P(43.62, -73.68)[1]}" transform="rotate(-52 ${P(43.62, -73.68).join(' ')})">Lake George</text>
    <text class="lm__label lm__label--water" x="${P(43.0, -73.63)[0] - 8}" y="${P(43.0, -73.63)[1]}" text-anchor="end">Hudson River</text>
    <text class="lm__label lm__label--canal" x="${P(43.44, -73.47)[0] + 7}" y="${P(43.44, -73.47)[1] + 3}">Champlain Canal</text>` : ''}
    ${towns.map(tl).join('')}
    <path class="lm__thread-glow" d="${smooth(thread)}" stroke="url(#lm-th-${id})" filter="url(#lm-blur-${id})"/>
    <path class="lm__thread" d="${smooth(thread)}" stroke="url(#lm-th-${id})" pathLength="100"/>
    <path class="lm__spark" d="${smooth(thread)}" pathLength="100"/>
    ${st.map(({ s, xy }, i) => `<g class="lm__store lm__store--${s.id}${s.id === DEFAULT_STORE ? ' is-lead' : ''}" data-map-store="${s.id}"${switcher ? ` data-set-store="${s.id}" data-store-card="${s.id}"` : ''} style="--i:${i}">
      <circle class="lm__halo" cx="${xy[0]}" cy="${xy[1]}" r="${s.id === DEFAULT_STORE ? 34 : 26}" fill="url(#${s.id === DEFAULT_STORE ? 'lm-glow' : 'lm-glow2'}-${id})"/>
      <circle class="lm__ring" cx="${xy[0]}" cy="${xy[1]}" r="${s.id === DEFAULT_STORE ? 11 : 9}"/>
      <circle class="lm__dot" cx="${xy[0]}" cy="${xy[1]}" r="${s.id === DEFAULT_STORE ? 5.2 : 4.4}"/>
    </g>`).join('')}
  </svg>
  ${st.map(({ s, xy }) => switcher
    ? `<button class="lm__pin lm__pin--${s.id}${s.id === DEFAULT_STORE ? ' is-lead' : ''}" type="button" style="--x:${((xy[0] / W) * 100).toFixed(2)}%;--y:${((xy[1] / H) * 100).toFixed(2)}%" data-map-pin="${s.id}" data-set-store="${s.id}" data-store-card="${s.id}" aria-label="Shop at ${esc(s.city)}"><b>${esc(s.city)}</b><small>${esc(s.street)}</small></button>`
    : `<a class="lm__pin lm__pin--${s.id}${s.id === DEFAULT_STORE ? ' is-lead' : ''}" href="${href(s.page)}" style="--x:${((xy[0] / W) * 100).toFixed(2)}%;--y:${((xy[1] / H) * 100).toFixed(2)}%" data-map-pin="${s.id}"><b>${esc(s.city)}</b><small>${esc(s.street)}</small></a>`).join('')}
  <figcaption class="sr-only">Northern Lights Whitehall, 132 Broadway, at the south end of Lake Champlain where the Champlain Canal begins; Northern Lights Menands, 100 Broadway, on the Hudson River just north of Albany.</figcaption>
</figure>`;
}
export const mapSize = { W, H };
