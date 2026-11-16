/* aurora-gl.js: the aurora curtain over the hero (and the 21+ gate): a soft band of light flowing across the top of
   the scene in the badge's colours, its lower hem rippling, rising in on load and dipping toward the pointer.
   Original WebGL implementation, no dependencies. 2D simplex noise after Ian McEwan / Ashima Arts (MIT).
   Any <canvas data-aurora-gl data-stops="#hex,#hex,#hex" data-height=".42"> gets it. Without WebGL nothing happens (the
   page keeps its other aurora layers); under reduced motion it draws one still frame; off screen it sleeps. */
(() => {
  'use strict';
  const W = window, d = document;
  const canvases = Array.from(d.querySelectorAll('canvas[data-aurora-gl]'));
  if (!canvases.length) return;
  const RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
  const FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uT;uniform vec3 uC0;uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uP;uniform float uRev;uniform float uH;uniform float uAmp;uniform float uOp;',
    'vec3 m289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec2 m289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}vec3 prm(vec3 x){return m289(((x*34.0)+1.0)*x);}',
    'float sn(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);',
    'vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=m289(i);vec3 p=prm(prm(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));',
    'vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;',
    'm*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}',
    'vec3 ramp(float x){x=clamp(x,0.0,1.0);return x<0.5?mix(uC0,uC1,smoothstep(0.0,0.5,x)):mix(uC1,uC2,smoothstep(0.5,1.0,x));}',
    'void main(){vec2 uv=gl_FragCoord.xy/uRes;float y=1.0-uv.y;float X=uv.x*(uRes.x/uRes.y);vec3 col=vec3(0.0);',
    'for(int k=0;k<3;k++){float L=float(k);float t=uT*(1.0-L*0.17)+L*7.3;',
    'float warp=sn(vec2(X*0.45+t*0.02+L*13.7,t*0.05+L));',
    'float w=sn(vec2(X*0.8+warp*0.38-t*0.03,t*0.07+L*3.1))*0.72+sn(vec2(X*1.7+warp*0.55+t*0.04,t*0.1-L))*0.28;',
    'float hem=uH+L*0.075+w*0.14*uAmp;float dx=uv.x-uP.x;hem+=uP.z*0.1*exp(-dx*dx/0.018)*(1.0-L*0.4);hem=mix(-0.3,hem,uRev);',
    'float dd=hem-y;float body=exp(-max(dd,0.0)/(0.15+L*0.06))*step(0.0,dd);float edge=exp(-(dd*dd)/(0.0011+L*0.0009));',
    'float rays=0.58+0.42*sn(vec2(X*30.0+L*5.0+w*2.0,t*0.22+L));float I=(body*rays*0.8+edge*0.95)*(1.0-L*0.33);',
    'I*=1.0+uP.z*0.35*exp(-dx*dx/0.03);',
    'vec3 c=ramp(uv.x*0.86+0.07+0.1*sin(uT*0.06+L*1.7)+w*0.06);col+=c*I;}',
    'col*=uOp;gl_FragColor=vec4(col,1.0);}',
  ].join('\n');
  const hex = (h) => { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

  canvases.forEach((cv) => {
    let gl = null;
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uT', 'uC0', 'uC1', 'uC2', 'uP', 'uRev', 'uH', 'uAmp', 'uOp'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
    const stops = (cv.getAttribute('data-stops') || '#55FFD6,#4089FF,#C25CFF').split(',').map(hex);
    gl.uniform3fv(U.uC0, stops[0]); gl.uniform3fv(U.uC1, stops[1] || stops[0]); gl.uniform3fv(U.uC2, stops[2] || stops[1] || stops[0]);
    gl.uniform1f(U.uH, parseFloat(cv.getAttribute('data-height')) || 0.42);
    gl.uniform1f(U.uAmp, parseFloat(cv.getAttribute('data-amplitude')) || 1);
    gl.uniform1f(U.uOp, parseFloat(cv.getAttribute('data-opacity')) || 0.95);
    cv.classList.add('is-gl');

    // soft light: draw at a fraction of the screen resolution and let the browser smooth it
    function size() { const r = cv.getBoundingClientRect(); const k = Math.min(1, W.devicePixelRatio || 1) * 0.6; cv.width = Math.max(2, Math.round(r.width * k)); cv.height = Math.max(2, Math.round(r.height * k)); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(U.uRes, cv.width, cv.height); }
    const st = { t: 6 + Math.random() * 40, rev: RM ? 1 : 0, px: 0.5, tx: 0.5, reach: 0, inside: false, last: 0, vis: false, raf: 0 };
    function draw() { gl.uniform1f(U.uT, st.t); gl.uniform1f(U.uRev, 1 - Math.pow(1 - st.rev, 3)); gl.uniform3f(U.uP, st.px, 0, st.reach); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    function frame(now) {
      st.raf = 0; if (!st.vis || d.hidden) return;
      const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 1 / 60; st.last = now;
      st.t += dt * 0.55;
      if (st.rev < 1) st.rev = Math.min(1, st.rev + dt / 2.4);
      st.px += (st.tx - st.px) * (1 - Math.exp(-dt / 0.6));
      st.reach += ((st.inside ? 1 : 0) - st.reach) * (1 - Math.exp(-dt / (st.inside ? 0.9 : 1.4)));
      draw(); st.raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!st.raf && st.vis && !d.hidden && !RM) { st.last = 0; st.raf = requestAnimationFrame(frame); } };
    size(); draw();
    W.addEventListener('resize', () => { size(); draw(); }, { passive: true });
    if (RM) return;
    if (FINE) {
      W.addEventListener('pointermove', (e) => {
        const r = cv.getBoundingClientRect();
        st.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (st.inside) st.tx = (e.clientX - r.left) / r.width;
      }, { passive: true });
      d.addEventListener('pointerout', (e) => { if (!e.relatedTarget) st.inside = false; });
      W.addEventListener('blur', () => { st.inside = false; });
    }
    if ('IntersectionObserver' in W) new IntersectionObserver((en) => { st.vis = en[0].isIntersecting; wake(); }, { rootMargin: '60px' }).observe(cv);
    else { st.vis = true; wake(); }
    d.addEventListener('visibilitychange', wake);
  });
})();
