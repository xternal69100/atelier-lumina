(() => {
  'use strict';
  const canvas = document.querySelector('#psyche-field');
  const master = document.querySelector('#motion-master');
  if (!canvas || !master) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let visible = !document.hidden;
  let zoneVisible = true;
  let raf = 0;
  let start = performance.now();
  let pointer = [.5, .5];
  let scroll = 0;

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: innerWidth < 700 ? 'low-power' : 'high-performance'
  });

  const syncControls = () => {
    document.documentElement.classList.toggle('motion-paused', paused);
    const label = reduced.matches ? 'Mouvement réduit' : paused ? 'Relancer le signal' : 'Suspendre le signal';
    master.textContent = label;
    master.title = label;
    master.setAttribute('aria-label', label);
    master.setAttribute('aria-pressed', String(paused));
    master.disabled = reduced.matches;
  };

  if (!gl) {
    document.documentElement.classList.add('no-webgl');
    master.textContent = 'Signal statique';
    master.disabled = true;
    master.setAttribute('aria-pressed', 'false');
    return;
  }

  const vertexSource = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fragmentSource = `
    precision highp float;
    uniform vec2 r, m;
    uniform float t, s;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.,a=.5; mat2 q=mat2(.8,.6,-.6,.8);
      for(int i=0;i<5;i++){v+=a*noise(p);p=q*p*2.03+17.17;a*=.5;}
      return v;
    }
    void main(){
      vec2 u=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
      vec2 mp=(m-.5)*vec2(r.x/r.y,1.);
      float d=length(u-mp),vortex=exp(-d*d*3.2);
      float cs=cos(vortex*.65),sn=sin(vortex*.65);
      u=mat2(cs,-sn,sn,cs)*u;
      vec2 q=vec2(fbm(u*2.15+vec2(0.,t*.035+s*.08)),fbm(u*2.15+vec2(4.7,-t*.027)));
      vec2 w=u+1.75*(q-.5);
      float a=fbm(w*3.1+q*1.4);
      float bands=.5+.5*cos(34.*a+5.*fbm(w*5.2)+t*.18+s*7.);
      float fine=smoothstep(.72,.98,bands),veil=smoothstep(.2,.92,a);
      vec3 blue=vec3(.067,.09,.91),deep=vec3(.03,.035,.23),bone=vec3(.949,.933,.898),acid=vec3(.906,1.,.322);
      vec3 col=mix(deep,blue,.48+.52*veil);
      col=mix(col,bone,fine*.34);
      col=mix(col,acid,pow(fine,6.)*.72);
      col+=.06*vortex*vec3(.2,.35,1.);
      gl_FragColor=vec4(col,.92);
    }`;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn('Champ Mnémosyne indisponible', error);
    document.documentElement.classList.add('no-webgl');
    master.textContent = 'Signal statique';
    master.disabled = true;
    return;
  }

  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'r');
  const mouse = gl.getUniformLocation(program, 'm');
  const time = gl.getUniformLocation(program, 't');
  const scrollUniform = gl.getUniformLocation(program, 's');

  const resize = () => {
    const scale = innerWidth < 700 ? .5 : .65;
    const dpr = Math.min(devicePixelRatio || 1, 1.25);
    canvas.width = Math.max(1, Math.round(innerWidth * scale * dpr));
    canvas.height = Math.max(1, Math.round(innerHeight * scale * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (now) => {
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform2f(mouse, pointer[0], 1 - pointer[1]);
    gl.uniform1f(time, paused ? 1.7 : (now - start) / 1000);
    gl.uniform1f(scrollUniform, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!paused && visible && zoneVisible) raf = requestAnimationFrame(draw);
    else raf = 0;
  };

  const sync = () => {
    syncControls();
    cancelAnimationFrame(raf);
    raf = 0;
    draw(performance.now());
  };

  const activeZones = new Set();
  const zoneObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) activeZones.add(entry.target);
      else activeZones.delete(entry.target);
    }
    const next = activeZones.size > 0;
    if (next === zoneVisible) return;
    zoneVisible = next;
    if (zoneVisible && visible && !paused) sync();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }, {rootMargin: '8% 0px', threshold: 0});
  document.querySelectorAll('.hero,.brain,.finale').forEach((zone) => zoneObserver.observe(zone));

  addEventListener('resize', () => { resize(); sync(); }, {passive:true});
  addEventListener('pointermove', (event) => { pointer = [event.clientX / innerWidth, event.clientY / innerHeight]; }, {passive:true});
  addEventListener('scroll', () => { scroll = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); }, {passive:true});
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && !paused && zoneVisible) sync();
    else if (!visible) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  master.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener?.('change', (event) => { paused = event.matches; sync(); });

  resize();
  sync();
})();
