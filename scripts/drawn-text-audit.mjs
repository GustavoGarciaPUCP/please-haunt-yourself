// Drawn-text audit (.kiro/specs/visual-precision-v6). The DOM layout audit cannot see words painted inside a canvas.
// This one records every fillText/strokeText call the page makes, replays each call alone through the browser's own
// rasterizer (same font as loaded, same transform, same canvas resolution) to get its real ink pixels, and compares
// that ink with the drawing it belongs to, as the canvas pixels show it:
// - ink-outside-paper: dark words that leave the light paper they are written on (paper found from the pixels: the
//   largest light region touching the words, as a convex outline);
// - ink-tight-margin: words closer to that paper's edge than a quarter of their own em (and at least 1 device px);
// - ink-outside-canvas: words that run past the canvas itself;
// - ink-over-image: words over a picture drawn into the same canvas (a letter's photograph), unless they belong to it;
// - drawn-text-covered: an element of the same window painted over the words (a label, a badge, a pseudo-element).
// A clip in the app does not hide a defect here: the replay ignores clips. Text cut into a layer that is then masked
// (the figure made of its own output, the writing cut into the mist) is not ink and is not audited.

/** Init script: wraps the 2D context before the app runs. */
export function installTextProbe() {
  if (window.__textProbe) return;
  const P = CanvasRenderingContext2D.prototype;
  const data = new WeakMap();
  const get = canvas => { let s = data.get(canvas); if (!s) { s = { runs: [], images: [], frames: 0 }; data.set(canvas, s); } return s; };
  const matrix = ctx => { const m = ctx.getTransform(); return [m.a, m.b, m.c, m.d, m.e, m.f]; };
  const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  const deviceRect = (m, x, y, w, h) => {
    const pts = [apply(m, x, y), apply(m, x + w, y), apply(m, x, y + h), apply(m, x + w, y + h)];
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const covers = (canvas, r) => r.x <= 0.5 && r.y <= 0.5 && r.x + r.w >= canvas.width - 0.5 && r.y + r.h >= canvas.height - 0.5;
  const reset = canvas => { const s = get(canvas); s.runs = []; s.images = []; s.frames++; };
  const destructive = op => ['destination-in', 'destination-out', 'source-in', 'source-atop', 'source-out', 'destination-atop', 'copy', 'xor'].includes(op);
  const mask = ctx => { if (destructive(ctx.globalCompositeOperation)) for (const run of get(ctx.canvas).runs) run.masked = true; };
  const wrap = (name, before) => {
    const original = P[name];
    P[name] = function (...args) { try { before.apply(this, args); } catch { /* the probe never breaks drawing */ } return original.apply(this, args); };
  };
  wrap('fillRect', function (x, y, w, h) {
    const rect = deviceRect(matrix(this), x, y, w, h);
    if (this.globalCompositeOperation === 'source-over' && this.globalAlpha >= 0.999 && covers(this.canvas, rect)) reset(this.canvas); else mask(this);
  });
  wrap('clearRect', function (x, y, w, h) { if (covers(this.canvas, deviceRect(matrix(this), x, y, w, h))) reset(this.canvas); });
  wrap('fill', function () { mask(this); });
  for (const name of ['fillText', 'strokeText']) {
    wrap(name, function (text, x, y, maxWidth) {
      const s = get(this.canvas);
      if (s.runs.length > 800) s.runs.shift();
      s.runs.push({ kind: name, text: String(text), x, y, maxWidth: maxWidth ?? null, font: this.font, align: this.textAlign, baseline: this.textBaseline, direction: this.direction,
        letterSpacing: this.letterSpacing ?? '0px', wordSpacing: this.wordSpacing ?? '0px', matrix: matrix(this), lineWidth: this.lineWidth, fill: String(this.fillStyle),
        stroke: String(this.strokeStyle), alpha: this.globalAlpha, composite: this.globalCompositeOperation, filter: this.filter, masked: false, via: null });
    });
  }
  wrap('drawImage', function (image, ...args) {
    mask(this);
    if (!(image instanceof HTMLCanvasElement) || this.globalCompositeOperation !== 'source-over') return;
    let sx = 0, sy = 0, sw = image.width, sh = image.height, dx, dy, dw, dh;
    if (args.length === 2) [dx, dy] = args, dw = sw, dh = sh;
    else if (args.length === 4) [dx, dy, dw, dh] = args;
    else if (args.length === 8) [sx, sy, sw, sh, dx, dy, dw, dh] = args;
    else return;
    const dest = get(this.canvas), m = matrix(this), rect = deviceRect(m, dx, dy, dw, dh);
    const index = covers(this.canvas, rect) ? -1 : dest.images.push(rect) - 1;
    const source = data.get(image);
    if (!source || !sw || !sh) return;
    const map = mul(m, [dw / sw, 0, 0, dh / sh, dx - sx * dw / sw, dy - sy * dh / sh]);
    for (const run of source.runs) if (!run.masked && run.composite === 'source-over') dest.runs.push({ ...run, matrix: mul(map, run.matrix), via: { image: index, rect } });
  });
  window.__textProbe = { get: canvas => data.get(canvas) ?? null };
}

/**
 * Init script content that rewrites font families in canvas `font` assignments, to simulate a machine where those
 * fonts are missing. Only canvas text is affected; it is a simulation and is reported as one.
 */
export function canvasFontOverride(replacements) {
  const fn = list => {
    const desc = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
      configurable: true, enumerable: desc.enumerable,
      get() { return desc.get.call(this); },
      set(value) { let v = String(value); for (const [from, to] of list) v = v.split(from).join(to); desc.set.call(this, v); },
    });
    window.__canvasFontOverride = list;
  };
  return { content: `(${fn})(${JSON.stringify(replacements)});` };
}

/** Audits every visible canvas inside the desktop (or inside `scope`). */
export async function auditDrawnText(page, label = '', { scope = '#desktop-root' } = {}) {
  return page.evaluate(({ label, scope }) => {
    const probe = window.__textProbe;
    const out = { label, dpr: devicePixelRatio, canvases: [], problems: [] };
    if (!probe) { out.problems.push({ kind: 'probe-missing' }); return out; }
    const root = document.querySelector(scope);
    const describe = el => {
      if (!el) return 'nothing';
      const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls}${el.textContent?.trim() ? ` “${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}”` : ''}`;
    };
    const where = canvas => `${canvas.closest('.window')?.id ?? 'desktop'} ${describe(canvas)}${canvas.closest('[data-figure]') ? `[${canvas.closest('[data-figure]').dataset.figure}]` : ''}`;
    // Windows are themselves role="dialog": only a dialog or menu opened inside the window is an overlay, and an overlay
    // the person opened over the content is not a defect (as in layout-audit.mjs).
    const overlay = (el, win) => { const o = el.closest('[role="dialog"], [role="alertdialog"], [role="menu"], dialog, .app-menu, .window-menu'); return !!o && o !== win && win.contains(o); };
    const shown = el => {
      if (el.closest('[hidden]')) return false;
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const colorCtx = document.createElement('canvas').getContext('2d');
    const rgba = css => {
      colorCtx.fillStyle = '#000'; colorCtx.fillStyle = css;
      const v = colorCtx.fillStyle;
      if (v.startsWith('#')) return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
      const m = v.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
      return [m[0], m[1], m[2], m[3] ?? 1];
    };
    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const fontPx = font => Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 10);
    const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const scratch = document.createElement('canvas');

    /** The ink of one text call, alone: device pixels (in the target canvas's pixel grid) with alpha ≥ 64/255. */
    function inkOf(run) {
      let c = scratch.getContext('2d', { willReadFrequently: true });
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.font = run.font;
      const width = c.measureText(run.text).width, size = fontPx(run.font), pad = size * 1.5 + (run.kind === 'strokeText' ? run.lineWidth * 2 : 0) + 4;
      const start = run.align === 'right' || run.align === 'end' ? -width : run.align === 'center' ? -width / 2 : 0;
      const corners = [[start - pad, -size * 1.6 - pad], [start + width + pad, -size * 1.6 - pad], [start + width + pad, size * 1.6 + pad], [start - pad, size * 1.6 + pad]]
        .map(([dx, dy]) => apply(run.matrix, run.x + dx, run.y + dy));
      const bx = Math.floor(Math.min(...corners.map(p => p[0]))), by = Math.floor(Math.min(...corners.map(p => p[1])));
      const bw = Math.ceil(Math.max(...corners.map(p => p[0]))) - bx, bh = Math.ceil(Math.max(...corners.map(p => p[1]))) - by;
      if (bw <= 0 || bh <= 0 || bw * bh > 16e6) return null;
      scratch.width = bw; scratch.height = bh;
      c = scratch.getContext('2d', { willReadFrequently: true });
      const m = run.matrix;
      c.setTransform(m[0], m[1], m[2], m[3], m[4] - bx, m[5] - by);
      c.font = run.font; c.textAlign = run.align; c.textBaseline = run.baseline; c.direction = run.direction;
      if ('letterSpacing' in c) c.letterSpacing = run.letterSpacing;
      if ('wordSpacing' in c) c.wordSpacing = run.wordSpacing;
      c.fillStyle = c.strokeStyle = '#000'; c.lineWidth = run.lineWidth; c.lineJoin = c.lineCap = 'round';
      const args = run.maxWidth === null ? [run.text, run.x, run.y] : [run.text, run.x, run.y, run.maxWidth];
      if (run.kind === 'fillText') c.fillText(...args); else c.strokeText(...args);
      const pixels = c.getImageData(0, 0, bw, bh).data, xs = [], ys = [];
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (pixels[(y * bw + x) * 4 + 3] >= 64) { xs.push(x + bx); ys.push(y + by); }
      if (!xs.length) return null;
      return { xs, ys, box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 }, em: size * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) };
    }

    /** Convex hull (monotone chain) of points [x, y]; counter-clockwise. */
    function hull(points) {
      const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      if (p.length < 3) return p;
      const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lower = [], upper = [];
      for (const q of p) { while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), q) <= 0) lower.pop(); lower.push(q); }
      for (const q of p.slice().reverse()) { while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), q) <= 0) upper.pop(); upper.push(q); }
      return lower.slice(0, -1).concat(upper.slice(0, -1));
    }
    /** Signed distance from (x, y) to a convex polygon's boundary: positive inside. */
    function inside(poly, x, y) {
      let d = Infinity;
      for (let i = 0; i < poly.length; i++) {
        const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length], len = Math.hypot(bx - ax, by - ay) || 1;
        d = Math.min(d, ((bx - ax) * (y - ay) - (by - ay) * (x - ax)) / len);
      }
      return d;
    }

    /**
     * The light paper under dark words: the largest light region (from the canvas pixels) touching the ink. Regions
     * are labelled once per canvas, so two lines on the same note find the same paper (not the inside of an "O").
     */
    function paperFor(image, ink, regions) {
      const { width: W, height: H, data: d } = image;
      const light = i => lum(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) >= 150 && d[i * 4] + 10 >= d[i * 4 + 2];
      const inkSet = new Set();
      for (let k = 0; k < ink.xs.length; k++) inkSet.add(ink.ys[k] * W + ink.xs[k]);
      const seeds = new Set(), stride = Math.max(1, Math.floor(ink.xs.length / 400)), reach = Math.max(2, Math.round(ink.em * 0.18));
      for (let k = 0; k < ink.xs.length; k += stride) {
        for (const [dx, dy] of [[reach, 0], [-reach, 0], [0, reach], [0, -reach], [reach, reach], [-reach, -reach], [reach, -reach], [-reach, reach]]) {
          const x = ink.xs[k] + dx, y = ink.ys[k] + dy;
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const i = y * W + x;
          if (!inkSet.has(i) && light(i)) seeds.add(i);
        }
      }
      let best = null;
      for (const seed of seeds) {
        let region = regions.labels[seed] ? regions.list[regions.labels[seed] - 1] : null;
        if (!region) {
          const id = regions.list.length + 1, stack = [seed], minX = new Int32Array(H).fill(-1), maxX = new Int32Array(H).fill(-1);
          let area = 0;
          regions.labels[seed] = id;
          while (stack.length) {
            const i = stack.pop(), x = i % W, y = (i - x) / W;
            area++;
            if (minX[y] < 0 || x < minX[y]) minX[y] = x;
            if (x > maxX[y]) maxX[y] = x;
            for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
              if (j >= 0 && !regions.labels[j] && light(j)) { regions.labels[j] = id; stack.push(j); }
            }
          }
          region = { id, area, minX, maxX };
          regions.list.push(region);
        }
        if (!best || region.area > best.area) best = region;
      }
      if (!best || best.area < 40) return null;
      if (!best.paper) {
        const points = [];
        for (let y = 0; y < H; y++) if (best.minX[y] >= 0) points.push([best.minX[y], y], [best.maxX[y] + 1, y], [best.minX[y], y + 1], [best.maxX[y] + 1, y + 1]);
        const poly = hull(points), xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
        best.paper = { poly, area: best.area, box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) } };
      }
      return best.paper;
    }

    /** Does `el` paint at viewport point (x, y)? Background, border ring, its own text, or a replaced element. */
    function paints(el, x, y) {
      const s = getComputedStyle(el);
      if (s.visibility !== 'visible') return false;
      let opacity = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
      if (opacity < 0.05) return false;
      if (el instanceof HTMLCanvasElement || el instanceof HTMLImageElement || el instanceof SVGElement) return true;
      if (rgba(s.backgroundColor)[3] > 0.05 || s.backgroundImage !== 'none') return true;
      const r = el.getBoundingClientRect(), side = name => (s[`border${name}Style`] !== 'none' && rgba(s[`border${name}Color`])[3] > 0.05 ? parseFloat(s[`border${name}Width`]) : 0);
      const [t, rr, b, l] = [side('Top'), side('Right'), side('Bottom'), side('Left')];
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && (x < r.left + l || x > r.right - rr || y < r.top + t || y > r.bottom - b)) return true;
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const box of range.getClientRects()) if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return true;
      }
      return false;
    }
    /** Absolutely positioned ::before/::after of an element that paint at (x, y) (corner marks, decorations). */
    function pseudoPaints(el, x, y) {
      const box = el.getBoundingClientRect(), hits = [];
      for (const pseudo of ['::before', '::after']) {
        const s = getComputedStyle(el, pseudo);
        if (s.content === 'none' || s.display === 'none' || s.position !== 'absolute' || s.visibility !== 'visible') continue;
        const w = parseFloat(s.width), h = parseFloat(s.height);
        if (!w || !h) continue;
        const padLeft = box.left + el.clientLeft, padTop = box.top + el.clientTop, padRight = padLeft + el.clientWidth, padBottom = padTop + el.clientHeight;
        const left = s.left !== 'auto' ? padLeft + parseFloat(s.left) : padRight - parseFloat(s.right) - w;
        const top = s.top !== 'auto' ? padTop + parseFloat(s.top) : padBottom - parseFloat(s.bottom) - h;
        if (x < left || x > left + w || y < top || y > top + h) continue;
        const side = name => (s[`border${name}Style`] !== 'none' ? parseFloat(s[`border${name}Width`]) : 0);
        const ring = x < left + side('Left') || x > left + w - side('Right') || y < top + side('Top') || y > top + h - side('Bottom');
        if (ring || rgba(s.backgroundColor)[3] > 0.05) hits.push(`${describe(el).split(' “')[0]}${pseudo}`);
      }
      return hits;
    }

    const force = document.createElement('style');
    force.textContent = '* { pointer-events: auto !important; }';
    document.head.append(force);
    try {
      for (const canvas of root.querySelectorAll('canvas')) {
        if (!shown(canvas)) continue;
        const state = probe.get(canvas);
        const runs = (state?.runs ?? []).filter(run => !run.masked && run.composite === 'source-over' && run.alpha > 0.05 && run.text.trim() && rgba(run.kind === 'fillText' ? run.fill : run.stroke)[3] > 0.05);
        if (!runs.length) continue;
        const ctx = canvas.getContext('2d');
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height), regions = { labels: new Int32Array(canvas.width * canvas.height), list: [] };
        const rect = canvas.getBoundingClientRect(), sx = rect.width / canvas.width, sy = rect.height / canvas.height;
        const toCss = (x, y) => [rect.left + (x + 0.5) * sx, rect.top + (y + 0.5) * sy];
        const win = canvas.closest('.window');
        // Where the canvas can be seen at all: inside every ancestor that clips (a scrolled panel, the window).
        let view = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
        for (let n = canvas.parentElement; n && n !== document.documentElement; n = n.parentElement) {
          const s = getComputedStyle(n);
          if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
          const b = n.getBoundingClientRect(), left = b.left + n.clientLeft, top = b.top + n.clientTop;
          view = { left: Math.max(view.left, left), top: Math.max(view.top, top), right: Math.min(view.right, left + n.clientWidth), bottom: Math.min(view.bottom, top + n.clientHeight) };
        }
        const ancestors = [];
        for (let n = canvas.parentElement; n && n !== win; n = n.parentElement) ancestors.push(n);
        const entry = { where: where(canvas), size: [canvas.width, canvas.height], css: { x: rect.left, y: rect.top, w: rect.width, h: rect.height }, runs: [], papers: [] };
        const paperCache = new Map();
        for (const run of runs) {
          const ink = inkOf(run);
          if (!ink) continue;
          const color = rgba(run.kind === 'fillText' ? run.fill : run.stroke), dark = lum(color[0], color[1], color[2]) < 110;
          const required = Math.max(1, ink.em * 0.25);
          const result = { text: run.text, font: run.font, via: run.via ? 'image' : null, em: +ink.em.toFixed(2), ink: ink.box, inkCss: (() => { const [x0, y0] = toCss(ink.box.x, ink.box.y), [x1, y1] = toCss(ink.box.x + ink.box.w - 1, ink.box.y + ink.box.h - 1); return { x: +x0.toFixed(1), y: +y0.toFixed(1), w: +(x1 - x0).toFixed(1), h: +(y1 - y0).toFixed(1) }; })(),
            paper: null, clearance: null, required: +required.toFixed(2), outside: 0, outsideCanvas: 0, overImage: 0, covered: [] };
          // The canvas itself.
          for (let k = 0; k < ink.xs.length; k++) if (ink.xs[k] < 0 || ink.ys[k] < 0 || ink.xs[k] >= canvas.width || ink.ys[k] >= canvas.height) result.outsideCanvas++;
          if (result.outsideCanvas) out.problems.push({ kind: 'ink-outside-canvas', where: entry.where, text: run.text, pixels: result.outsideCanvas });
          // The paper it is written on.
          if (dark) {
            const paper = paperFor(image, ink, regions);
            if (paper) {
              paperCache.set(`${paper.box.x},${paper.box.y}`, paper);
              let min = Infinity, outside = 0;
              for (let k = 0; k < ink.xs.length; k++) {
                const dist = inside(paper.poly, ink.xs[k] + 0.5, ink.ys[k] + 0.5);
                if (dist < min) min = dist;
                if (dist < -0.5) outside++;
              }
              result.paper = paper.box;
              result.clearance = +min.toFixed(2);
              result.outside = outside;
              if (outside) out.problems.push({ kind: 'ink-outside-paper', where: entry.where, text: run.text, pixels: outside, of: ink.xs.length, clearance: result.clearance });
              else if (min < required) out.problems.push({ kind: 'ink-tight-margin', where: entry.where, text: run.text, clearance: result.clearance, required: result.required });
            } else out.problems.push({ kind: 'ink-without-paper', where: entry.where, text: run.text });
          } else {
            let min = Infinity;
            for (let k = 0; k < ink.xs.length; k++) min = Math.min(min, ink.xs[k] + 0.5, ink.ys[k] + 0.5, canvas.width - ink.xs[k] - 0.5, canvas.height - ink.ys[k] - 0.5);
            result.clearance = +min.toFixed(2);
            if (min < Math.min(required, 4)) out.problems.push({ kind: 'ink-tight-margin', where: entry.where, text: run.text, clearance: result.clearance, required: +Math.min(required, 4).toFixed(2), edge: 'canvas' });
          }
          // Pictures drawn into the same canvas (a letter's photograph) are not paper.
          (state.images ?? []).forEach((img, index) => {
            if (run.via && run.via.image === index) return;
            let over = 0;
            for (let k = 0; k < ink.xs.length; k++) if (ink.xs[k] >= img.x && ink.xs[k] < img.x + img.w && ink.ys[k] >= img.y && ink.ys[k] < img.y + img.h) over++;
            if (over) { result.overImage += over; out.problems.push({ kind: 'ink-over-image', where: entry.where, text: run.text, pixels: over }); }
          });
          // Anything of the same window painted over the words.
          const stride = Math.max(1, Math.floor(ink.xs.length / 72)), covering = new Map();
          for (let k = 0; k < ink.xs.length; k += stride) {
            if (ink.xs[k] < 0 || ink.ys[k] < 0 || ink.xs[k] >= canvas.width || ink.ys[k] >= canvas.height) continue;
            const [x, y] = toCss(ink.xs[k], ink.ys[k]);
            // Within a pixel of a clipping edge, hit testing can return the neighbour across the edge: not sampled.
            if (x < view.left + 1 || y < view.top + 1 || x > view.right - 1 || y > view.bottom - 1) { result.hidden = (result.hidden ?? 0) + 1; continue; }
            for (const el of document.elementsFromPoint(x, y)) {
              // An ancestor is below the canvas (it is reached when the canvas is inert behind a dialog).
              if (el === canvas || el.contains(canvas)) break;
              if (!win || !win.contains(el) || overlay(el, win)) break;
              if (paints(el, x, y)) { const key = describe(el); covering.set(key, (covering.get(key) ?? 0) + 1); break; }
            }
            for (const ancestor of ancestors) for (const key of pseudoPaints(ancestor, x, y)) covering.set(key, (covering.get(key) ?? 0) + 1);
          }
          for (const [by, points] of covering) {
            result.covered.push({ by, points });
            out.problems.push({ kind: 'drawn-text-covered', where: entry.where, text: run.text, by, points });
          }
          entry.runs.push(result);
        }
        for (const paper of paperCache.values()) {
          const [x0, y0] = toCss(paper.box.x, paper.box.y), [x1, y1] = toCss(paper.box.x + paper.box.w, paper.box.y + paper.box.h);
          entry.papers.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
        }
        out.canvases.push(entry);
      }
    } finally { force.remove(); }
    return out;
  }, { label, scope });
}
