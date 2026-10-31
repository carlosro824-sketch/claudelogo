/* ruzito.js — Ruzito, mascota oficial de Ruz Inmobiliaria, para el motor pizarrón (template/engine.js).
 *
 * Uso en scenes.js:
 *   1) index.html: <script src="ruzito.js"></script> ANTES de scenes.js
 *   2) bootVideo(async (V) => {
 *        const R = RUZITO(V);
 *        const m = V.mover(g, 400, 900, 2.2);          // (x, y) = esquina SUPERIOR izq.; mide ~234×279 × escala
 *        const c = R.ruzito(m.g, 0, 0, 1);             // { outline: true } en fondos gis/plano
 *        R.draw(c, a + 0.5, 1.4);  // o R.pop(c, at)
 *        R.expr(c, at, 'feliz' | 'guino' | 'sorpresa' | 'celebra'
 *                     | 'pensativo' | 'preocupado' | 'senala' | 'enamorado' | 'aprobado'
 *                     | 'alerta' | 'investiga' | 'llamanos' | 'se-vende' | 'se-renta');
 *        // face/wave/arms/hop/wiggle/take del motor funcionan igual sobre c
 *        ...escenas...
 *        t = R.cierre(t);        // OBLIGATORIO: cierre con logo + datos de la empresa (y Ruzito celebrando)
 *        R.logo(t);              // OBLIGATORIO y al final del build: logo fijo en la esquina inferior derecha todo el video
 *        return t;
 *      }, { ...RUZITO_CONFIG, speed: 0.8 });
 *   Requiere logo-ruz.png (logo original) en la carpeta del proyecto.
 *
 * Colores oficiales: techo #203F99 · puerta, llave y chimenea #09ABDD · contorno #261F46 · fachada #F9FAFA
 */
const RUZ_EMPRESA = {
  logo: 'logo-ruz.png',               // logo original 1920×1264 (no recrearlo nunca)
  nombre: 'Ruz Inmobiliaria',
  tel: '55 8848 5444',
  correo: 'inmobiliariaruz@gmail.com',
  web: 'ruzinmobiliaria.mx',
  dir: ['Miguel Ángel de Quevedo 443-24', 'Col. Romero de Terreros, Coyoacán, CDMX'],
};
const RUZ = { techo: '#203F99', puerta: '#09ABDD', contorno: '#261F46', fachada: '#F9FAFA', mejilla: '#8FD6EE' };

// Silueta en coords locales (pies en y = height). Cuerpo = fachada; techo, chimenea, puerta, ventana y llave se agregan encima.
const RUZITO_SHAPE = {
  body: 'M33,112 L201,112 L201,229 Q201,250 180,250 L54,250 Q33,250 33,229 Z',
  armL: 'M37,170 Q12,184 6,226',            // brazo en reposo (cae a la izquierda)
  armR: 'M197,176 Q222,188 231,212',         // brazo derecho, sostiene la llave
  legs: [
    'M78,248 L95,248 L95,265 L78,265 Z',
    'M138,248 L155,248 L155,265 L138,265 Z',
    'M63,270 a20,8.5 0 1,0 40,0 a20,8.5 0 1,0 -40,0 Z',
    'M131,270 a20,8.5 0 1,0 40,0 a20,8.5 0 1,0 -40,0 Z',
  ],
  eyes: [[86, 146], [147, 146]], mouth: [116, 178],
  pivotL: [37, 170], pivotR: [197, 176], handL: [6, 226], handR: [231, 212],
  width: 234, height: 279, offsetX: 0, emoteAt: [228, -20],
};

const RUZITO_CONFIG = {
  palette: { ink: RUZ.contorno, blue: RUZ.techo, teal: RUZ.puerta },
  hatches: { ruzFachada: [RUZ.fachada, '#E4E7EE'], ruzTecho: [RUZ.techo, '#1A347F'], ruzPuerta: [RUZ.puerta, '#0893BF'] },
  mascotTheme: 'ruzFachada',
  mascotShape: RUZITO_SHAPE,
};

function RUZITO(V) {
  const { el, P, H, done, draw, tl, S, sfx, face, wave, arms, hop, wink, emote, take } = V;

  const EYE_N = (ink, hl) => `<ellipse rx="15" ry="19" fill="${ink}"/><circle cx="4" cy="-6" r="5.5" fill="${hl}"/><circle cx="-6" cy="8" r="2.4" fill="${hl}"/>`;
  const EYE_W = (ink, hl) => `<ellipse rx="17" ry="21" fill="${ink}"/><circle cx="5" cy="-7" r="6.5" fill="${hl}"/><circle cx="-7" cy="9" r="2.8" fill="${hl}"/>`;
  const EYE_H = ink => `<path d="M-13,5 Q0,-11 13,5" fill="none" stroke="${ink}" stroke-width="5.5" stroke-linecap="round"/>`;

  function ruzito(parent, x, y, s, { outline = false, ink = null, ground = null, shadow = 'shadow', key = true } = {}) {
    const INKC = ink || (outline ? '#ffffff' : RUZ.contorno);
    const fill = k => (outline ? 'none' : H(k));
    const c = V.mascot(parent, x, y, s, { theme: outline ? null : 'ruzFachada', ink: INKC, ground, shadow, shape: RUZITO_SHAPE });
    const w = 7.5 / s;

    // brazos: trazo grueso + mano redonda blanca (el motor los hace cerrados; aquí los volvemos línea)
    c.arms.forEach(a => {
      if (a._fill) { a._fill.remove(); a._fill = null; }
      a.setAttribute('stroke-width', w * 1.5);
      const len = a.getTotalLength(); a._len = len;
      a.setAttribute('stroke-dasharray', `${len} ${len}`); a.setAttribute('stroke-dashoffset', len);
    });
    c.hands = ['L', 'R'].map(sd => {
      const [hx, hy] = RUZITO_SHAPE['hand' + sd];
      const hp = P(c.armG[sd], `M${hx - 12},${hy} a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 Z`, { color: INKC, w, fill: outline ? 'none' : RUZ.fachada });
      c.armG[sd].insertBefore(c.hand[sd], null); // la mano-prop queda encima
      return hp;
    });
    // piernas oscuras, zapatos azules
    c.legs.forEach((l, i) => { if (l._fill) l._fill.setAttribute('fill', outline ? 'none' : (i < 2 ? RUZ.contorno : RUZ.techo)); });

    // detalles de casa
    const sq = c.sq, front = c.body.nextSibling; // el grupo de la cara va después del cuerpo
    const chimenea = P(sq, 'M152,12 L184,12 L184,66 L152,66 Z', { color: INKC, w, fill: fill('ruzPuerta') });
    const tapa = P(sq, 'M146,2 Q146,-2 150,-2 L187,-2 Q191,-2 191,2 L191,13 Q191,17 187,17 L150,17 Q146,17 146,13 Z', { color: INKC, w, fill: fill('ruzTecho') });
    [chimenea, tapa].forEach(p => { if (p._fill) sq.insertBefore(p._fill, c.legs[0]._fill || c.legs[0]); sq.insertBefore(p, c.legs[0]._fill || c.legs[0]); });
    const techo = P(sq, 'M116,3 L226,113 L8,113 Z', { color: INKC, w: w * 1.1, fill: fill('ruzTecho') });
    const ventana = P(sq, 'M99.5,74 a16.5,16.5 0 1,0 33,0 a16.5,16.5 0 1,0 -33,0 Z M116,57.5 L116,90.5 M99.5,74 L132.5,74', { color: INKC, w: w * 0.85, fill: outline ? 'none' : RUZ.fachada });
    const puerta = P(sq, 'M98,248 L98,222 Q98,203 116.5,203 Q135,203 135,222 L135,248', { color: INKC, w, fill: fill('ruzPuerta') });
    const manija = el('circle', { cx: 127, cy: 234, r: 3.2, fill: INKC, opacity: 0 }, sq);
    const mejillas = el('g', { opacity: 0 }, sq);
    if (!outline) mejillas.innerHTML = `<ellipse cx="62" cy="173" rx="12.5" ry="6.5" fill="${RUZ.mejilla}"/><ellipse cx="171" cy="173" rx="12.5" ry="6.5" fill="${RUZ.mejilla}"/>`;
    // brazos encima del techo (al levantarlos no se esconden) y la cara arriba de todo
    sq.appendChild(c.armG.L); sq.appendChild(c.armG.R);
    if (front) sq.appendChild(c.eyesWrap.parentNode);
    c.house = [chimenea, tapa, techo, ventana, puerta];
    c.extras = [manija, mejillas];

    // ojos de Ruzito (óvalo grande con brillos)
    const hl = outline ? 'none' : '#ffffff';
    const eyeSet = (st, fn) => [...c.eyeSets[st].children].forEach(e => { e.innerHTML = fn(INKC, hl); });
    eyeSet('normal', EYE_N); eyeSet('wide', EYE_W); eyeSet('happy', EYE_H);
    // boca de Ruzito por defecto
    c.mouthSets.smile.innerHTML = `<path d="M-15,-3 Q0,11 15,-3" fill="none" stroke="${INKC}" stroke-width="5" stroke-linecap="round"/>`;

    // llave en la mano derecha
    if (key) {
      c.key = el('g', { opacity: 0 }, c.hand.R);
      c.key.innerHTML = `<circle cx="1" cy="19" r="8.5" fill="${outline ? 'none' : RUZ.puerta}" stroke="${INKC}" stroke-width="${w * 0.6}"/>
        <circle cx="1" cy="19" r="3" fill="${outline ? 'none' : RUZ.fachada}" stroke="${INKC}" stroke-width="${w * 0.4}"/>
        <path d="M1,27 L1,60 M1,47 L9,47 M1,54 L7,54" fill="none" stroke="${INKC}" stroke-width="${w * 0.85}" stroke-linecap="round"/>
        <path d="M1,27 L1,60 M1,47 L9,47 M1,54 L7,54" fill="none" stroke="${outline ? INKC : RUZ.puerta}" stroke-width="${w * 0.4}" stroke-linecap="round"/>`;
    }
    c.mouth = null;
    c._ink = INKC; c._outline = outline;
    return c;
  }

  function showExtras(c, at) {
    c.extras.forEach(e => tl.to(e, { opacity: 1, duration: S(0.25) }, S(at)));
    if (c.key) tl.to(c.key, { opacity: 1, duration: S(0.2) }, S(at));
  }

  // dibujado trazo a trazo con la herramienta activa: fachada → techo → chimenea → ventana/puerta → brazos/manos/piernas → cara
  function drawRuzito(c, at, dur = 1.4, opts = {}) {
    V.drawMascot(c, at, dur * 0.7, opts);
    const [chim, tapa, techo, ven, pue] = c.house;
    draw(techo, at + dur * 0.35, dur * 0.25, { ...opts, sound: false });
    draw(chim, at + dur * 0.55, dur * 0.1, { ...opts, sound: false });
    draw(tapa, at + dur * 0.62, dur * 0.06, { ...opts, sound: false });
    draw(ven, at + dur * 0.68, dur * 0.12, { ...opts, sound: false });
    draw(pue, at + dur * 0.78, dur * 0.12, { ...opts, sound: false });
    c.hands.forEach(h => draw(h, at + dur * 0.85, dur * 0.08, { ...opts, sound: false }));
    showExtras(c, at + dur * 0.92);
    tl.set(c.mouthSets.smile, { opacity: 1 }, S(at + dur)); c.mouth = 'smile';
  }

  function popRuzito(c, at, o = {}) {
    [...c.house, ...c.hands].forEach(done);
    c.extras.forEach(e => e.setAttribute('opacity', 1));
    if (c.key) c.key.setAttribute('opacity', 1);
    tl.set(c.mouthSets.smile, { opacity: 1 }, S(at)); c.mouth = 'smile';
    V.popMascot(c, at, o);
  }

  // confeti azul alrededor (celebra)
  function confeti(c, at, n = 12) {
    const g = el('g', {}, c.sq), cols = [RUZ.techo, RUZ.puerta];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * (0.1 + 0.8 * (i / (n - 1))), r = 150 + (i % 3) * 30;
      const x = 117 + Math.cos(a) * r, y = 120 + Math.sin(a) * r * 0.9;
      const p = el(i % 3 ? 'rect' : 'circle', i % 3 ? { x: -4, y: -9, width: 8, height: 18, rx: 2, fill: cols[i % 2], opacity: 0 } : { r: 5.5, fill: cols[i % 2], opacity: 0 }, g);
      p.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${(i * 47) % 360})`);
      tl.fromTo(p, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: S(0.25), ease: 'back.out(3)', immediateRender: false }, S(at + i * 0.02));
      tl.to(p, { y: 40, opacity: 0, duration: S(1.2), ease: 'power1.in' }, S(at + 0.6));
    }
    sfx('sparkle', at, { gain: 0.6 });
  }

  // las 4 expresiones oficiales del manual
  /* ---------- expresiones adicionales (v2, oct 2026) ----------
   * pensativo · preocupado · senala · enamorado · aprobado · alerta · investiga · llamanos · se-vende · se-renta
   * Se construyen con capas propias (cara, utilería en mano, emotes de marca) que se encienden en `at`
   * y se apagan solas en el siguiente R.expr(). */
  const INKD = c => c._ink || RUZ.contorno;
  const FIL = (c, col) => (c._outline ? 'none' : col);
  const sp = (c, d, { w = 7.5, col = null, fill = 'none' } = {}) =>
    `<path d="${d}" fill="${fill}" stroke="${col || INKD(c)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ojo = (c, x, y, { rx = 15, ry = 19, hx = 4, hy = -6 } = {}) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INKD(c)}"/>` + (c._outline ? '' :
    `<circle cx="${x + hx}" cy="${y + hy}" r="${(rx * 0.37).toFixed(1)}" fill="#fff"/><circle cx="${x - hx * 1.5}" cy="${(y - hy * 1.33).toFixed(1)}" r="${(rx * 0.16).toFixed(1)}" fill="#fff"/>`);
  const corazon = (c, cx, cy, r, col = RUZ.puerta, w = 4) =>
    sp(c, `M${cx},${cy + r * 0.9} C${cx - r * 1.6},${cy - r * 0.1} ${cx - r * 0.9},${cy - r * 1.3} ${cx},${cy - r * 0.45} C${cx + r * 0.9},${cy - r * 1.3} ${cx + r * 1.6},${cy - r * 0.1} ${cx},${cy + r * 0.9} Z`, { w, fill: FIL(c, col) });
  const bocaAbierta = c => `<path d="M96,172 Q116,206 136,172 Z" fill="${INKD(c)}" stroke="${INKD(c)}" stroke-width="4" stroke-linejoin="round"/>` +
    (c._outline ? '' : `<path d="M106,187 Q116,182 126,187 Q122,197 116,197 Q110,197 106,187 Z" fill="${RUZ.puerta}"/>`);
  const dedo = (c, x1, y1, x2, y2) => sp(c, `M${x1},${y1} L${x2},${y2}`, { w: 19 }) + (c._outline ? '' : sp(c, `M${x1},${y1} L${x2},${y2}`, { w: 8, col: RUZ.fachada }));

  // capa nueva dentro de Ruzito: 'cara' (sobre la cara), 'cuerpo' (sobre todo), 'R'/'L' (en la mano, contrarrotada a `ang`)
  function capa(c, at, donde, html, { ang = 0, pop = true, detras = false } = {}) {
    const mano = donde === 'R' || donde === 'L';
    const parent = donde === 'cara' ? c.eyesWrap.parentNode : mano ? (detras ? c.armG[donde] : c.hand[donde]) : c.sq;
    const g = el('g', { opacity: 0 }, parent);
    if (mano && detras) { // debajo de la mano (la mano "sujeta" el objeto)
      g.setAttribute('transform', `translate(${RUZITO_SHAPE['hand' + donde]})`);
      const hp = c.hands[donde === 'L' ? 0 : 1]; parent.insertBefore(g, hp._fill || hp);
    }
    const inner = el('g', { transform: ang ? `rotate(${-ang})` : '' }, g);
    inner.innerHTML = html;
    tl.set(g, { opacity: 1 }, S(at));
    if (pop) tl.fromTo(inner, { scale: 0.2 }, { scale: 1, duration: S(0.3), ease: 'back.out(2.5)', transformOrigin: '50% 50%', immediateRender: false }, S(at));
    (c._capas = c._capas || []).push(g);
    return inner;
  }
  // cara propia: aplasta la cara actual (parpadeo del motor), oculta ojos/boca del motor y muestra la nueva
  function caraPropia(c, at, html) {
    face(c, at, c.state, { mouth: null });
    tl.set(c.eyesWrap, { opacity: 0 }, S(at + 0.07));
    c._sinOjos = true;
    const g = capa(c, at + 0.07, 'cara', html, { pop: false });
    tl.fromTo(g, { scaleY: 0.1 }, { scaleY: 1, duration: S(0.16), ease: 'back.out(3)', transformOrigin: '50% 50%', immediateRender: false }, S(at + 0.07));
    return g;
  }
  // emote de marca que sube y se desvanece (como los del motor, pero con colores de Ruz)
  function emoteRuz(c, at, html, { x = 0, y = 0, sube = true, dur = 1.6 } = {}) {
    const g = el('g', { transform: `translate(${x},${y})` }, c.sq);
    const inner = el('g', { opacity: 0 }, g); inner.innerHTML = html;
    tl.fromTo(inner, { scale: 0, opacity: 1 }, { scale: 1, duration: S(0.35), ease: 'back.out(3)', transformOrigin: '50% 50%', immediateRender: false }, S(at));
    if (sube) tl.to(inner, { y: -22, duration: S(dur), ease: 'sine.out' }, S(at));
    tl.to(inner, { opacity: 0, duration: S(0.3) }, S(at + dur));
  }
  function sinLlave(c, at) { if (c.key) { tl.set(c.key, { opacity: 0 }, S(at + 0.08)); c._sinLlave = true; } }

  // apaga lo que dejó la expresión anterior (se llama al inicio de cada R.expr)
  function limpiar(c, at) {
    if (c._capas && c._capas.length) { c._capas.forEach(g => tl.set(g, { opacity: 0 }, S(at + 0.07))); c._capas = []; }
    if (c._sinOjos) { tl.set(c.eyesWrap, { opacity: 1 }, S(at + 0.07)); c._sinOjos = false; }
    if (c._sinLlave) { tl.set(c.key, { opacity: 1 }, S(at + 0.07)); c._sinLlave = false; }
    if (c._pose) { arms(c, at, { L: 0, R: 0, dur: 0.18 }); c._pose = false; }
  }

  function exprExtra(c, at, kind) {
    const A = RUZ.puerta, B = RUZ.techo;
    c._pose = true;
    switch (kind) {
      case 'pensativo': // preguntas frecuentes, "¿sabías que…?", dudas del cliente
        sinLlave(c, at); arms(c, at, { R: 108, dur: 0.35, ease: 'power2.out' });
        caraPropia(c, at, ojo(c, 83, 145, { hx: 6, hy: -8 }) + ojo(c, 144, 145, { hx: 6, hy: -8 })
          + sp(c, 'M71,124 Q84,119 97,123', { w: 5 }) + sp(c, 'M131,121 Q146,113 161,119', { w: 5 }) + sp(c, 'M100,182 Q111,178 124,181', { w: 5 }));
        emoteRuz(c, at + 0.25, `<text x="0" y="0" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="80" text-anchor="middle" fill="${FIL(c, A)}" stroke="${INKD(c)}" stroke-width="3">?</text>`
          + `<circle cx="-18" cy="26" r="5" fill="${c._outline ? INKD(c) : A}"/><circle cx="-28" cy="44" r="3.5" fill="${c._outline ? INKD(c) : A}"/>`, { x: 232, y: 40, dur: 2.2 });
        tl.to(c.g, { rotation: -4, duration: S(0.5), yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 100%' }, S(at + 0.3));
        sfx('blip', at + 0.25, { gain: 0.5 });
        break;
      case 'preocupado': // errores comunes, "lo que NO debes hacer", riesgos
        sinLlave(c, at); arms(c, at, { L: -82, R: 100, dur: 0.25 });
        caraPropia(c, at, ojo(c, 86, 148, { rx: 13, ry: 17 }) + ojo(c, 147, 148, { rx: 13, ry: 17 })
          + sp(c, 'M69,131 Q84,128 100,120', { w: 5 }) + sp(c, 'M133,120 Q149,128 164,131', { w: 5 }) + sp(c, 'M98,188 Q107,178 116,185 Q125,192 134,182', { w: 5 }));
        emoteRuz(c, at + 0.15, sp(c, 'M0,-16 Q-12,4 -12,12 A12,12 0 0,0 12,12 Q12,4 0,-16 Z', { w: 4.5, fill: FIL(c, A) }), { x: 222, y: 140, dur: 1.4 });
        capa(c, at + 0.1, 'cuerpo', sp(c, 'M-6,150 L-22,140 M-8,170 L-26,170 M-6,190 L-22,200', { w: 4.5, col: c._outline ? INKD(c) : A }));
        tl.to(c.sq, { x: 3, duration: 0.05, yoyo: true, repeat: 9, ease: 'none' }, S(at + 0.2));
        sfx('blip', at, { gain: 0.4 });
        break;
      case 'senala': // presentar un dato, texto o propiedad que aparece a la derecha
        sinLlave(c, at); arms(c, at, { R: -69, dur: 0.22 });
        capa(c, at + 0.1, 'R', dedo(c, 7, 7, 26, 26), { pop: false }); // a lo largo del brazo
        caraPropia(c, at, ojo(c, 91, 146, { hx: 7, hy: -5 }) + ojo(c, 152, 146, { hx: 7, hy: -5 })
          + sp(c, 'M76,124 Q89,117 102,122', { w: 5 }) + sp(c, 'M138,122 Q151,117 164,124', { w: 5 }) + sp(c, 'M101,175 Q116,189 131,175', { w: 5 }));
        emoteRuz(c, at + 0.2, sp(c, 'M0,-20 L14,-30 M4,0 L22,0 M0,20 L14,30', { w: 4.5, col: c._outline ? INKD(c) : A }), { x: 300, y: 138, sube: false, dur: 1.2 });
        sfx('whoosh', at, { gain: 0.4 });
        break;
      case 'enamorado': // "¡la casa ideal!", nuevo hogar, testimonios felices
        arms(c, at, { L: 60, R: -60, dur: 0.25 });
        caraPropia(c, at, corazon(c, 86, 148, 17) + corazon(c, 147, 148, 17) + bocaAbierta(c));
        [[18, 30, 13, A, 0], [-8, 72, 9, B, 0.15], [244, 22, 11, B, 0.3], [36, -8, 7, A, 0.45]].forEach(([x, y, r, col, d]) =>
          emoteRuz(c, at + 0.15 + d, corazon(c, 0, 0, r, col), { x, y, dur: 1.8 }));
        tl.to(c.eyesWrap.parentNode, { scale: 1.06, duration: S(0.18), yoyo: true, repeat: 5, ease: 'sine.inOut', transformOrigin: '50% 60%' }, S(at + 0.3));
        hop(c, at + 0.2, 1);
        sfx('sparkle', at + 0.15, { gain: 0.6 });
        break;
      case 'aprobado': // papeles en regla, trámite listo, "así sí"
        sinLlave(c, at); arms(c, at, { R: -107, dur: 0.22 });
        capa(c, at + 0.1, 'R', dedo(c, -6, -12, -6, -32), { ang: -107 });
        face(c, at, 'happy', { mouth: 'grin' });
        emoteRuz(c, at + 0.2, `<circle r="26" fill="${FIL(c, A)}" stroke="${INKD(c)}" stroke-width="5"/>` + sp(c, 'M-12,1 L-3,11 L14,-10', { w: 7, col: c._outline ? INKD(c) : '#fff' }), { x: 14, y: 34, dur: 1.8 });
        sfx('ding', at + 0.2, { gain: 0.5 });
        break;
      case 'alerta': // fraudes, advertencias legales, "¡cuidado!"
        sinLlave(c, at); arms(c, at, { L: 150, dur: 0.2 });
        capa(c, at + 0.1, 'L', [-14, -4, 6, 16].map(x => dedo(c, x, -2, x, -22)).join('')
          + `<rect x="-22" y="-10" width="46" height="36" rx="16" fill="${FIL(c, RUZ.fachada)}" stroke="${INKD(c)}" stroke-width="7.5"/>`, { ang: 150 });
        caraPropia(c, at, ojo(c, 86, 148, { rx: 14, ry: 17 }) + ojo(c, 147, 148, { rx: 14, ry: 17 })
          + sp(c, 'M70,123 Q86,126 100,133', { w: 5.5 }) + sp(c, 'M133,133 Q147,126 163,123', { w: 5.5 }) + sp(c, 'M101,184 L131,182', { w: 5 }));
        emoteRuz(c, at + 0.15, sp(c, 'M0,-36 L36,28 L-36,28 Z', { w: 5, fill: FIL(c, A) }) + sp(c, 'M0,-16 L0,8', { w: 7 }) + `<circle cy="19" r="4" fill="${INKD(c)}"/>`, { x: 240, y: 22, sube: false, dur: 1.8 });
        take(c, at + 0.05, 0.12);
        sfx('blip', at + 0.15, { gain: 0.6 });
        break;
      case 'investiga': // estudio de mercado, due diligence, revisar papeles
        caraPropia(c, at, `<ellipse cx="86" cy="150" rx="14" ry="9" fill="${INKD(c)}"/>` + sp(c, 'M70,134 Q86,140 101,136', { w: 5 }) + sp(c, 'M98,184 Q108,180 120,183', { w: 5 }));
        { // mango detrás de la mano derecha, lente encima de la cara
          const mango = capa(c, at + 0.07, 'cuerpo', sp(c, 'M171,169 L224,206', { w: 17 }) + (c._outline ? '' : sp(c, 'M171,169 L224,206', { w: 7, col: B })), { pop: false });
          c.sq.insertBefore(mango.parentNode, c.armG.R);
          const lente = capa(c, at + 0.07, 'cara', (c._outline ? '' : `<circle cx="148" cy="146" r="31" fill="#DFF4FB"/>`) + ojo(c, 148, 146, { rx: 20, ry: 25 })
            + (c._outline ? '' : `<circle cx="148" cy="146" r="31" fill="${A}" opacity="0.15"/>` + sp(c, 'M128,128 Q134,120 142,118', { w: 4, col: '#fff' }))
            + sp(c, 'M117,146 a31,31 0 1,0 62,0 a31,31 0 1,0 -62,0', { w: 8 }), { pop: false });
          tl.fromTo(lente, { x: 50, y: 40 }, { x: 0, y: 0, duration: S(0.3), ease: 'back.out(2)', immediateRender: false }, S(at + 0.07));
          tl.to(lente, { x: -60, duration: S(0.5), ease: 'sine.inOut', yoyo: true, repeat: 1, repeatDelay: S(0.3) }, S(at + 0.6));
        }
        sfx('blip', at + 0.1, { gain: 0.4 });
        break;
      case 'llamanos': // CTA "llámanos", "agenda tu cita"
        sinLlave(c, at); arms(c, at, { R: -107, dur: 0.22 }); wave(c, 'L', at + 0.1, 3, { from: 140, to: 110 });
        capa(c, at + 0.1, 'R', `<g transform="rotate(-14) translate(-4,-22)"><rect x="-15" y="-28" width="30" height="56" rx="7" fill="${INKD(c)}" stroke="${INKD(c)}" stroke-width="4"/>`
          + (c._outline ? '' : `<rect x="-10" y="-20" width="20" height="36" rx="3" fill="${A}"/>`) + '</g>', { ang: -107, detras: true });
        caraPropia(c, at, ojo(c, 86, 146) + ojo(c, 147, 146));
        { const b = capa(c, at + 0.07, 'cara', `<path d="M100,174 Q116,198 132,174 Z" fill="${INKD(c)}" stroke="${INKD(c)}" stroke-width="4" stroke-linejoin="round"/>`, { pop: false });
          tl.to(b, { scaleY: 0.45, duration: S(0.12), yoyo: true, repeat: 7, ease: 'sine.inOut', svgOrigin: '116 174' }, S(at + 0.3)); }
        [0, 0.35, 0.7].forEach(d => emoteRuz(c, at + 0.2 + d, sp(c, 'M0,0 Q12,14 2,30 M12,-12 Q32,14 14,42', { w: 4.5, col: c._outline ? INKD(c) : A }), { x: 246, y: 104, sube: false, dur: 0.45 }));
        sfx('ding', at + 0.2, { gain: 0.45 }); sfx('ding', at + 0.9, { gain: 0.45 });
        break;
      case 'se-vende': case 'se-renta': { // anunciar una propiedad en venta / en renta
        const [l1, l2] = kind === 'se-vende' ? ['¡SE', 'VENDE!'] : ['¡SE', 'RENTA!'];
        sinLlave(c, at); arms(c, at, { R: -47, dur: 0.25 }); wave(c, 'L', at + 0.2, 3, { from: 140, to: 110 });
        const letrero = capa(c, at + 0.1, 'R', sp(c, 'M0,-150 L0,96', { w: 14 }) + (c._outline ? '' : sp(c, 'M0,-150 L0,96', { w: 5, col: '#B9C3DE' }))
          + `<rect x="-70" y="-232" width="140" height="82" rx="12" fill="${FIL(c, B)}" stroke="${INKD(c)}" stroke-width="7.5"/>`
          + `<text x="0" y="-197" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="26" text-anchor="middle" fill="${c._outline ? INKD(c) : '#fff'}">${l1}</text>`
          + `<text x="0" y="-166" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="26" text-anchor="middle" fill="${c._outline ? INKD(c) : A}">${l2}</text>`, { ang: -47, pop: false, detras: true });
        tl.fromTo(letrero, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: S(0.35), ease: 'back.out(2)', immediateRender: false }, S(at + 0.1));
        face(c, at, 'happy', { mouth: 'grin' }); hop(c, at + 0.5, 1);
        sfx('pop', at + 0.15, { gain: 0.6 });
        break;
      }
      default:
        console.warn('Ruzito: expresión desconocida', kind); c._pose = false;
    }
  }

  function expr(c, at, kind) {
    limpiar(c, at);
    switch (kind) {
      case 'feliz':    // bienvenidas, saludos, presentar propiedades
        face(c, at, 'normal', { mouth: 'smile' }); wave(c, 'L', at + 0.1, 3, { from: 140, to: 110 }); break;
      case 'guino':    // tips, consejos legales, datos útiles
        face(c, at, 'normal', { mouth: 'smile', emote: 'bulb' }); arms(c, at, { L: 150, dur: 0.25 }); wink(c, at + 0.3); break;
      case 'sorpresa': // nuevas propiedades, bajas de precio, oportunidades
        face(c, at, 'wide', { mouth: 'o', emote: '!' }); arms(c, at, { L: 125, R: -115, dur: 0.18 }); take(c, at + 0.05, 0.15); break;
      case 'celebra':  // vendidas, rentadas, entregas de llave, testimonios
        face(c, at, 'happy', { mouth: 'grin' }); arms(c, at, { L: 150, R: -140, dur: 0.2 }); hop(c, at + 0.15, 2); confeti(c, at + 0.1); break;
      default: exprExtra(c, at, kind);
    }
  }

  /* ---------- marca: logo fijo + cierre ---------- */
  const LOGO_R = 1264 / 1920;
  let cierreAt = null;

  // Logo original en una placa blanca, esquina inferior derecha, visible de principio a fin (se oculta solo
  // cuando el cierre muestra el logo grande). Llamar AL FINAL del build para que quede encima de todo.
  function logo(end, { w = 230, margin = 36, bottom = 70 } = {}) {
    const W = V.W, Hh = V.Hh, h = w * LOGO_R, pad = 12;
    const x = W - margin - w - pad * 2, y = Hh - bottom - h - pad * 2;
    const g = el('g', { opacity: 1 }, V.screen);
    el('rect', { x: x + 3, y: y + 5, width: w + pad * 2, height: h + pad * 2, rx: 18, fill: '#000', opacity: 0.12 }, g);
    el('rect', { x, y, width: w + pad * 2, height: h + pad * 2, rx: 18, fill: '#FFFFFF', stroke: '#E3E6EE', 'stroke-width': 2 }, g);
    el('image', { href: RUZ_EMPRESA.logo, x: x + pad, y: y + pad, width: w, height: h }, g);
    if (cierreAt != null) tl.to(g, { opacity: 0, duration: S(0.25) }, S(cierreAt + 0.3));
    tl.to({}, { duration: 0.01 }, S(end));
    return g;
  }

  // Cierre obligatorio: fondo de marca, logo original grande, datos de contacto y Ruzito celebrando. Devuelve el nuevo t.
  function cierre(t, { dur = 4.2, ruzito: conRuzito = true, extra = null } = {}) {
    const at = t; cierreAt = at;
    const W = V.W, Hh = V.Hh, vert = Hh > W, g = el('g', { opacity: 0 }, V.screen);
    el('rect', { x: 0, y: 0, width: W, height: Hh, fill: '#FFFFFF' }, g);   // blanco puro: el logo trae fondo blanco
    el('rect', { x: 0, y: Hh - (vert ? 150 : 110), width: W, height: vert ? 150 : 110, fill: RUZ.techo }, g);
    tl.to(g, { opacity: 1, duration: S(0.35) }, S(at));
    const lw = vert ? 760 : 700, lh = lw * LOGO_R, lx = vert ? (W - lw) / 2 : 120, ly = vert ? 230 : (Hh - lh) / 2 - 60;
    const lg = el('g', {}, g);
    el('image', { href: RUZ_EMPRESA.logo, x: lx, y: ly, width: lw, height: lh }, lg);
    tl.fromTo(lg, { scale: 0.6, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: S(0.55), ease: 'back.out(1.8)', immediateRender: false }, S(at + 0.2));
    gsap.set(lg, { opacity: 0 });
    const cx = vert ? W / 2 : lx + lw / 2, anchor = 'middle';
    const lines = [
      [RUZ_EMPRESA.tel, 92, RUZ.techo, 'hand'],
      [RUZ_EMPRESA.web, 70, RUZ.contorno, 'kalam'],
      [RUZ_EMPRESA.correo, 50, RUZ.contorno, 'kalam'],
    ];
    let y0 = ly + lh + (vert ? 120 : 90);
    lines.forEach(([txt, size, color, cls], i) => {
      const tt = V.T(g, cx, y0, txt, { size, color, cls, anchor }); y0 += size * 1.25;
      V.pop(tt, at + 0.6 + i * 0.15, { sound: i ? false : 'pop' });
    });
    RUZ_EMPRESA.dir.forEach((ln, i) => {
      const d = V.T(g, W / 2, Hh - (vert ? 92 : 66) + i * (vert ? 44 : 38), ln, { size: vert ? 34 : 30, color: RUZ.fachada, cls: 'kalam', anchor: 'middle' });
      V.pop(d, at + 1.1 + i * 0.08, { sound: false });
    });
    if (extra) extra(g, at);
    if (conRuzito) {
      const k = vert ? 1.5 : 1.1, m = V.mover(g, vert ? W / 2 - 117 * k : W - 420, Hh - (vert ? 150 : 110) - 25 - 279 * k, k);
      const c = ruzito(m.g, 0, 0, 1, { ground: null });
      popRuzito(c, at + 0.9); expr(c, at + 1.5, 'celebra');
    }
    sfx('whoosh', at);
    return at + dur;
  }

  return { ruzito, draw: drawRuzito, pop: popRuzito, expr, confeti, logo, cierre, COLORS: RUZ, EMPRESA: RUZ_EMPRESA };
}
