/* waves.js (lane W): the glowing wave across each seam where the page changes tone (and two chapter breaks on the
   home page). Original WebGL implementation, no dependencies, set up like aurora-gl.js. dividers.mjs emits, per seam,
   <div class="wv"> holding a static SVG twin (the same crest at t = 0) and a <canvas data-wave data-ph="...">.
   Here the canvas takes over: a travelling crest (a primary swell, a smaller secondary ripple and a little noise)
   drawn as a thin bright line in the aurora colours with a soft halo, the colour bands drifting and gently swirling
   along it and bending across it, a faint deep glow hanging under it and light grain inside the light. The two
   section colours (--wv-a above, --wv-b below, from dividers.css) are painted only where the crest has crossed the
   seam; everything else stays transparent, so both sections' own backgrounds meet the crest untouched. A fine pointer
   lifts the crest near it, eased in and out. Contexts are created as a wave nears the viewport; at most MAX live per
   page (the one farthest off screen hands its slot over and shows its SVG again). Off screen or in a hidden tab it
   sleeps; under reduced motion it draws one still frame (t = 0: the SVG's own curve); with forced colours, or without
   WebGL, the SVG stays. */
(() => {
  'use strict';
  const W = window, d = document;
  const els = Array.from(d.querySelectorAll('.wv'));
  if (!els.length) return;
  const mq = (q) => !!(W.matchMedia && W.matchMedia(q).matches);
  if (mq('(forced-colors: active)')) return; // dividers.css hides the decoration
  const RM = mq('(prefers-reduced-motion: reduce)');
  const FINE = mq('(hover: hover) and (pointer: fine)');
  const MAX = 5; // live WebGL canvases per page (dividers.mjs MAX_LIVE)
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  // crest() must match CREST + the clamp in src/lib/dividers.mjs (the SVG twin) at uT = 0, uP = 0
  const FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes;uniform float uHc;uniform float uT;uniform vec4 uPh;uniform float uS0;uniform float uSeam;',
    'uniform vec3 uA;uniform vec3 uB;uniform vec3 uF;uniform vec2 uP;uniform vec2 uLt;uniform float uLi;',
    // the crest, in units of the band height H: swell + ripple + two short terms (noise); the pointer's eased lift
    'float crest(float x){float y=0.5+0.13*sin(x*0.8378-uT*0.29+uPh.x)+0.034*sin(x*3.307+uT*1.05+uPh.y)',
    '+0.0108*sin(x*5.7-uT*0.62+uPh.z)+0.0072*sin(x*9.3+uT*0.95+uPh.w);',
    'float q=(x-uP.x)*0.87;y+=uP.y*exp(-q*q);return clamp(y,0.2,0.8);}',
    // the badge's aurora, ping-ponged: teal, sky, blue, violet-blue, violet and back
    'vec3 aurora(float s){float u=abs(fract(s*0.5)*2.0-1.0)*4.0;',
    'vec3 c=mix(vec3(0.333,1.0,0.839),vec3(0.18,0.769,1.0),smoothstep(0.0,1.0,u));c=mix(c,vec3(0.251,0.537,1.0),smoothstep(1.0,2.0,u));',
    'c=mix(c,vec3(0.541,0.42,1.0),smoothstep(2.0,3.0,u));return mix(c,vec3(0.761,0.361,1.0),smoothstep(3.0,4.0,u));}',
    'float grain(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453)-0.5;}',
    'void main(){float H=uRes.y;vec2 fc=gl_FragCoord.xy;float x=(fc.x-0.5*uRes.x)/H;float y=1.0-fc.y/H;',
    'float e=1.5/H;float yc=crest(x);float sl=(crest(x+e)-crest(x-e))/(2.0*e);',
    'float dp=(y-yc)*uHc/sqrt(1.0+sl*sl);float px=uHc/H;', // signed distance to the crest, CSS px (+ below); one canvas px
    // the section colours, only between the seam and the crest; each overlaps the seam by ~2 px onto its own colour
    'float below=smoothstep(-0.7*px,0.7*px,dp);float ov=2.0/H;',
    'float fB=uF.x*below*(1.0-step(uSeam+ov,y));float fA=uF.x*(1.0-below)*step(uSeam-ov,y);',
    'vec3 fill=uA*fA+uB*fB;float fa=fA+fB;',
    // the light: a ~2 px core, a tight glow, a long soft halo, and the deep glow under the crest. On a dark side the
    // core runs hot (toward white) and the halo spills; on a light side (paper, white) the core keeps its colour,
    // deepened so it reads on the light band, and only a slim tint spills
    'float ad=abs(dp);float side=step(0.0,dp);float g=mix(uF.y,uF.z,side);float core=exp(-ad*ad*0.9);',
    'float lt=mix(uLt.x,uLt.y,smoothstep(-1.2,1.2,dp));',
    'float tl=mix(mix(min(12.0,0.085*uHc),min(22.0,0.14*uHc),side),4.0,lt);', // halo tail: shorter on small bands
    'float glow=(exp(-ad*ad/40.0)*0.34+exp(-ad/tl)*0.22)*g;float deep=side*exp(-dp/(0.24*uHc))*0.1*uF.z*(1.0-uLt.y);',
    'float q=(x-uP.x)*0.87;float lift=abs(uP.y)*exp(-q*q);',
    'float win=smoothstep(0.0,0.16,y)*(1.0-smoothstep(0.84,1.0,y));', // nothing reaches the band's edges
    // colour bands drift and swirl along the crest and bend across it
    'float s=x*0.11+uS0+uT*0.035+0.07*sin(x*0.7-uT*0.21+uPh.x*1.7);',
    'vec3 cl=aurora(s)*(1.0-0.3*lt);vec3 ch=aurora(s+dp*0.006)*(1.0-0.3*lt);vec3 cd=aurora(s+0.4+dp*0.012);',
    'float k=(1.0+2.2*lift)*win*uLi;vec3 L=(mix(cl,vec3(1.0),0.5*(1.0-lt)*core)*core+ch*glow+cd*deep)*k;',
    'float La=min(1.0,(core+glow+deep)*k);L*=1.0+grain(fc+fract(uT*3.1)*vec2(61.0,113.0))*0.12;L=min(L,vec3(La));',
    'gl_FragColor=vec4(L+fill*(1.0-La),La+fa*(1.0-La));}',
  ].join('\n');
  const parse = (v) => {
    v = String(v || '').trim(); let m;
    if ((m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i))) { const h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1]; const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
    if ((m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i))) return [m[1] / 255, m[2] / 255, m[3] / 255];
    return null;
  };
  const waves = els.map((el) => ({ el, cv: el.querySelector('canvas[data-wave]'), gl: null, U: null, t: 0, vis: false, near: false, dead: false, px: 0, lift: 0 }));
  const byEl = new Map(waves.map((w) => [w.el, w]));
  const live = new Set();
  let noGL = false;

  function init(w) {
    const cv = w.cv; if (!cv || noGL) return false;
    let gl = null;
    try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) { noGL = true; return false; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) { noGL = true; return false; }
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { noGL = true; return false; }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uHc', 'uT', 'uPh', 'uS0', 'uSeam', 'uA', 'uB', 'uF', 'uP', 'uLt', 'uLi'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const cs = getComputedStyle(w.el);
    const A = parse(cs.getPropertyValue('--wv-a')) || [7 / 255, 21 / 255, 40 / 255], B = parse(cs.getPropertyValue('--wv-b')) || A;
    const num = (n, dflt) => { const v = parseFloat(cs.getPropertyValue(n)); return isFinite(v) ? v : dflt; };
    const ph = String(cv.getAttribute('data-ph') || '').split(',').map(Number), p = (i) => (isFinite(ph[i]) ? ph[i] : 0);
    gl.uniform4f(U.uPh, p(0), p(1), p(2), p(3)); gl.uniform1f(U.uS0, p(4));
    gl.uniform3fv(U.uA, A); gl.uniform3fv(U.uB, B);
    const crestOnly = w.el.classList.contains('wv--chapter') || A.every((v, i) => Math.abs(v - B[i]) < 0.002);
    gl.uniform3f(U.uF, crestOnly ? 0 : 1, num('--wv-ga', 1), num('--wv-gb', 1));
    const light = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.5 ? 1 : 0); // paper, white
    gl.uniform2f(U.uLt, light(A), light(B));
    gl.uniform1f(U.uLi, num('--wv-light', 1)); // 0 = the section colours alone (used to verify the seams)
    cv.addEventListener('webglcontextlost', () => { if (w.cv === cv && w.gl) drop(w, false); });
    w.gl = gl; w.U = U;
    return true;
  }
  // read every rect first, then write (no layout thrash): backing size (DPR capped at 1.5) and where the seam falls
  function measure(w) {
    const r = w.el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    let k = Math.min(1.5, W.devicePixelRatio || 1);
    if (r.width * k > 2600) k = 2600 / r.width;
    // a top / bot band sits inside its section (the seam is that section's top / bottom edge); a mid band sits in
    // front of the lower section (the seam is where that section starts)
    const cl = w.el.classList, host = w.el.parentElement;
    let y = null;
    if (cl.contains('wv--top') && host) y = host.getBoundingClientRect().top;
    else if (cl.contains('wv--bot') && host) y = host.getBoundingClientRect().bottom;
    else { let n = w.el.nextElementSibling; while (n && !/^(SECTION|FOOTER)$/.test(n.tagName)) n = n.nextElementSibling; if (n) y = n.getBoundingClientRect().top; }
    const seam = y === null ? 0.5 : Math.max(0, Math.min(1, (y - r.top) / r.height));
    return { cw: Math.max(2, Math.round(r.width * k)), ch: Math.max(2, Math.round(r.height * k)), hc: r.height, seam };
  }
  function apply(w, m) {
    const gl = w.gl, U = w.U;
    if (w.cv.width !== m.cw) w.cv.width = m.cw;
    if (w.cv.height !== m.ch) w.cv.height = m.ch;
    gl.viewport(0, 0, m.cw, m.ch);
    gl.uniform2f(U.uRes, m.cw, m.ch); gl.uniform1f(U.uHc, m.hc); gl.uniform1f(U.uSeam, m.seam);
  }
  function draw(w) { const gl = w.gl, U = w.U; gl.uniform1f(U.uT, w.t); gl.uniform2f(U.uP, w.px, w.lift); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  // give the canvas back to its SVG twin (a fresh canvas element, so the wave can come alive again later)
  function drop(w, lose) {
    const gl = w.gl, old = w.cv, fresh = old.cloneNode(false);
    live.delete(w); w.gl = null; w.U = null;
    w.el.classList.remove('is-gl');
    w.cv = fresh; old.replaceWith(fresh);
    if (lose && gl) { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
  }
  function acquire(w) {
    if (w.gl || w.dead || noGL) return;
    if (live.size >= MAX) {
      let far = null, fd = -Infinity;
      for (const o of live) {
        if (o.near || o.vis) continue;
        const r = o.el.getBoundingClientRect(), dist = Math.max(-r.bottom, r.top - W.innerHeight);
        if (dist > fd) { fd = dist; far = o; }
      }
      if (!far) return; // every live wave is on or near the screen: this one keeps its static SVG
      drop(far, true);
    }
    if (!init(w)) { w.dead = true; return; }
    const m = measure(w); if (m) apply(w, m);
    live.add(w); draw(w);
    w.el.classList.add('is-gl');
    wake();
  }

  // the pointer: the crest lifts near it (always up, more as the pointer rises above it), eased in and out
  let mx = -1e5, my = -1e5;
  function steer(w, dt) {
    const r = w.el.getBoundingClientRect(), h = r.height || 1;
    const vy = (my - r.top) / h, out = Math.max(0, -vy, vy - 1);
    const reach = mx >= r.left && mx <= r.right ? Math.max(0, 1 - out / 0.9) : 0; // within ~0.9 H above or below
    const near = reach * reach * (3 - 2 * reach);
    const target = -near * (0.06 + 0.1 * Math.min(1, Math.max(0, (0.6 - vy) / 1.1)));
    if (near > 0.001) { const tx = (mx - r.left - r.width / 2) / h; w.px = Math.abs(w.lift) < 0.004 ? tx : w.px + (tx - w.px) * (1 - Math.exp(-dt / 0.22)); }
    w.lift += (target - w.lift) * (1 - Math.exp(-dt / (Math.abs(target) > Math.abs(w.lift) ? 0.32 : 0.75)));
  }

  // one loop for every wave on screen
  let raf = 0, last = 0;
  function frame(now) {
    raf = 0;
    if (d.hidden) { last = 0; return; }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60; last = now;
    let on = 0;
    for (const w of live) {
      if (!w.vis) continue;
      on++; w.t += dt;
      if (FINE) steer(w, dt);
      draw(w);
    }
    if (on) raf = requestAnimationFrame(frame); else last = 0;
  }
  function wake() {
    if (raf || RM || d.hidden) return;
    for (const w of live) if (w.vis) { last = 0; raf = requestAnimationFrame(frame); return; }
  }

  if (FINE && !RM) {
    W.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') { mx = e.clientX; my = e.clientY; } }, { passive: true });
    d.addEventListener('pointerout', (e) => { if (!e.relatedTarget) { mx = -1e5; my = -1e5; } });
    W.addEventListener('blur', () => { mx = -1e5; my = -1e5; });
  }
  // after every batch of observer news (all flags first, so a wave that just left frees its slot): bring the waves on
  // screen to life, then the ones about to arrive
  const fill = () => { for (const w of waves) if (w.vis && !w.gl) acquire(w); for (const w of waves) if (w.near && !w.gl) acquire(w); };
  if ('IntersectionObserver' in W) {
    const io = new IntersectionObserver((en) => { for (const e of en) { const w = byEl.get(e.target); if (w) w.vis = e.isIntersecting; } fill(); wake(); }, { rootMargin: '40px 0px' });
    const pre = new IntersectionObserver((en) => { for (const e of en) { const w = byEl.get(e.target); if (w) w.near = e.isIntersecting; } fill(); }, { rootMargin: '100% 0px' });
    waves.forEach((w) => { io.observe(w.el); pre.observe(w.el); });
  } else {
    waves.slice(0, MAX).forEach((w) => { w.vis = w.near = true; acquire(w); });
  }
  const resize = (list) => { const ms = list.map(measure); list.forEach((w, i) => { if (ms[i]) { apply(w, ms[i]); draw(w); } }); };
  if ('ResizeObserver' in W) {
    const ro = new ResizeObserver((en) => resize(en.map((e) => byEl.get(e.target)).filter((w) => w && w.gl)));
    waves.forEach((w) => ro.observe(w.el));
  } else {
    let rz = 0;
    W.addEventListener('resize', () => { if (!rz) rz = requestAnimationFrame(() => { rz = 0; resize([...live]); }); }, { passive: true });
  }
  d.addEventListener('visibilitychange', wake);
})();
