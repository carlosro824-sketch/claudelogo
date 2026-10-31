/* ruzito-fotos.js — fotos reales y efectos de calidad para video-pizarra (Ruz Inmobiliaria).
 * Cargar en index.html después de ruzito.js y antes de scenes.js. Fotos: `python3 fotos.py casa cocina …` → ./fotos/
 *
 *   const F = FOTOS(V);
 *   const f = F.foto(g, 'fotos/casa-8134820.jpg', { x: 90, y: 520, w: 900, h: 1100, marco: 'tarjeta', boceto: 'fotos/casa-8134820-boceto.png' });
 *   F.entra(f, at, 'boceto');          // boceto | iris | persiana | mosaico | polaroid | revelado | barrido | tinta | zoom | desliza
 *   F.kenburns(f, at, 6);              // movimiento lento (se aplica solo tras entra(); pasa { kb: false } para quitarlo)
 *   F.etiqueta(f, at + 1, 'Coyoacán · 3 rec.', { lado: 'abajo' });   F.precio(f, at, '$5.9 MDP')
 *   F.pin(f, at, 0.6, 0.4, 'Aquí');    F.brillo(f, at);    F.circulo(f, at, 0.5, 0.6, 0.18)
 *   F.sale(f, at, 'cae' | 'encoge' | 'desliza' | 'funde');
 *   F.fondo(scene, 'fotos/cdmx-123.jpg', at, { oscurece: 'abajo' })   // foto a pantalla completa con degradado de marca para el texto
 *   F.galeria(g, [hrefA, hrefB, hrefC], at)                            // 3 polaroids en abanico
 *   F.antesDespues(g, hrefAntes, hrefDespues, at, { x, y, w, h })      // cortina deslizable
 *   t = F.TR.cortina(s1, s2, t)  ·  t = F.TR.persianas(s1, s2, t)  ·  t = F.TR.fotoZoom(s1, s2, t, f)   // transiciones nuevas
 *   F.particulas(g, at, dur)  ·  F.destello(at)  ·  F.vineta(scene)                                  // acabados
 * Todo usa la paleta Ruz (#203F99, #261F46, #09ABDD, #F9FAFA).
 */
function FOTOS(V) {
  const { el, tl, S, sfx, defs, W, Hh, CX, CY, P, draw, align, show, hide } = V;
  const C = { techo: '#203F99', tinta: '#261F46', turq: '#09ABDD', blanco: '#F9FAFA' };
  let uid = 0; const id = p => `rf${p}${uid++}`;
  const clip = (shapes) => { const i = id('c'); const cp = el('clipPath', { id: i, clipPathUnits: 'userSpaceOnUse' }, defs); shapes(cp); return i; };

  // sombras y filtros de marca (una sola vez)
  if (!document.getElementById('rfSombra')) defs.insertAdjacentHTML('beforeend', `
    <filter id="rfSombra" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="18"/><feOffset dy="22"/><feComponentTransfer><feFuncA type="linear" slope=".35"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="rfOscAbajo" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="${C.tinta}" stop-opacity="0"/><stop offset="1" stop-color="${C.tinta}" stop-opacity=".88"/></linearGradient>
    <linearGradient id="rfOscArriba" x1="0" y1="1" x2="0" y2="0"><stop offset=".45" stop-color="${C.tinta}" stop-opacity="0"/><stop offset="1" stop-color="${C.tinta}" stop-opacity=".85"/></linearGradient>
    <linearGradient id="rfBrillo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="rfVineta" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`);

  /* ---------- la foto ---------- */
  // marco: 'tarjeta' (borde blanco redondeado + sombra) | 'polaroid' (pie blanco + cinta) | 'redondo' | 'nada'
  function foto(parent, href, { x = 90, y = 500, w = 900, h = 1100, marco = 'tarjeta', rx = 34, boceto = null, rot = 0, pie = null } = {}) {
    const pad = marco === 'tarjeta' ? 14 : marco === 'polaroid' ? 22 : 0, pieH = marco === 'polaroid' ? 120 : 0;
    const outer = el('g', { transform: `translate(${x + w / 2},${y + h / 2}) rotate(${rot})` }, parent);
    const g = el('g', { opacity: 0 }, outer);            // g = lo que animan las entradas
    const body = el('g', { transform: `translate(${-w / 2},${-h / 2})` }, g);
    const R = marco === 'polaroid' ? 6 : marco === 'redondo' ? Math.min(w, h) / 2 : rx;
    if (marco !== 'nada') el('rect', { x: -pad, y: -pad, width: w + pad * 2, height: h + pad * 2 + pieH, rx: R + pad * 0.6, fill: '#fff', filter: 'url(#rfSombra)' }, body);
    const cid = clip(cp => el('rect', { x: 0, y: 0, width: w, height: h, rx: marco === 'polaroid' ? 2 : R }, cp));
    const win = el('g', { 'clip-path': `url(#${cid})` }, body);
    const kb = el('g', {}, win);                        // Ken Burns
    const img = el('image', { href, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, kb);
    let sketch = null;
    if (boceto) { sketch = el('g', { opacity: 0 }, win); el('rect', { width: w, height: h, fill: C.blanco }, sketch);
      sketch._img = el('image', { href: boceto, x: 0, y: 0, width: w, height: h, preserveAspectRatio: 'xMidYMid slice' }, sketch); }
    const fx = el('g', {}, win);                        // brillos, overlays dentro de la foto
    const sobre = el('g', {}, body);                    // etiquetas, pines, círculos (sobre el marco)
    if (pie && marco === 'polaroid') { const tx = V.T(sobre, w / 2, h + 82, pie, { size: 60, color: C.tinta }); tx._r.setAttribute('width', tx._b.width + 32); }
    return { outer, g, body, win, kb, img, sketch, fx, sobre, x, y, w, h, marco, href, pad, pieH };
  }

  /* ---------- entradas ---------- */
  function entra(f, at, tipo = 'zoom', o = {}) {
    const { w, h } = f, d = o.dur ?? 0.7;
    tl.set(f.g, { opacity: 1 }, S(at));
    const winClip = (fn) => { const i = clip(fn); f.win.setAttribute('clip-path', `url(#${i})`); return i; };
    const baseClip = f.win.getAttribute('clip-path');
    const restaura = (t) => tl.set(f.win, { attr: { 'clip-path': baseClip } }, S(t));
    switch (tipo) {
      case 'boceto': {   // se dibuja a lápiz y luego "se revela" a color
        if (!f.sketch) return entra(f, at, 'revelado', o);
        const cid = clip(cp => { f._r = el('rect', { x: 0, y: 0, width: 0, height: h }, cp); });
        f.sketch._img.setAttribute('clip-path', `url(#${cid})`);
        tl.set(f.sketch, { opacity: 1 }, S(at));
        tl.fromTo(f._r, { attr: { width: 0 } }, { attr: { width: w }, duration: S(1.3), ease: 'power1.inOut' }, S(at));
        tl.to(f.sketch, { opacity: 0, duration: S(0.8), ease: 'power2.inOut' }, S(at + 1.6));
        popMarco(f, at, 0.35);
        sfx('scr_pencil', at, { dur: 1.3, gain: 0.7 }); sfx('shimmer', at + 1.6, { gain: 0.5 });
        break;
      }
      case 'iris': {
        const cx = (o.cx ?? 0.5) * w, cy = (o.cy ?? 0.5) * h; let c;
        winClip(cp => { c = el('circle', { cx, cy, r: 0 }, cp); });
        tl.fromTo(c, { attr: { r: 0 } }, { attr: { r: Math.hypot(w, h) }, duration: S(d), ease: 'power3.in' }, S(at));
        restaura(at + d); popMarco(f, at, 0.3); sfx('splash', at, { gain: 0.6 }); break;
      }
      case 'persiana': {   // tiras horizontales que se abren escalonadas
        const n = o.n ?? 7, rs = [];
        winClip(cp => { for (let i = 0; i < n; i++) rs.push(el('rect', { x: 0, y: i * h / n, width: w, height: 0 }, cp)); });
        rs.forEach((r, i) => tl.fromTo(r, { attr: { height: 0 } }, { attr: { height: h / n + 1 }, duration: S(0.35), ease: 'power2.out' }, S(at + i * 0.06)));
        restaura(at + n * 0.06 + 0.35); popMarco(f, at, 0.25);
        for (let i = 0; i < 3; i++) sfx('card', at + i * 0.12, { gain: 0.4 }); break;
      }
      case 'mosaico': {    // cuadritos que aparecen en desorden
        const cols = o.cols ?? 5, rows = Math.round(cols * h / w), cw = w / cols, ch = h / rows, rs = [];
        winClip(cp => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rs.push(el('rect', { x: c * cw + cw / 2, y: r * ch + ch / 2, width: 0, height: 0 }, cp)); });
        rs.forEach((r, i) => { const k = (Math.sin(i * 91.7) * 0.5 + 0.5) * 0.6, cx = +r.getAttribute('x'), cy = +r.getAttribute('y');
          tl.fromTo(r, { attr: { x: cx, y: cy, width: 0, height: 0 } }, { attr: { x: cx - cw / 2 - 0.5, y: cy - ch / 2 - 0.5, width: cw + 1, height: ch + 1 }, duration: S(0.3), ease: 'back.out(2)' }, S(at + k)); });
        restaura(at + 0.95); popMarco(f, at, 0.25); sfx('sparkle', at + 0.2, { gain: 0.5 }); break;
      }
      case 'polaroid': {   // cae girando, rebota, se pega con cinta y se "revela"
        tl.fromTo(f.g, { y: -Hh * 0.8, rotation: -18 }, { y: 0, rotation: o.rot ?? -3, duration: S(0.7), ease: 'bounce.out', immediateRender: false }, S(at));
        revelar(f, at + 0.4, 1.2);
        const cinta = el('g', { opacity: 0 }, f.sobre);
        cinta.innerHTML = `<rect x="${w / 2 - 80}" y="${-f.pad - 26}" width="160" height="52" rx="4" fill="${C.turq}" opacity=".75" transform="rotate(-4 ${w / 2} 0)"/>`;
        tl.to(cinta, { opacity: 1, duration: S(0.15) }, S(at + 0.75));
        sfx('whoosh', at, { gain: 0.5 }); sfx('thud', at + 0.5, { gain: 0.6 }); sfx('paper', at + 0.75, { gain: 0.5 }); break;
      }
      case 'revelado': revelar(f, at, o.dur ?? 1.3); popMarco(f, at, 0.3); sfx('shimmer', at, { gain: 0.5 }); break;
      case 'barrido': {    // brochazo diagonal con banda de color de marca al frente
        let p; const L = w + h;
        winClip(cp => { p = el('path', { d: '' }, cp); });
        const band = el('path', { fill: C.turq, opacity: 0.9 }, f.fx), band2 = el('path', { fill: C.techo }, f.fx);
        const st = { k: 0 };
        tl.to(st, { k: 1, duration: S(d + 0.2), ease: 'power2.inOut' }, S(at));
        V.onFrame(() => {
          const a = st.k * (L + 160) - 120;
          p.setAttribute('d', `M0,0 L${a},0 L${a - h},${h} L0,${h} Z`);
          band.setAttribute('d', `M${a},0 L${a + 60},0 L${a + 60 - h},${h} L${a - h},${h} Z`);
          band2.setAttribute('d', `M${a + 60},0 L${a + 90},0 L${a + 90 - h},${h} L${a + 60 - h},${h} Z`);
        });
        tl.set([band, band2], { opacity: 0 }, S(at + d + 0.2)); restaura(at + d + 0.2); popMarco(f, at, 0.3);
        sfx('whoosh', at, { gain: 0.6 }); break;
      }
      case 'tinta': {      // mancha de tinta orgánica que crece
        let p; const cx = (o.cx ?? 0.5) * w, cy = (o.cy ?? 0.55) * h;
        winClip(cp => { p = el('path', { d: V.wobble(0, 0, 100, 100, 1, 7), transform: `translate(${cx},${cy}) scale(0)` }, cp); });
        const st = { s: 0 }, sMax = Math.hypot(w, h) / 85;
        tl.to(st, { s: sMax, duration: S(d + 0.2), ease: 'power2.in' }, S(at));
        V.onFrame(() => p.setAttribute('transform', `translate(${cx},${cy}) scale(${st.s.toFixed(3)})`));
        restaura(at + d + 0.2); popMarco(f, at, 0.3); sfx('splash', at, { gain: 0.6 }); break;
      }
      case 'desliza': {    // entra deslizando desde un lado con inclinación y asienta
        const lado = o.lado === 'izq' ? -1 : 1;
        tl.fromTo(f.g, { x: lado * (W + 200), skewX: -lado * 12 }, { x: 0, skewX: 0, duration: S(d), ease: 'expo.out', immediateRender: false }, S(at));
        sfx('whoosh', at, { gain: 0.6 }); break;
      }
      case 'zoom': default: {   // golpe de zoom con destello blanco
        tl.fromTo(f.g, { scale: 1.35, opacity: 0 }, { scale: 1, opacity: 1, duration: S(0.5), ease: 'expo.out', immediateRender: false }, S(at));
        const fl = el('rect', { width: w, height: h, fill: '#fff', opacity: 0 }, f.fx);
        tl.fromTo(fl, { opacity: 0.8 }, { opacity: 0, duration: S(0.45), immediateRender: false }, S(at + 0.05));
        sfx('kick', at, { gain: 0.7 }); sfx('whoosh_in', at - 0.2, { gain: 0.4 }); break;
      }
    }
    if (o.kb !== false) kenburns(f, at, o.kbDur ?? 7, o.kbOpts);
    return f;
  }
  function popMarco(f, at, d = 0.3) { tl.fromTo(f.g, { scale: 0.92 }, { scale: 1, duration: S(d + 0.2), ease: 'back.out(2)', transformOrigin: '50% 50%', immediateRender: false }, S(at)); }
  function revelar(f, at, dur) {   // de gris y borroso a color y nítido
    const fid = id('rv');
    defs.insertAdjacentHTML('beforeend', `<filter id="${fid}"><feGaussianBlur stdDeviation="0"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1"/><feFuncG type="linear" slope="1"/><feFuncB type="linear" slope="1"/></feComponentTransfer></filter>`);
    const fe = document.getElementById(fid), bl = fe.children[0], sat = fe.children[1], fr = [...fe.children[2].children];
    f.kb.setAttribute('filter', `url(#${fid})`);
    const st = { b: 14, s: 0, l: 1.6 };
    const ap = () => { bl.setAttribute('stdDeviation', st.b.toFixed(2)); sat.setAttribute('values', st.s.toFixed(3)); fr.forEach(n => n.setAttribute('slope', st.l.toFixed(3))); };
    ap();
    tl.to(st, { b: 0, s: 1, l: 1, duration: S(dur), ease: 'power2.out' }, S(at));
    const fin = S(at + dur); V.onFrame(T => { ap(); if (T >= fin) f.kb.removeAttribute('filter'); else f.kb.setAttribute('filter', `url(#${fid})`); });
  }

  /* ---------- movimiento ---------- */
  // zoom/paneo lento continuo. opts: { de: 1.0, a: 1.15, dx: -0.04, dy: -0.03 } (dx/dy en fracción del tamaño)
  function kenburns(f, at, dur = 7, { de = 1.02, a = 1.16, dx = null, dy = null } = {}) {
    const k = (f.href.length * 37) % 4;                         // dirección variada pero determinista
    const DX = dx ?? [-0.04, 0.04, -0.03, 0.03][k], DY = dy ?? [-0.03, -0.02, 0.03, 0.02][k];
    const st = { s: de, x: 0, y: 0 }, { w, h } = f;
    const ap = () => f.kb.setAttribute('transform', `translate(${w / 2 + st.x * w},${h / 2 + st.y * h}) scale(${st.s.toFixed(4)}) translate(${-w / 2},${-h / 2})`);
    ap();
    tl.to(st, { s: a, x: DX, y: DY, duration: S(dur), ease: 'sine.inOut' }, S(at));
    V.onFrame(ap);
  }
  function sale(f, at, tipo = 'encoge') {
    const d = 0.45;
    if (tipo === 'cae') tl.to(f.g, { y: Hh, rotation: 14, duration: S(d), ease: 'power2.in' }, S(at));
    else if (tipo === 'desliza') tl.to(f.g, { x: -W - 200, skewX: 10, duration: S(d), ease: 'power3.in' }, S(at));
    else if (tipo === 'funde') tl.to(f.g, { opacity: 0, duration: S(d) }, S(at));
    else tl.to(f.g, { scale: 0, rotation: -8, duration: S(d), ease: 'back.in(2)', transformOrigin: '50% 50%' }, S(at));
    tl.set(f.g, { opacity: 0 }, S(at + d));
    sfx('whoosh', at, { gain: 0.4 });
  }

  /* ---------- acentos sobre la foto ---------- */
  function etiqueta(f, at, texto, { lado = 'abajo', color = C.techo, size = 54 } = {}) {
    const { w, h } = f, g = el('g', { opacity: 0 }, f.sobre);
    const t = el('text', { x: 0, y: 0, 'font-size': size, 'font-family': 'Inter, Arial, sans-serif', 'font-weight': 800, fill: '#fff', 'text-anchor': 'middle' }, g);
    t.textContent = texto; const b = t.getBBox(), pw = b.width + 70, ph = size * 1.7;
    const bx = w / 2, by = lado === 'arriba' ? -f.pad + 10 : h + f.pad - 10;
    const pill = el('rect', { x: -pw / 2, y: -ph / 2, width: pw, height: ph, rx: ph / 2, fill: color, stroke: '#fff', 'stroke-width': 6 }, g);
    g.insertBefore(pill, t); t.setAttribute('y', size * 0.36);
    el('circle', { cx: -pw / 2 + 2, cy: 0, r: 13, fill: C.turq, stroke: '#fff', 'stroke-width': 5 }, g);
    g.setAttribute('transform', `translate(${bx},${by})`);
    tl.set(g, { opacity: 1 }, S(at));
    tl.fromTo(g, { scale: 0, rotation: -6 }, { scale: 1, rotation: 0, duration: S(0.45), ease: 'back.out(2.5)', transformOrigin: '50% 50%', immediateRender: false }, S(at));
    sfx('pop', at, { gain: 0.6 });
    return g;
  }
  function precio(f, at, texto, o = {}) {   // sello de precio en la esquina superior derecha
    const g = el('g', { opacity: 0, transform: `translate(${f.w - 120},120) rotate(8)` }, f.sobre);
    g.innerHTML = `<circle r="120" fill="${C.turq}" stroke="#fff" stroke-width="10"/><circle r="100" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="8 8"/>
      <text y="-28" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="32" fill="#fff">${o.arriba ?? 'DESDE'}</text>
      <text y="30" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="${texto.length > 7 ? 44 : 56}" fill="#fff">${texto}</text>`;
    tl.set(g, { opacity: 1 }, S(at));
    tl.fromTo(g, { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 1, duration: S(0.3), ease: 'power4.in', transformOrigin: '50% 50%', immediateRender: false }, S(at));
    tl.to(f.g, { x: 8, duration: S(0.04), yoyo: true, repeat: 3 }, S(at + 0.3));
    sfx('stamp', at + 0.28, { gain: 0.8 });
    return g;
  }
  function pin(f, at, fx, fy, texto = null) {   // pin de ubicación que cae y rebota (fx, fy en fracción de la foto)
    const g = el('g', { opacity: 0, transform: `translate(${fx * f.w},${fy * f.h})` }, f.sobre);
    g.innerHTML = `<ellipse cy="4" rx="22" ry="8" fill="#000" opacity=".25"/>
      <path d="M0,0 C-8,-20 -40,-44 -40,-76 A40,40 0 1,1 40,-76 C40,-44 8,-20 0,0 Z" fill="${C.techo}" stroke="#fff" stroke-width="6"/>
      <circle cy="-76" r="15" fill="#fff"/>` + (texto ? `<g transform="translate(0,-150)"><rect x="${-texto.length * 15 - 24}" y="-34" width="${texto.length * 30 + 48}" height="60" rx="30" fill="#fff"/>
      <text y="9" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="34" fill="${C.tinta}">${texto}</text></g>` : '');
    tl.set(g, { opacity: 1 }, S(at));
    tl.fromTo(g, { y: -300 }, { y: 0, duration: S(0.6), ease: 'bounce.out', immediateRender: false }, S(at));
    sfx('thud', at + 0.35, { gain: 0.5 });
    return g;
  }
  function brillo(f, at, dur = 0.9) {   // destello de luz que cruza la foto
    const r = el('rect', { x: -f.w, y: -f.h * 0.2, width: f.w * 0.5, height: f.h * 1.4, fill: 'url(#rfBrillo)', transform: 'skewX(-20)' }, f.fx);
    tl.fromTo(r, { attr: { x: -f.w * 0.6 } }, { attr: { x: f.w * 1.6 }, duration: S(dur), ease: 'power2.inOut', immediateRender: false }, S(at));
    sfx('shimmer', at, { gain: 0.35 });
  }
  function circulo(f, at, fx, fy, fr = 0.15, color = C.turq) {   // círculo de plumón alrededor de un detalle
    const p = P(f.sobre, V.wobble(fx * f.w, fy * f.h, fr * f.w, fr * f.w * 0.8, 1.12, 3), { color, w: 12 });
    draw(p, at, 0.5);
    return p;
  }

  /* ---------- composiciones ---------- */
  // foto a pantalla completa en el fondo de una escena, con degradado de marca para que el texto se lea
  function fondo(scene, href, at, { oscurece = 'abajo', entrada = 'zoom', kbDur = 8, boceto = null } = {}) {
    const f = foto(scene.bg, href, { x: -40, y: -40, w: W + 80, h: Hh + 80, marco: 'nada', rx: 0, boceto });
    if (oscurece) { const ov = el('rect', { x: 0, y: 0, width: f.w, height: f.h, fill: oscurece === 'arriba' ? 'url(#rfOscArriba)' : oscurece === 'todo' ? C.tinta : 'url(#rfOscAbajo)', opacity: oscurece === 'todo' ? 0.45 : 1 }, f.win); }
    entra(f, at, entrada, { kbDur });
    return f;
  }
  function galeria(parent, hrefs, at, { y = 560, w = 560, h = 700 } = {}) {   // 3 polaroids que caen en abanico
    const pos = [[-300, 40, -9], [0, -30, 2], [300, 50, 10]];
    return hrefs.slice(0, 3).map((href, i) => {
      const [dx, dy, r] = pos[i];
      const f = foto(parent, href, { x: CX - w / 2 + dx, y: y + dy, w, h, marco: 'polaroid', rot: r });
      entra(f, at + i * 0.25, 'polaroid', { rot: 0, kbDur: 6 });
      return f;
    });
  }
  function antesDespues(parent, hrefA, hrefB, at, { x = 90, y = 520, w = 900, h = 1100, dur = 1.8 } = {}) {
    const A = foto(parent, hrefA, { x, y, w, h }), B = foto(A.win, hrefB, { x: 0, y: 0, w, h, marco: 'nada' });
    B.outer.setAttribute('transform', `translate(${w / 2},${h / 2})`);
    let r; const cid = clip(cp => { r = el('rect', { x: 0, y: 0, width: w, height: h }, cp); }); B.win.setAttribute('clip-path', `url(#${cid})`);
    const bar = el('g', { opacity: 0 }, A.sobre);
    bar.innerHTML = `<rect x="-5" y="0" width="10" height="${h}" fill="#fff"/><circle cy="${h / 2}" r="38" fill="${C.techo}" stroke="#fff" stroke-width="7"/><path d="M-14,${h / 2} l-10,0 m10,-12 l-12,12 l12,12 M14,${h / 2} l10,0 m-10,-12 l12,12 l-12,12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    entra(A, at, 'zoom', { kb: false }); tl.set(B.g, { opacity: 1 }, S(at));
    tl.set(bar, { opacity: 1 }, S(at + 0.4));
    const st = { p: 1 }; const ap = () => { r.setAttribute('x', st.p * w); r.setAttribute('width', w - st.p * w); bar.setAttribute('transform', `translate(${st.p * w},0)`); };
    ap(); tl.to(st, { p: 0.5, duration: S(dur), ease: 'power2.inOut' }, S(at + 0.5));
    tl.to(st, { p: 0.15, duration: S(0.7), ease: 'power2.inOut', yoyo: true, repeat: 1 }, S(at + 0.5 + dur));
    V.onFrame(ap);
    sfx('whoosh', at + 0.5, { gain: 0.4 });
    return { A, B };
  }

  /* ---------- acabados ---------- */
  function particulas(parent, at, dur = 3, { n = 26, color = C.turq } = {}) {   // destellos flotantes (sparkles de marca)
    for (let i = 0; i < n; i++) {
      const hs = k => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
      const s = el('path', { d: 'M0,-12 L3,-3 L12,0 L3,3 L0,12 L-3,3 L-12,0 L-3,-3 Z', fill: i % 3 ? color : '#fff', opacity: 0, transform: `translate(${hs(1) * W},${hs(2) * Hh})` }, parent);
      const t0 = at + hs(3) * dur * 0.7;
      tl.fromTo(s, { opacity: 0, scale: 0 }, { opacity: 0.9, scale: 0.6 + hs(4), duration: S(0.35), ease: 'back.out(3)', yoyo: true, repeat: 1, repeatDelay: S(0.4), transformOrigin: '50% 50%', immediateRender: false }, S(t0));
      tl.to(s, { y: '-=60', duration: S(1.2), ease: 'none' }, S(t0));
    }
  }
  function destello(at) { const r = el('rect', { width: W, height: Hh, fill: '#fff', opacity: 0 }, V.screen); tl.fromTo(r, { opacity: 0.85 }, { opacity: 0, duration: S(0.4), immediateRender: false }, S(at)); }
  function vineta(scene) { el('rect', { x: -60, y: -60, width: W + 120, height: Hh + 120, fill: 'url(#rfVineta)' }, scene.cam); }

  /* ---------- transiciones nuevas ---------- */
  const TR = {
    // dos bandas de marca (azul y turquesa) barren la pantalla y descubren la escena nueva
    cortina(from, to, t) {
      t = align(t, 0.35); const at = t, g = el('g', {}, V.screen);
      const a = el('rect', { x: 0, y: 0, width: W, height: Hh, fill: C.turq }, g), b = el('rect', { x: 0, y: 0, width: W, height: Hh, fill: C.techo }, g);
      tl.fromTo(a, { attr: { x: -W } }, { attr: { x: 0 }, duration: S(0.3), ease: 'power3.in', immediateRender: false }, S(at));
      tl.fromTo(b, { attr: { x: -W } }, { attr: { x: 0 }, duration: S(0.3), ease: 'power3.in', immediateRender: false }, S(at + 0.08));
      gsap.set([a, b], { attr: { x: -W } });
      show(to, at + 0.4); hide(from, at + 0.4);
      tl.to(b, { attr: { x: W }, duration: S(0.35), ease: 'power3.out' }, S(at + 0.42));
      tl.to(a, { attr: { x: W }, duration: S(0.35), ease: 'power3.out' }, S(at + 0.5));
      sfx('whoosh', at, { gain: 0.7 });
      return at + 0.85;
    },
    // persianas verticales que giran (de una escena a otra)
    persianas(from, to, t, { n = 8 } = {}) {
      t = align(t, 0.3); const at = t, cw = W / n, rs = [];
      const cid = clip(cp => { for (let i = 0; i < n; i++) rs.push(el('rect', { x: i * cw + cw / 2, y: 0, width: 0, height: Hh }, cp)); });
      to.inner.setAttribute('clip-path', `url(#${cid})`); show(to, at);
      rs.forEach((r, i) => tl.fromTo(r, { attr: { x: i * cw + cw / 2, width: 0 } }, { attr: { x: i * cw - 0.5, width: cw + 1 }, duration: S(0.4), ease: 'power2.inOut' }, S(at + i * 0.04)));
      const end = at + n * 0.04 + 0.4;
      tl.set(to.inner, { attr: { 'clip-path': 'none' } }, S(end)); hide(from, end);
      sfx('card', at, { gain: 0.5 }); sfx('card', at + 0.15, { gain: 0.4 });
      return end;
    },
    // la cámara se mete en una foto de la escena y la siguiente escena aparece desde ella
    fotoZoom(from, to, t, f) {
      t = align(t, 0.55); const at = t;
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2, z = Math.max(W / f.w, Hh / f.h) * 1.15;
      tl.to(from.inner, { scale: z, svgOrigin: `${cx} ${cy}`, x: CX - cx, y: CY - cy, duration: S(0.55), ease: 'power3.in' }, S(at));
      show(to, at + 0.5);
      tl.fromTo(to.inner, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, svgOrigin: `${CX} ${CY}`, duration: S(0.35), immediateRender: false }, S(at + 0.5));
      hide(from, at + 0.85); sfx('whoosh_in', at - 0.2, { gain: 0.8 });
      return at + 0.85;
    },
  };

  return { foto, entra, kenburns, sale, etiqueta, precio, pin, brillo, circulo, fondo, galeria, antesDespues, particulas, destello, vineta, TR, COLORES: C };
}
