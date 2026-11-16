# process-images.py: turn the generated renders and the client's own media into shippable WebP, with labels.
#   python3 -I tools/process-images.py
# Generated stills (private/gen/out/<job>-0.png): WebP at the render's full width plus smaller variants, IPTC digital
# source type trainedAlgorithmicMedia embedded as XMP. Cut-outs keep their alpha, trimmed to the object.
# Upscaled client photos (Topaz, no content change): IPTC compositeWithTrainedAlgorithmicMedia, ai = "edited".
# Client brand marks (assets/source, downloaded from the live site): resized only, never altered.
# Writes src/assets/img/*.webp, src/assets/brand/*, and src/content/images.json.
import json, os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
GEN = os.path.join(ROOT, 'private/gen/out')
SRC = os.path.join(ROOT, 'assets/source')
OUT = os.path.join(ROOT, 'src/assets/img'); os.makedirs(OUT, exist_ok=True)
BRAND = os.path.join(ROOT, 'src/assets/brand'); os.makedirs(BRAND, exist_ok=True)
REG = os.path.join(ROOT, 'src/content/images.json')

def xmp(kind):
    return ('<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF '
            'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" '
            'xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" '
            'Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/%s"/>'
            '</rdf:RDF></x:xmpmeta><?xpacket end="w"?>' % kind).encode()

reg = {'img': {}}

def save(im, name, widths, q=86, label=None, alpha=False):
    files = []
    for w in sorted(set(min(w, im.width) for w in widths), reverse=True):
        h = round(im.height * w / im.width)
        r = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        fn = '%s-%d.webp' % (name, w)
        kw = dict(quality=q, method=6)
        if alpha: kw['alpha_quality'] = 90
        if label: kw['xmp'] = xmp(label)
        r.save(os.path.join(OUT, fn), 'WEBP', **kw)
        files.append({'file': 'img/' + fn, 'w': w, 'h': h, 'bytes': os.path.getsize(os.path.join(OUT, fn))})
    files.sort(key=lambda f: f['w'])
    return files

def gen(name, alt, widths, src=None, cut=False, q=86, crop=None):
    p = os.path.join(GEN, (src or name) + '-0.png')
    im = Image.open(p)
    if cut:
        im = im.convert('RGBA'); box = im.getchannel('A').point(lambda v: 255 if v > 14 else 0).getbbox()
        if box: im = im.crop(box)
    else:
        im = im.convert('RGB')
        if crop: im = im.crop(crop(im))
    reg['img'][name] = {'alt': alt, 'ai': 'generated', 'w': im.width, 'h': im.height,
                        'files': save(im, name, widths, q=q, label='trainedAlgorithmicMedia', alpha=cut),
                        'source': 'private/gen/out/' + (src or name) + '.result.json'}

def upscaled(name, alt, widths, src, crop=None):
    im = Image.open(os.path.join(GEN, src + '-0.png')).convert('RGB')
    if crop: im = im.crop(crop(im))
    reg['img'][name] = {'alt': alt, 'ai': 'edited', 'w': im.width, 'h': im.height,
                        'files': save(im, name, widths, q=84, label='compositeWithTrainedAlgorithmicMedia'),
                        'source': 'private/gen/out/' + src + '.result.json (Topaz High Fidelity V2 upscale of the client photo, no content change)'}

# ---- generated mood scenes (never the store, staff or customers; labelled as illustrations) ----
gen('hero-aurora', 'Illustration: the northern lights over the calm south end of a lake at night, village lights on the far shore', (3136, 2200, 1440, 900), q=84)
gen('lake-dawn', 'Illustration: the last of the northern lights fading over a lake before dawn, an old dock in the foreground', (3136, 1800, 1000), q=84)
gen('canal-golden', 'Illustration: golden hour on an old stone canal lock in a small Upstate New York village', (2752, 1600, 900), q=84)
gen('season-spring', 'Illustration: spring mist over a river valley with apple blossoms along a stone wall', (1200, 700), q=84)
gen('season-summer', 'Illustration: a summer evening on a lake dock with Adirondack chairs and a red canoe', (1200, 700), q=84)
gen('season-autumn', 'Illustration: a country road through blazing autumn maples in Upstate New York', (1200, 700), q=84)
upscaled_scene = True
gen('season-winter', 'Illustration: a snowy small-town main street at blue hour under a faint aurora', (1400, 800), src='up-winter', q=84)
reg['img']['season-winter']['ai'] = 'generated'
gen('living-room', 'Illustration: a cozy jam-band living room corner with a guitar on its stand, a leather armchair, a Persian rug and houseplants', (2784, 1600, 900), src='up-living', q=84)
gen('delivery-road', 'Illustration: headlight trails on a country road at dusk under the northern lights', (2752, 1600, 900), q=84)
gen('events-stage', 'Illustration: a small music corner set up with an amp, a microphone and string lights', (2752, 1600, 900), q=84)
gen('learn-bud', 'Illustration: a frosty cannabis flower rim-lit in teal and violet', (1400, 800), q=86)
gen('city-river', 'Illustration: a river at blue hour with a lit steel bridge and old brick mills on the far bank', (2752, 1600, 900), q=84)

# ---- generated cut-outs (category and decor objects) ----
for n, alt in [('flower', 'Cannabis flower'), ('prerolls', 'Pre-rolls'), ('vapes', 'A vape cartridge and battery'), ('concentrates', 'A jar of concentrate with a dab tool'),
               ('edibles', 'Gummies'), ('orals', 'A tin of mints and a dropper bottle'), ('tinctures', 'A tincture bottle and dropper'), ('topicals', 'A jar of balm'),
               ('cbd', 'A dropper bottle and a hemp leaf'), ('accessories', 'A grinder and rolling papers'), ('apparel', 'A folded tee and a beanie'),
               ('guitar', 'An acoustic guitar'), ('plant', 'A trailing pothos plant')]:
    gen('cut-' + n, 'Illustration: ' + alt.lower(), (900, 520, 300), src='cut-' + n, cut=True, q=88)

# ---- the client's own photos, upscaled (Topaz HF V2, no content change) ----
upscaled('store-whitehall', 'The red clapboard storefront at 132 Broadway, Whitehall, with a group holding a Whitehall Chamber of Commerce banner on the steps', (1400, 900, 520), 'up-whitehall')
upscaled('store-menands', 'Aerial view of the Northern Lights Cannabis Dispensary storefront in Menands', (1400, 900, 520), 'up-menands')

# ---- the client's brand marks (resized only) ----
def brand(src, out, w=None):
    im = Image.open(os.path.join(SRC, src)).convert('RGBA')
    box = im.getchannel('A').getbbox(); im = im.crop(box) if box else im
    if w and im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(BRAND, out), 'WEBP', quality=92, alpha_quality=95, method=6)
    return {'file': 'brand/' + out, 'w': im.width, 'h': im.height}
reg['brand'] = {
    'badge': brand('56674513-NL-primary-logo-full-color-inverse.png', 'badge.webp', 900),
    'badge-sm': brand('56674513-NL-primary-logo-full-color-inverse.png', 'badge-sm.webp', 320),
    'wordmark': brand('865f91bd-logo-navigation.png', 'wordmark.webp', 1000),
    'monogram': brand('e73cff4c-logo-popup-150x150.png', 'monogram.webp'),
    'spikes': brand('8ccc9011-header-graphic.png', 'spikes.webp'),
    'favicon': brand('2090e112-cropped-NL-favicon-270x270.png', 'favicon.webp'),
    'loyalty-tiers': brand('c9a55b8f-LoyaltyGraphic.png', 'loyalty-tiers.webp', 1536),
}

json.dump(reg, open(REG, 'w'), indent=1)
tot = sum(f['bytes'] for r in reg['img'].values() for f in r['files'])
print('images: %d entries, %.1f MB of webp; brand marks: %d' % (len(reg['img']), tot / 1048576, len(reg['brand'])))
