# encode-loops.py: re-encode the generated hero loop for the web (no re-timing).
#   python3 -I tools/encode-loops.py
# Frames are decoded with OpenCV, resized with an area filter, and piped as raw BGRA into private/bin/encode-h264
# (tools/encode-h264.swift, macOS VideoToolbox: H.264 High, CABAC, the bitrate honoured). Generated loops get a
# short crossfade from their last frames into their first so they repeat without a jump. Writes src/assets/video/.
import os, subprocess, sys
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BIN = os.path.join(ROOT, 'private/bin/encode-h264')
SWIFT = os.path.join(ROOT, 'tools/encode-h264.swift')
OUT = os.path.join(ROOT, 'src/assets/video'); os.makedirs(OUT, exist_ok=True)
IMG = os.path.join(ROOT, 'src/assets/img')
if not os.path.exists(BIN) or os.path.getmtime(BIN) < os.path.getmtime(SWIFT):
    os.makedirs(os.path.dirname(BIN), exist_ok=True)
    subprocess.run(['swiftc', '-O', SWIFT, '-o', BIN], check=True)

def read(path):
    c = cv2.VideoCapture(path); fr = []
    while True:
        ok, f = c.read()
        if not ok: break
        fr.append(f)
    fps = c.get(cv2.CAP_PROP_FPS) or 24
    return fr, fps

def fit(f, w, h):
    # cover-crop to the target aspect, then area-resize
    ih, iw = f.shape[:2]
    s = max(w / iw, h / ih)
    nw, nh = int(round(iw * s)), int(round(ih * s))
    r = cv2.resize(f, (nw, nh), interpolation=cv2.INTER_AREA)
    x, y = (nw - w) // 2, (nh - h) // 2
    return r[y:y + h, x:x + w]

def encode(frames, out, w, h, fps, kbps):
    p = subprocess.Popen([BIN, out, str(w), str(h), str(int(round(fps))), str(len(frames)), str(kbps)], stdin=subprocess.PIPE)
    for f in frames:
        p.stdin.write(cv2.cvtColor(f, cv2.COLOR_BGR2BGRA).tobytes())
    p.stdin.close(); p.wait()
    if p.returncode: sys.exit('encoder failed for ' + out)
    print(os.path.basename(out), w, 'x', h, len(frames), 'frames', round(os.path.getsize(out) / 1024), 'KB')

def crossfade(frames, n=14):
    # fold the last n frames into the first n so frame[-1] flows into frame[0]
    head, body = frames[:n], frames[n:]
    out = list(body)
    for i in range(n):
        t = (i + 1) / (n + 1)
        out[-n + i] = cv2.addWeighted(body[-n + i], 1 - t, head[i], t, 0)
    return out

XMP_AI = ('<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF '
          'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" '
          'xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" '
          'Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"/>'
          '</rdf:RDF></x:xmpmeta><?xpacket end="w"?>').encode()

def poster(frame, name, w):
    # first frame of a generated loop: registered in src/content/images.json like every other image
    import json
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    im = Image.fromarray(rgb)
    fn = name + '-%d.webp' % w
    im.save(os.path.join(IMG, fn), 'WEBP', quality=86, method=6, xmp=XMP_AI)
    reg_path = os.path.join(ROOT, 'src/content/images.json')
    reg = json.load(open(reg_path)) if os.path.exists(reg_path) else {'img': {}, 'media': {}}
    reg['img'][name] = {'alt': 'Illustration: first frame of a generated ' + name.replace('loop-', '') + ' loop', 'ai': 'generated', 'w': im.width, 'h': im.height,
                 'files': [{'file': 'img/' + fn, 'w': im.width, 'h': im.height, 'bytes': os.path.getsize(os.path.join(IMG, fn))}], 'source': 'private/gen/out/' + name + '.result.json'}
    json.dump(reg, open(reg_path, 'w'), indent=1)

# generated loop (fal Kling 2.5 Turbo Pro from the hero still), crossfaded so it repeats without a jump
for name, src, sizes in [('hero-aurora', 'loop-hero-0.mp4', [(2200, 940, 5200), (1280, 548, 2200)])]:
    fr, fps = read(os.path.join(ROOT, 'private/gen/out', src))
    for (w, h, kbps) in sizes:
        out = crossfade([fit(f, w, h) for f in fr])
        encode(out, os.path.join(OUT, name + ('' if w == sizes[0][0] else '-sm') + '.mp4'), w, h, fps, kbps)
