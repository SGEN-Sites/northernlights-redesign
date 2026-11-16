// fetch-fonts.mjs: self-host the open fonts (SIL OFL) the redesign uses, latin subset only, as woff2.
//   node tools/fetch-fonts.mjs  -> src/assets/fonts/*.woff2 + src/assets/fonts/fonts.json
// Fraunces (variable: opsz, wght, SOFT, WONK) is the open stand-in for the live site's display face (Vallejo Black);
// Jost (Futura-inspired) stands in for the live site's body face (Futura Book).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/assets/fonts');
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const FAMILIES = [
  { css: 'family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1', file: 'fraunces' },
  { css: 'family=Jost:ital,wght@0,100..900;1,100..900', file: 'jost' },
];
const record = [];
for (const f of FAMILIES) {
  const css = await (await fetch('https://fonts.googleapis.com/css2?' + f.css + '&display=swap', { headers: { 'User-Agent': UA } })).text();
  const blocks = css.split('@font-face').slice(1);
  for (const b of blocks) {
    const subset = (css.slice(0, css.indexOf(b)).match(/\/\*\s*([\w-]+)\s*\*\/\s*$/) || [])[1] || '';
    if (subset && subset !== 'latin') continue;
    const url = (b.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    const style = (b.match(/font-style:\s*(\w+)/) || [])[1];
    const weight = (b.match(/font-weight:\s*([\d ]+)/) || [])[1];
    const stretch = (b.match(/font-stretch:\s*([\d% ]+)/) || [])[1] || null;
    if (!url) continue;
    const name = `${f.file}-${style}.woff2`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, name), buf);
    record.push({ family: f.file, file: name, style, weight: weight && weight.trim(), stretch: stretch && stretch.trim(), bytes: buf.length, source: url });
    console.log(name, buf.length, weight, stretch || '');
  }
}
fs.writeFileSync(path.join(OUT, 'fonts.json'), JSON.stringify({ fetched: new Date().toISOString(), licence: 'SIL Open Font License 1.1 (Google Fonts)', fonts: record }, null, 2));
