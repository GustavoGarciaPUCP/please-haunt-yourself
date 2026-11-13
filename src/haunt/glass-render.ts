import { FIGURE_PATH, FIGURE_TORSO_PATH, FIGURE_VIEW, PRESENCE_TEXT } from './specter-art';
import {
  EMPTY_FIELD, GRID_COLS, GRID_ROWS, figureBox, handBox, hash2, meanFog, patchField, revealDelay, valueNoise, writingBoxes, writingFont,
  type Box, type FogField, type Placement, type Size,
} from './glass-model';
import { SESSION_SIZE, negativeField, negativeSize, negativeWriting, type Negative, type SessionFrame } from './echo-studio';
import { NOTE_SIGN, NOTE_START } from './legacy-session';
import type { Layout, LetterDraft, LetterSnapshot, Paper } from './letter-model';

/**
 * One renderer for the desktop glass, ECHO's monitor, every capture and every letter (.kiro/specs/os-case-v4 design §2).
 * Drawing a stage region always produces the same pixels for the same data, so the viewfinder, the negative, the
 * picture in CANVAS and the delivered letter agree. Layers: the painted night behind the glass, the presence (a figure
 * made of its own output, visible only where the mist is thin), then the condensation with the handprint and the
 * writing cut into it.
 */
export interface GlassScene { stage: Size; placement: Placement | null; field: FogField; writing: readonly string[]; }
export interface GlassOptions {
  /** Milestone reveal progress (1 = settled). */
  reveal?: number;
  /** Final release progress (0 = pressed, 1 = the hand let go and the mist cleared). */
  release?: number;
  /** How much of the condensation stays (CANVAS's Mist layer; 1 = as captured). */
  mist?: number;
  /** How strongly the writing is still cut into the mist (CANVAS lifts it out). */
  writingStrength?: number;
}

const FOG_RGB = [172, 191, 201] as const;
const FOG_ALPHA = 0.4;
export const HAND_FONT = '"Segoe Print", "Ink Free", "Bradley Hand", "Segoe Script", "Comic Sans MS", cursive';
export const MONO_FONT = '"Cascadia Mono", "Cascadia Code", Consolas, "Courier New", monospace';
/** The desktop's UI font, for drawn text that TERMINAL shows in its UI font (the note's signature). */
export const UI_FONT = '"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const FIGURE = typeof Path2D === 'undefined' ? null : new Path2D(FIGURE_PATH);
const TORSO = typeof Path2D === 'undefined' ? null : new Path2D(FIGURE_TORSO_PATH);
const PRESENCE_ROW = `${PRESENCE_TEXT} `.repeat(4);

const smooth = (value: number): number => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
const phase = (t: number, start: number, length: number): number => smooth((t - start) / length);

// ---------- Offscreen layers (bounded caches) ----------

function cache(limit: number): (width: number, height: number) => HTMLCanvasElement {
  const layers = new Map<string, HTMLCanvasElement>();
  return (width, height) => {
    const key = `${width}x${height}`;
    let layer = layers.get(key);
    if (!layer) {
      if (layers.size >= limit) layers.delete(layers.keys().next().value!);
      layer = document.createElement('canvas');
      layer.width = width; layer.height = height;
      layers.set(key, layer);
    }
    return layer;
  };
}
const fogLayer = cache(4);
const figureLayer = cache(4);
const maskLayer = cache(4);
const pictureLayer = cache(6);
let fogImage: HTMLCanvasElement | null = null;
let fogPixels: ImageData | null = null;

const TILE = 256;
let dropletTile: HTMLCanvasElement | null = null;
let highlightTile: HTMLCanvasElement | null = null;
/** Fine beads where the mist has gathered into droplets. Seeded, so every surface matches. */
function beadTile(light: boolean): HTMLCanvasElement {
  const existing = light ? highlightTile : dropletTile;
  if (existing) return existing;
  const tile = document.createElement('canvas');
  tile.width = tile.height = TILE;
  const ctx = tile.getContext('2d')!;
  for (let i = 0; i < 900; i++) {
    const large = hash2(i, 5, 41) > 0.96;
    const x = hash2(i, 1, 41) * TILE, y = hash2(i, 2, 41) * TILE, r = large ? 1.1 + hash2(i, 3, 41) * 1.1 : 0.3 + hash2(i, 3, 41) * 0.55;
    if (light) {
      ctx.fillStyle = `rgba(236,244,246,${large ? 0.5 : 0.16 + hash2(i, 6, 41) * 0.2})`;
      ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * (large ? 0.45 : 0.6), 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = `rgba(0,0,0,${large ? 0.42 : 0.14 + hash2(i, 4, 41) * 0.2})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (light) highlightTile = tile; else dropletTile = tile;
  return tile;
}

// ---------- The painted night (the wallpaper behind the glass) ----------

function glow(ctx: CanvasRenderingContext2D, stage: Size, cx: number, cy: number, rx: number, ry: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, color); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(-cx / rx, -cy / ry, stage.w / rx, stage.h / ry);
  ctx.restore();
}

function ridge(ctx: CanvasRenderingContext2D, stage: Size, base: number, amp: number, seed: number, color: string): (u: number) => number {
  const y = (u: number) => stage.h * (base + amp * (valueNoise(u * 5.5, 0.5, seed) - 0.5) + amp * 0.45 * (valueNoise(u * 19, 1.5, seed + 1) - 0.5));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, stage.h);
  for (let i = 0; i <= 96; i++) ctx.lineTo(stage.w * i / 96, y(i / 96));
  ctx.lineTo(stage.w, stage.h);
  ctx.closePath();
  ctx.fill();
  return y;
}

/**
 * A quiet painted night: moonlight behind thin cloud, a few stars, two ridges of hills and one distant lit window.
 * Deterministic and proportional to the stage, so ECHO's viewfinder shows exactly the desktop's pixels.
 */
function drawNight(ctx: CanvasRenderingContext2D, stage: Size): void {
  const { w, h } = stage;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0a1115'); sky.addColorStop(0.5, '#0f191e'); sky.addColorStop(0.82, '#142026'); sky.addColorStop(1, '#10181c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, stage, w * 0.18, h * 0.08, w * 0.62, h * 0.7, 'rgba(48,91,98,0.2)');
  glow(ctx, stage, w * 0.79, h * 0.15, h * 0.55, h * 0.42, 'rgba(158,184,190,0.12)');
  glow(ctx, stage, w * 0.79, h * 0.15, h * 0.09, h * 0.08, 'rgba(214,226,224,0.16)');
  // Thin cloud bands drifting across the moonlight.
  for (let i = 0; i < 4; i++) {
    const cy = h * (0.12 + 0.11 * i + 0.05 * hash2(i, 1, 97)), cx = w * (0.35 + 0.5 * hash2(i, 2, 97));
    glow(ctx, stage, cx, cy, w * (0.28 + 0.2 * hash2(i, 3, 97)), h * 0.025, `rgba(130,152,160,${0.05 + 0.04 * hash2(i, 4, 97)})`);
  }
  const unit = h / 900;
  for (let i = 0; i < 80; i++) {
    const x = hash2(i, 1, 91) * w, y = hash2(i, 2, 91) * h * 0.58, r = (0.45 + hash2(i, 3, 91) * 0.85) * Math.max(0.6, unit);
    ctx.fillStyle = `rgba(220,230,232,${(0.12 + 0.4 * hash2(i, 4, 91)) * (1 - y / (h * 0.66))})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const far = ridge(ctx, stage, 0.79, 0.07, 113, '#152126');
  // One window lit on the far hill: someone else is awake.
  const lx = w * 0.31, ly = far(0.31) + h * 0.012;
  glow(ctx, stage, lx, ly, h * 0.02, h * 0.016, 'rgba(206,148,96,0.32)');
  ctx.fillStyle = 'rgba(232,178,120,0.85)';
  ctx.fillRect(lx - 1.2 * Math.max(0.7, unit), ly - 1.2 * Math.max(0.7, unit), 2.4 * Math.max(0.7, unit), 2.4 * Math.max(0.7, unit));
  ridge(ctx, stage, 0.885, 0.05, 127, '#0d1519');
  // A soft vignette keeps the edges quiet for windows and files.
  const vignette = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.35, w / 2, h * 0.45, Math.hypot(w, h) * 0.62);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

// ---------- The presence: a figure made of its own output ----------

type Matrix = [number, number, number, number, number, number];

function clearLayer(ctx: CanvasRenderingContext2D, outW: number, outH: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.clearRect(0, 0, outW, outH);
}

/**
 * Text rows clipped to a mask, in an offscreen layer the size of the output. The rows and the outline are drawn on
 * separate layers and intersected in one draw: a compositing mode like source-in applied per row would erase the
 * earlier rows. The caller composites the returned layer.
 */
function textFigure(outW: number, outH: number, toOut: Matrix, mask: (ctx: CanvasRenderingContext2D) => void, area: Box, font: number, color: string, seed: number): HTMLCanvasElement {
  const layer = figureLayer(outW, outH), f = layer.getContext('2d')!;
  clearLayer(f, outW, outH);
  f.setTransform(...toOut);
  f.fillStyle = color;
  f.font = `600 ${font}px ${MONO_FONT}`;
  f.textBaseline = 'top';
  const step = font * 1.18;
  for (let row = 0, y = area.y - step * 0.4; y < area.y + area.h; row++, y += step) {
    f.fillText(PRESENCE_ROW, area.x - hash2(row, 7, seed) * font * 9, y);
  }
  const outline = maskLayer(outW, outH), m = outline.getContext('2d')!;
  clearLayer(m, outW, outH);
  m.setTransform(...toOut);
  m.fillStyle = m.strokeStyle = '#fff';
  mask(m);
  f.setTransform(1, 0, 0, 1, 0, 0);
  f.globalCompositeOperation = 'destination-in';
  f.drawImage(outline, 0, 0);
  f.globalCompositeOperation = 'source-over';
  return layer;
}

/** The figure's outline, fitted to a box (viewBox 100×240, centred). */
function placeFigure(ctx: CanvasRenderingContext2D, path: Path2D, box: Box): void {
  const scale = box.h / FIGURE_VIEW.h;
  ctx.save();
  ctx.translate(box.x + box.w / 2 - (FIGURE_VIEW.w / 2) * scale, box.y);
  ctx.scale(scale, scale);
  ctx.fill(path);
  ctx.restore();
}

interface Reach { body: Box; shoulder: [number, number]; elbow: [number, number]; heel: [number, number]; palm: Box; arm: number; }
/** The reflection's pose: it stands behind the glass and reaches forward to the palm it pressed on it. */
function reach(placement: Placement, stage: Size, drift: number): Reach {
  const box = figureBox(placement, stage), hand = handBox(placement, stage), outward = placement.side === 'right' ? 1 : -1;
  const body = { ...box, x: box.x + drift };
  const cx = body.x + body.w / 2, scale = body.h / FIGURE_VIEW.h;
  const shoulder: [number, number] = [cx - outward * 25 * scale, body.y + 60 * scale];
  const heel: [number, number] = [hand.x + hand.w * 0.52, hand.y + hand.h * 0.9];
  const elbow: [number, number] = [shoulder[0] + (heel[0] - shoulder[0]) * 0.5, Math.max(shoulder[1], heel[1]) + 0.09 * stage.h];
  const palm = { x: hand.x + hand.w * 0.2, y: hand.y + hand.h * 0.36, w: hand.w * 0.62, h: hand.h * 0.56 };
  return { body, shoulder, elbow, heel, palm, arm: 15 * scale };
}
function reachMask(pose: Reach): (ctx: CanvasRenderingContext2D) => void {
  return ctx => {
    if (TORSO) placeFigure(ctx, TORSO, pose.body);
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.lineWidth = pose.arm;
    ctx.beginPath(); ctx.moveTo(...pose.shoulder); ctx.quadraticCurveTo(...pose.elbow, ...pose.heel); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(pose.palm.x + pose.palm.w / 2, pose.palm.y + pose.palm.h / 2, pose.palm.w / 2, pose.palm.h / 2, 0, 0, Math.PI * 2); ctx.fill();
  };
}

// ---------- The handprint ----------

interface Finger { base: [number, number]; tip: [number, number]; width: number; }
/** Hand geometry in unit coordinates of the hand box (thumb on the left for a print on a window's right edge). */
const PALM = { cx: 0.52, cy: 0.67, rx: 0.31, ry: 0.22 };
const FINGERS: readonly Finger[] = [
  { base: [0.33, 0.5], tip: [0.24, 0.14], width: 0.13 },
  { base: [0.47, 0.47], tip: [0.45, 0.05], width: 0.135 },
  { base: [0.61, 0.48], tip: [0.65, 0.1], width: 0.13 },
  { base: [0.74, 0.55], tip: [0.86, 0.26], width: 0.115 },
  { base: [0.3, 0.73], tip: [0.06, 0.48], width: 0.15 },
];
/** Soft contact patches of a palm on wet glass, in hand-box units: [u, v, rx, ry, strength]. The hollow barely touches. */
const PADS: ReadonlyArray<readonly [number, number, number, number, number]> = [
  [0.4, 0.84, 0.18, 0.11, 0.9], [0.64, 0.83, 0.17, 0.11, 0.84], [0.3, 0.67, 0.13, 0.16, 0.82], [0.73, 0.67, 0.12, 0.16, 0.74],
  [0.37, 0.53, 0.1, 0.066, 0.88], [0.5, 0.51, 0.1, 0.066, 0.9], [0.62, 0.52, 0.096, 0.064, 0.88], [0.74, 0.57, 0.086, 0.058, 0.82],
  [0.52, 0.68, 0.17, 0.13, 0.42],
];
/** Palm creases (mist left in the folds of the skin): [u0, v0, cu, cv, u1, v1, width]. */
const CREASES: ReadonlyArray<readonly [number, number, number, number, number, number, number]> = [
  [0.27, 0.6, 0.48, 0.55, 0.8, 0.6, 0.012], [0.25, 0.66, 0.46, 0.66, 0.7, 0.71, 0.011], [0.36, 0.58, 0.3, 0.72, 0.42, 0.88, 0.012],
];

function handTransform(ctx: CanvasRenderingContext2D, placement: Placement, stage: Size, scale = 1): Box {
  const box = handBox(placement, stage);
  const cx = box.x + box.w * PALM.cx, cy = box.y + box.h * PALM.cy;
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);
  if (placement.side === 'left') { ctx.translate(box.x * 2 + box.w, 0); ctx.scale(-1, 1); }
  return box;
}

function softBlob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, strength: number, angle = 0): void {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle); ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, `rgba(0,0,0,${strength})`); gradient.addColorStop(0.72, `rgba(0,0,0,${strength * 0.9})`); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/**
 * The print in the condensation: palm pads around a barely touching hollow, finger segments with misty creases between
 * them, clear fingertip ovals, the palm's own folds, mottled contact and a faint ring of moisture pushed aside.
 */
function cutHandprint(ctx: CanvasRenderingContext2D, placement: Placement, stage: Size, press: number, scaleOut: number, moisture: number): void {
  if (press <= 0) return;
  ctx.save();
  const box = handTransform(ctx, placement, stage, 0.92 + 0.08 * press);
  // Marks made of moisture (the pushed-aside ring, the folds, the mottling) exist only where the glass is still wet.
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.07 * press * moisture;
  softBlob(ctx, box.x + box.w * 0.52, box.y + box.h * 0.56, box.w * 0.62, box.h * 0.56, 0.9);
  ctx.globalAlpha = press;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.filter = `blur(${Math.max(0.4, box.w * 0.007 * scaleOut).toFixed(2)}px)`;
  for (const [u, v, rx, ry, strength] of PADS) softBlob(ctx, box.x + u * box.w, box.y + v * box.h, rx * box.w, ry * box.h, strength);
  for (const [index, finger] of FINGERS.entries()) {
    const thumb = index === 4, dx = finger.tip[0] - finger.base[0], dy = finger.tip[1] - finger.base[1];
    const angle = Math.atan2(dy * box.h, dx * box.w) + Math.PI / 2, half = finger.width * box.w / 2;
    const segments: ReadonlyArray<readonly [number, number, number]> = thumb ? [[0.08, 0.52, 0.76], [0.55, 0.96, 0.9]] : [[0.04, 0.4, 0.72], [0.43, 0.69, 0.8], [0.71, 0.99, 0.94]];
    for (const [from, to, strength] of segments) {
      const mid = (from + to) / 2, length = Math.hypot(dx * box.w, dy * box.h) * (to - from) / 2;
      softBlob(ctx, box.x + (finger.base[0] + dx * mid) * box.w, box.y + (finger.base[1] + dy * mid) * box.h, half * 1.12, length + half * 0.4, strength, angle);
    }
    softBlob(ctx, box.x + (finger.base[0] + dx * 0.88) * box.w, box.y + (finger.base[1] + dy * 0.88) * box.h, half * 0.86, half * 1.05, 0.98, angle);
  }
  ctx.filter = 'none';
  // The folds of the palm hold a little mist: the print reads as a hand, not a stencil.
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = `rgb(${FOG_RGB.join(',')})`;
  ctx.lineCap = 'round';
  for (const [u0, v0, cu, cv, u1, v1, width] of CREASES) {
    ctx.globalAlpha = press * 0.5 * moisture;
    ctx.lineWidth = width * box.w * 3;
    ctx.beginPath(); ctx.moveTo(box.x + u0 * box.w, box.y + v0 * box.h); ctx.quadraticCurveTo(box.x + cu * box.w, box.y + cv * box.h, box.x + u1 * box.w, box.y + v1 * box.h); ctx.stroke();
  }
  ctx.fillStyle = `rgb(${FOG_RGB.join(',')})`;
  for (let i = 0; i < 36; i++) {
    const u = 0.2 + hash2(i, 1, 83) * 0.62, v = 0.1 + hash2(i, 2, 83) * 0.84, r = box.w * (0.006 + hash2(i, 3, 83) * 0.012);
    ctx.globalAlpha = press * (0.06 + hash2(i, 4, 83) * 0.1) * moisture;
    ctx.beginPath(); ctx.arc(box.x + u * box.w, box.y + v * box.h, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** The note written with a fingertip: soft strokes cut through the mist, a little uneven, drips below some letters. */
function cutWriting(ctx: CanvasRenderingContext2D, placement: Placement, stage: Size, lines: readonly string[], progress: number, strength: number, scaleOut: number): void {
  if (!lines.length || progress <= 0 || strength <= 0) return;
  const font = writingFont(stage), boxes = writingBoxes(placement, stage, lines), written = progress * lines.length;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = strength;
  ctx.font = `${font}px ${HAND_FONT}`;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = ctx.lineCap = 'round';
  boxes.forEach((box, index) => {
    const share = Math.max(0, Math.min(1, written - index));
    if (share <= 0) return;
    const text = lines[index]!, natural = ctx.measureText(text).width || 1;
    const tilt = (hash2(index, 1, 67) - 0.5) * 0.03, lift = (hash2(index, 2, 67) - 0.5) * font * 0.14;
    ctx.save();
    ctx.beginPath(); ctx.rect(box.x - font * 0.3, box.y - font * 0.8, (box.w + font * 0.6) * share, box.h + font * 2.4); ctx.clip();
    ctx.translate(box.x, box.y + box.h / 2 + lift); ctx.rotate(tilt); ctx.scale(box.w / natural, 1);
    ctx.filter = `blur(${Math.max(0.6, font * 0.09 * scaleOut).toFixed(2)}px)`;
    ctx.strokeStyle = 'rgba(0,0,0,0.34)'; ctx.lineWidth = font * 0.2;
    ctx.strokeText(text, 0, 0);
    ctx.filter = `blur(${Math.max(0.3, font * 0.025 * scaleOut).toFixed(2)}px)`;
    ctx.fillStyle = ctx.strokeStyle = 'rgba(0,0,0,0.86)'; ctx.lineWidth = font * 0.085;
    ctx.fillText(text, 0, 0); ctx.strokeText(text, 0, 0);
    ctx.restore();
    if (share < 1) return;
    ctx.fillStyle = ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = Math.max(1, font * 0.05);
    for (let k = 0; k < 3; k++) {
      if (hash2(index, k, 53) < 0.4) continue;
      const x = box.x + box.w * (0.08 + 0.84 * hash2(index, k, 59)), y = box.y + box.h * 0.84, length = font * (0.4 + 1.8 * hash2(index, k, 61));
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + font * 0.03, y + length); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + font * 0.03, y + length, font * 0.065, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.restore();
}

/** A few runnels where drops slid down the glass. Cuts in the mist, anchored to the glass, so wiping removes them too. */
function cutRunnels(ctx: CanvasRenderingContext2D, stage: Size): void {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const x = hash2(i, 1, 71) * stage.w, y = hash2(i, 2, 71) * stage.h * 0.75, length = stage.h * (0.06 + hash2(i, 3, 71) * 0.2);
    const sway = (hash2(i, 4, 71) - 0.5) * 6;
    ctx.strokeStyle = `rgba(0,0,0,${0.22 + hash2(i, 5, 71) * 0.2})`;
    ctx.lineWidth = 0.9 + hash2(i, 6, 71) * 1.1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sway, y + length * 0.5, x + sway * 0.4, y + length); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.arc(x + sway * 0.4, y + length, ctx.lineWidth * 1.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Condensation density as an image (alpha = density): the same layer paints the mist and hides the figure behind it. */
function fogImageFor(field: FogField, t: number): HTMLCanvasElement {
  if (!fogImage) {
    fogImage = document.createElement('canvas');
    fogImage.width = GRID_COLS; fogImage.height = GRID_ROWS;
    fogPixels = fogImage.getContext('2d')!.createImageData(GRID_COLS, GRID_ROWS);
  }
  const data = fogPixels!.data;
  for (let row = 0; row < GRID_ROWS; row++) for (let col = 0; col < GRID_COLS; col++) {
    const i = (row * GRID_COLS + col) * 4, condensed = t >= 1 ? 1 : smooth((t - revealDelay(col, row)) / 0.22);
    data[i] = FOG_RGB[0]; data[i + 1] = FOG_RGB[1]; data[i + 2] = FOG_RGB[2];
    // Density maps to opacity with more contrast than linear, so thin patches read as thin and wiped glass as clear.
    const density = Math.max(0, Math.min(1, (field.at(col, row) - 0.36) / 0.6));
    data[i + 3] = Math.round(Math.pow(density, 1.15) * condensed * 255);
  }
  fogImage.getContext('2d')!.putImageData(fogPixels!, 0, 0);
  return fogImage;
}

/**
 * Draws the stage region `region` (stage px) of the glass into `ctx` at `outW`×`outH` device pixels, starting at the
 * canvas origin. Reduced motion, ECHO, captures and letters use the settled state (reveal 1).
 */
export function drawGlass(ctx: CanvasRenderingContext2D, scene: GlassScene, region: Box, outW: number, outH: number, options: GlassOptions = {}): void {
  const t = options.reveal ?? 1, release = options.release ?? 0, mistLevel = Math.max(0, Math.min(1, options.mist ?? 1));
  const sx = outW / region.w, sy = outH / region.h, toOut: Matrix = [sx, 0, 0, sy, -region.x * sx, -region.y * sy];
  ctx.save();
  ctx.setTransform(...toOut);
  drawNight(ctx, scene.stage);
  const placement = scene.placement;
  if (!placement || release >= 1) { ctx.restore(); return; }
  const appear = phase(t, 0.25, 0.325) * (1 - phase(release, 0.12, 0.45));
  const mist = mistLevel * (1 - phase(release, 0.42, 0.58));
  const outward = placement.side === 'right' ? 1 : -1;
  const pose = reach(placement, scene.stage, (1 - phase(t, 0.25, 0.325)) * outward * 0.05 * scene.stage.h);
  // The body's mass: a faint darkness standing behind the glass.
  if (appear > 0) {
    ctx.save();
    ctx.globalAlpha = appear * 0.4;
    ctx.fillStyle = ctx.strokeStyle = 'rgb(4,8,10)';
    reachMask(pose)(ctx);
    ctx.restore();
  }
  // The condensation, its beads and runnels, the handprint and the writing cut into it.
  let fog: HTMLCanvasElement | null = null;
  if (mist > 0) {
    fog = fogLayer(outW, outH);
    const f = fog.getContext('2d')!;
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'source-over';
    f.globalAlpha = 1;
    f.filter = 'none';
    f.clearRect(0, 0, outW, outH);
    const cw = scene.stage.w / GRID_COLS, ch = scene.stage.h / GRID_ROWS;
    f.imageSmoothingEnabled = true;
    f.imageSmoothingQuality = 'high';
    f.drawImage(fogImageFor(scene.field, t), region.x / cw, region.y / ch, region.w / cw, region.h / ch, 0, 0, outW, outH);
    f.setTransform(...toOut);
    const beads = f.createPattern(beadTile(false), 'repeat'), shine = f.createPattern(beadTile(true), 'repeat');
    if (beads && shine) {
      f.globalCompositeOperation = 'destination-out'; f.fillStyle = beads; f.fillRect(region.x, region.y, region.w, region.h);
      f.globalCompositeOperation = 'source-atop'; f.fillStyle = shine; f.fillRect(region.x, region.y, region.w, region.h);
      f.globalCompositeOperation = 'source-over';
    }
    if (t >= 0.6) cutRunnels(f, scene.stage);
    // How wet the glass still is around the hand (0 once wiped clear), for the marks made of moisture.
    const moisture = Math.max(0, Math.min(1, (meanFog(scene.field, handBox(placement, scene.stage), scene.stage) - 0.3) / 0.35));
    cutHandprint(f, placement, scene.stage, phase(t, 0.425, 0.375) * (1 - phase(release, 0, 0.32)), sx, moisture);
    cutWriting(f, placement, scene.stage, scene.writing, phase(t, 0.55, 0.45), options.writingStrength ?? 1, sx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = FOG_ALPHA * mist;
    ctx.drawImage(fog, 0, 0);
    ctx.globalAlpha = 1;
  }
  // The presence, written in its own words, seen only where the mist is thin or cleared.
  if (appear > 0 && FIGURE) {
    const area = { x: Math.min(pose.body.x, pose.palm.x) - 4, y: pose.body.y, w: Math.max(pose.body.x + pose.body.w, pose.palm.x + pose.palm.w) - Math.min(pose.body.x, pose.palm.x) + 8, h: pose.body.h };
    const layer = textFigure(outW, outH, toOut, reachMask(pose), area, pose.body.h / 30, 'rgb(216,240,228)', 5);
    const l = layer.getContext('2d')!;
    // Fade toward the feet: it is only partly there.
    l.setTransform(...toOut);
    l.globalCompositeOperation = 'destination-out';
    const fade = l.createLinearGradient(0, pose.body.y + pose.body.h * 0.45, 0, pose.body.y + pose.body.h);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    l.fillStyle = fade;
    l.fillRect(area.x, area.y, area.w, area.h);
    // Twice: under undisturbed condensation the figure is only a trace; where the mist is wiped it reads clearly.
    if (fog) { l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = mist; l.drawImage(fog, 0, 0); l.drawImage(fog, 0, 0); l.globalAlpha = 1; }
    l.globalCompositeOperation = 'source-over';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = appear * 0.62;
    ctx.drawImage(layer, 0, 0);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------- Measured text (.kiro/specs/visual-precision-v6 R1) ----------

/**
 * Where a text's ink lies, in em of its font, relative to its origin on the baseline: it starts at `left` (negative
 * when a bearing or a swash reaches left of the origin) and ends at `right`; it rises `ascent` and falls `descent`.
 */
export interface Ink { left: number; right: number; ascent: number; descent: number; }
export type Measure = (text: string, family: string) => Ink;
/** Text is measured, and drawn, at this size under a scale: the shaping is then the measured one at every output size. */
const REF_PX = 100;
let measureCtx: CanvasRenderingContext2D | null = null;
const inkCache = new Map<string, Ink>();
/** The browser's own measurement of the font it actually uses (a fallback is measured as itself). */
export const measureInk: Measure = (text, family) => {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  measureCtx.font = `${REF_PX}px ${family}`;
  const key = `${measureCtx.font}|${text}`;
  let ink = inkCache.get(key);
  if (!ink) {
    const m = measureCtx.measureText(text);
    ink = { left: -m.actualBoundingBoxLeft / REF_PX, right: m.actualBoundingBoxRight / REF_PX, ascent: m.actualBoundingBoxAscent / REF_PX, descent: m.actualBoundingBoxDescent / REF_PX };
    if (inkCache.size > 200) inkCache.clear();
    inkCache.set(key, ink);
  }
  return ink;
};
/** Draws `text` with its origin at (x, y) on the baseline, `size` user units tall, shaped exactly as `measureInk` measured it. */
export function drawInk(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, family: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / REF_PX, size / REF_PX);
  ctx.font = `${REF_PX}px ${family}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export interface NoteRun { text: string; x: number; y: number; size: number; family: string; role: 'line' | 'sign'; }
export interface NoteLayout { runs: NoteRun[]; lines: string[]; size: number; fits: boolean; }
export const NOTE_FONTS = { hand: HAND_FONT, sign: UI_FONT } as const;
/** Margins inside the paper, as fractions of its width and height. */
export const NOTE_MARGIN = { x: 0.07, y: 0.1 } as const;

/**
 * Lays out a note's unfinished line and signature inside a paper of `paper` (user units), from measured ink: the line
 * wrapped by words (never inside a word, so "PER—" keeps its dash), as large as fits, at most three lines; the
 * signature below it in the UI font, as TERMINAL's note has it. Each line's ink starts at the inner left edge. Pure:
 * the measurer is passed in, so the layout can be tested with any font.
 */
export function layoutNote(paper: Size, fragment: string, signature: string, measure: Measure, fonts: { hand: string; sign: string } = NOTE_FONTS): NoteLayout {
  const left = paper.w * NOTE_MARGIN.x, top = paper.h * NOTE_MARGIN.y, width = paper.w * (1 - 2 * NOTE_MARGIN.x), bottom = paper.h * (1 - NOTE_MARGIN.y);
  const words = fragment.split(' ').filter(Boolean);
  const inkWidth = (text: string, family: string) => { const ink = measure(text, family); return ink.right - ink.left; };
  const wrap = (size: number): string[] | null => {
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (inkWidth(candidate, fonts.hand) * size <= width) { current = candidate; continue; }
      if (!current || inkWidth(word, fonts.hand) * size > width) return null;
      lines.push(current);
      current = word;
    }
    if (current) lines.push(current);
    return lines;
  };
  const sign = measure(signature, fonts.sign);
  const place = (size: number, lines: string[]): NoteLayout => {
    const pitch = size * 1.22, first = measure(lines[0]!, fonts.hand);
    const runs: NoteRun[] = [];
    let textBottom = top;
    lines.forEach((text, index) => {
      const ink = measure(text, fonts.hand), y = top + first.ascent * size + index * pitch;
      runs.push({ text, x: left - ink.left * size, y, size, family: fonts.hand, role: 'line' });
      textBottom = Math.max(textBottom, y + ink.descent * size);
    });
    const signSize = Math.min(size * 0.66, width / Math.max(0.01, sign.right - sign.left));
    const signY = bottom - sign.descent * signSize;
    runs.push({ text: signature, x: left - sign.left * signSize, y: signY, size: signSize, family: fonts.sign, role: 'sign' });
    const fits = lines.length <= 3 && signY - sign.ascent * signSize >= textBottom + size * 0.3 && signSize >= 2.6;
    return { runs, lines, size, fits };
  };
  let smallest: NoteLayout | null = null;
  for (let tenth = 75; tenth >= 35; tenth--) {
    const size = tenth / 10, lines = wrap(size);
    if (!lines) continue;
    const layout = place(size, lines);
    if (layout.fits) return layout;
    smallest = layout;
  }
  return smallest ?? place(3.5, [fragment]);
}

// ---------- TERMINAL's session window, as ECHO's live link sees it ----------

/** Mara's note in the session window (320×200 units): its paper, and its tilt about the paper's top-left corner. */
export const SESSION_NOTE = { x: 28, y: 146, w: 70, h: 34, tilt: -0.05 } as const;
/**
 * Where the session window never draws anything: left of the cord and the figure, between the header and the note.
 * ECHO writes its paused ghost line there, so the line never covers the window's own content.
 */
export const SESSION_QUIET: Box = { x: 8, y: 20, w: 104, h: 76 };

/** The session window drawn from a copy of the request's visible state, in TERMINAL's own colours. */
export function drawSessionFrame(ctx: CanvasRenderingContext2D, frame: SessionFrame, outW: number, outH: number, drift = 0): void {
  const S = SESSION_SIZE, sx = outW / S.w, sy = outH / S.h, toOut: Matrix = [sx, 0, 0, sy, 0, 0];
  ctx.save();
  ctx.setTransform(...toOut);
  const wall = ctx.createLinearGradient(0, 0, 0, S.h);
  wall.addColorStop(0, '#08110f'); wall.addColorStop(1, '#0c1815');
  ctx.fillStyle = wall; ctx.fillRect(0, 0, S.w, S.h);
  ctx.strokeStyle = 'rgba(159,224,180,0.05)'; ctx.lineWidth = 0.6;
  for (let x = 16; x < S.w; x += 16) { ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x, S.h); ctx.stroke(); }
  for (let y = 32; y < S.h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S.w, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(159,224,180,0.1)'; ctx.fillRect(0, 0, S.w, 15);
  ctx.fillStyle = 'rgba(159,224,180,0.8)'; ctx.font = `7px ${MONO_FONT}`; ctx.textBaseline = 'middle';
  ctx.fillText(frame.presence === 'glass' || frame.presence === 'released' ? 'last.session — the minute ended' : `last.session — recorded 23:59${frame.pid ? `  [${frame.pid}]` : ''}`, 6, 8);
  const done = frame.presence === 'glass' || frame.presence === 'released';
  // The way out, its bell and the call's cord.
  ctx.strokeStyle = 'rgba(159,224,180,0.6)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(266, 190); ctx.lineTo(266, 98); ctx.arc(286, 98, 20, Math.PI, 0); ctx.lineTo(306, 190); ctx.stroke();
  ctx.fillStyle = done ? 'rgba(159,224,180,0.16)' : 'rgba(159,224,180,0.05)';
  ctx.fillRect(270, 100, 32, 90);
  ctx.strokeStyle = 'rgba(240,196,122,0.75)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(278, 34); ctx.lineTo(294, 34); ctx.moveTo(286, 34); ctx.lineTo(286, 40); ctx.stroke();
  ctx.fillStyle = 'rgba(240,196,122,0.26)';
  ctx.beginPath(); ctx.moveTo(286, 40); ctx.bezierCurveTo(279, 40, 278, 46, 278, 52); ctx.bezierCurveTo(278, 58, 276, 61, 273, 64); ctx.lineTo(299, 64);
  ctx.bezierCurveTo(296, 61, 294, 58, 294, 52); ctx.bezierCurveTo(294, 46, 293, 40, 286, 40); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f0c47a'; ctx.beginPath(); ctx.arc(286, 67, 2.3, 0, Math.PI * 2); ctx.fill();
  if (frame.muffled) { ctx.fillStyle = '#c9b8a0'; ctx.fillRect(276, 57, 20, 6); }
  ctx.strokeStyle = 'rgba(240,196,122,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([3, 2.5]);
  ctx.beginPath();
  if (frame.retry && !done) { ctx.moveTo(286, 42); ctx.bezierCurveTo(236, 72, 118, 70, 74, 146); }
  else { ctx.moveTo(74, 146); ctx.bezierCurveTo(80, 126, 96, 120, 100, 136); }
  ctx.stroke(); ctx.setLineDash([]);
  // Mara's note, as TERMINAL's scene shows it: the unfinished line wrapped on ruled paper, then her signature. The layout
  // comes from the measured ink of the fonts in use (visual-precision-v6 R1); the clip only guards the paper's edge.
  const note = SESSION_NOTE, layout = layoutNote(note, NOTE_START, NOTE_SIGN, measureInk);
  ctx.save(); ctx.translate(note.x, note.y); ctx.rotate(note.tilt);
  ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(1.2, 1.8, note.w, note.h);
  ctx.fillStyle = '#ece2c6'; ctx.fillRect(0, 0, note.w, note.h);
  ctx.strokeStyle = 'rgba(159,183,196,0.4)'; ctx.lineWidth = 0.4;
  for (const run of layout.runs) if (run.role === 'line') { ctx.beginPath(); ctx.moveTo(note.w * 0.04, run.y + run.size * 0.2); ctx.lineTo(note.w * 0.96, run.y + run.size * 0.2); ctx.stroke(); }
  ctx.beginPath(); ctx.rect(0, 0, note.w, note.h); ctx.clip();
  for (const run of layout.runs) { ctx.fillStyle = run.role === 'line' ? '#2b2520' : '#5f5547'; drawInk(ctx, run.text, run.x, run.y, run.size, run.family); }
  ctx.restore();
  // The figure made of its own output, or the shadow it left.
  if (FIGURE && (frame.presence === 'terminal' || frame.presence === 'shadow')) {
    const body = { x: 160 - 34, y: 30 + drift, w: 68, h: 160 };
    const mask = (c: CanvasRenderingContext2D) => placeFigure(c, FIGURE, body);
    if (frame.presence === 'shadow') {
      ctx.fillStyle = 'rgba(3,6,6,0.9)';
      mask(ctx);
    } else {
      ctx.save();
      ctx.shadowColor = 'rgba(159,224,180,0.45)'; ctx.shadowBlur = 14 * sx;
      ctx.fillStyle = 'rgba(159,224,180,0.06)';
      mask(ctx);
      ctx.restore();
      const layer = textFigure(outW, outH, toOut, mask, body, 4.4, 'rgb(214,240,226)', 3);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.92;
      ctx.drawImage(layer, 0, 0);
      ctx.globalAlpha = 1;
      ctx.setTransform(...toOut);
    }
  }
  ctx.fillStyle = 'rgba(200,240,216,0.035)';
  for (let y = 0; y < S.h; y += 3) ctx.fillRect(0, y, S.w, 1);
  ctx.restore();
}

// ---------- Negatives, pictures and letters (always from their own data) ----------

export function sceneOf(negative: Exclude<Negative, { kind: 'session' }>): GlassScene {
  return { stage: negativeSize(negative), placement: negative.placement, field: negativeField(negative), writing: negativeWriting(negative) };
}

/** A capture's full negative (or one region of it). It never reads the live glass or the live request. */
export function drawNegative(ctx: CanvasRenderingContext2D, negative: Negative, region: Box | null, outW: number, outH: number, options: GlassOptions = {}): void {
  if (negative.kind === 'session') { drawSessionFrame(ctx, negative.session, outW, outH); return; }
  const whole = negative.kind === 'limited' ? negative.crop : { x: 0, y: 0, w: negative.stage.w, h: negative.stage.h };
  drawGlass(ctx, sceneOf(negative), region ?? whole, outW, outH, options);
}

/** Everything a letter needs to draw itself, from a draft (its own copy of the capture) or from a delivered snapshot. */
export interface LetterArt {
  kind: Negative['kind']; stage: Size; placement: Placement | null; field: FogField; session: SessionFrame | null;
  frame: Box; mist: number; mistWriting: string[]; lines: string[] | null; paper: Paper; layout: Layout;
}
export function letterArtFromDraft(draft: LetterDraft): LetterArt {
  const source = draft.source, captured = negativeWriting(source);
  return {
    kind: source.kind, stage: negativeSize(source), placement: source.kind === 'session' ? null : source.placement, field: negativeField(source),
    session: source.kind === 'session' ? source.session : null, frame: draft.frame, mist: draft.mist,
    mistWriting: draft.writing === 'mist' ? captured : [], lines: draft.writing === 'paper' && captured.length ? captured : null, paper: draft.paper, layout: draft.layout,
  };
}
export function letterArtFromSnapshot(snapshot: LetterSnapshot): LetterArt {
  return {
    kind: snapshot.kind, stage: snapshot.stage, placement: snapshot.placement, field: snapshot.patch ? patchField(snapshot.patch) ?? EMPTY_FIELD : EMPTY_FIELD,
    session: snapshot.session, frame: snapshot.frame, mist: snapshot.mist, mistWriting: snapshot.mistWriting, lines: snapshot.lines, paper: snapshot.paper, layout: snapshot.layout,
  };
}

/** The photograph: the frame of the capture, with the letter's own mist level. */
export function drawPicture(ctx: CanvasRenderingContext2D, art: Pick<LetterArt, 'kind' | 'stage' | 'placement' | 'field' | 'session' | 'frame' | 'mist' | 'mistWriting'>, outW: number, outH: number, writingStrength = 1): void {
  if (art.kind === 'session') { if (art.session) drawSessionFrame(ctx, art.session, outW, outH); return; }
  drawGlass(ctx, { stage: art.stage, placement: art.placement, field: art.field, writing: art.mistWriting }, art.frame, outW, outH, { mist: art.mist, writingStrength });
}

/** Paper proportions for each layout, so every surface shows the same letter at any size. */
export const LETTER_ASPECT: Readonly<Record<Layout, number>> = { beside: 1.62, below: 0.82 };
const PAPER: Readonly<Record<Paper, { base: string; grain: string; ink: string; border: string; shade: string }>> = {
  bone: { base: '#ebe3d2', grain: 'rgba(120,100,70,', ink: '#2a231d', border: '#f6f1e6', shade: 'rgba(60,40,20,0.22)' },
  night: { base: '#151d23', grain: 'rgba(200,210,215,', ink: '#e6ddcb', border: '#e4dccb', shade: 'rgba(0,0,0,0.45)' },
};

export interface LetterOptions {
  /** Lift animation: 0 = the words still in the mist, 1 = on the paper. */
  lift?: number;
  /** The words being lifted (only during the lift animation). */
  liftLines?: readonly string[];
  /** CANVAS's own preview only: outline the captured lines in the photograph that Lift would move. */
  highlightWriting?: readonly string[];
  /** CANVAS's own preview only: a dashed place on the paper where Mara's words go. Deliveries never draw it. */
  placeholder?: boolean;
}

/** The letter: paper, the chosen photograph and Mara's words, laid out beside or below. */
export function drawLetter(ctx: CanvasRenderingContext2D, art: LetterArt, outW: number, outH: number, options: LetterOptions = {}): void {
  const paper = PAPER[art.paper], W = outW, H = outH, m = Math.round(Math.min(W, H) * 0.06);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = paper.base;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const x = hash2(i, 1, 131) * W, y = hash2(i, 2, 131) * H, r = 0.4 + hash2(i, 3, 131) * 1.1;
    ctx.fillStyle = `${paper.grain}${0.05 + 0.07 * hash2(i, 4, 131)})`;
    ctx.fillRect(x, y, r * 2.4, r * 0.7);
  }
  const edge = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, art.paper === 'bone' ? 'rgba(90,70,40,0.16)' : 'rgba(0,0,0,0.35)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, W, H);
  // Photograph and note areas.
  let pw: number, ph: number, px: number, py: number, note: Box;
  if (art.layout === 'beside') {
    pw = (W - 3 * m) * 0.58; ph = pw / 1.6;
    if (ph > H - 2 * m) { ph = H - 2 * m; pw = ph * 1.6; }
    px = m; py = (H - ph) / 2;
    note = { x: px + pw + m, y: m, w: W - pw - 3 * m, h: H - 2 * m };
  } else {
    pw = W - 2 * m; ph = pw / 1.6;
    if (ph > H * 0.56) { ph = H * 0.56; pw = ph * 1.6; }
    px = (W - pw) / 2; py = m;
    note = { x: m, y: py + ph + m * 0.8, w: W - 2 * m, h: H - ph - m * 2.8 };
  }
  const border = Math.max(2, Math.round(pw * 0.03));
  ctx.fillStyle = paper.shade;
  ctx.fillRect(px - border + 2, py - border + 3, pw + border * 2, ph + border * 2);
  ctx.fillStyle = paper.border;
  ctx.fillRect(px - border, py - border, pw + border * 2, ph + border * 2);
  const ow = Math.max(1, Math.round(pw)), oh = Math.max(1, Math.round(ph));
  const picture = pictureLayer(ow, oh), p = picture.getContext('2d')!;
  p.setTransform(1, 0, 0, 1, 0, 0);
  p.clearRect(0, 0, ow, oh);
  const lift = options.lift ?? 1, lifting = lift < 1 && options.liftLines?.length;
  drawPicture(p, lifting ? { ...art, mistWriting: [...options.liftLines!] } : art, ow, oh, lifting ? 1 - lift : 1);
  ctx.drawImage(picture, Math.round(px), Math.round(py));
  // The material Lift would move: each captured line, outlined where it sits in the photograph.
  if (options.highlightWriting?.length && art.placement && art.kind !== 'session') {
    const scaleX = ow / art.frame.w, scaleY = oh / art.frame.h, pad = Math.max(2, oh * 0.012);
    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, ow, oh); ctx.clip();
    ctx.strokeStyle = 'rgba(240,196,122,0.95)'; ctx.fillStyle = 'rgba(240,196,122,0.14)';
    ctx.lineWidth = Math.max(1, oh * 0.006); ctx.setLineDash([Math.max(3, oh * 0.02), Math.max(2, oh * 0.012)]);
    for (const box of writingBoxes(art.placement, art.stage, options.highlightWriting)) {
      const x = px + (box.x - art.frame.x) * scaleX - pad, y = py + (box.y - art.frame.y) * scaleY - pad;
      const w = box.w * scaleX + pad * 2, h = box.h * scaleY + pad * 2;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, pad); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  // Mara's words, verbatim, in her hand.
  const lines = lifting ? [...options.liftLines!] : art.lines;
  if (options.placeholder && !lines?.length) {
    // Where her words will go: an empty, dashed note area with five faint rules (editor chrome, never delivered).
    ctx.save();
    ctx.strokeStyle = art.paper === 'bone' ? 'rgba(60,45,30,0.32)' : 'rgba(230,220,200,0.3)';
    ctx.lineWidth = Math.max(1, H * 0.004);
    ctx.setLineDash([Math.max(4, H * 0.018), Math.max(3, H * 0.012)]);
    const inset = Math.min(note.w, note.h) * 0.04;
    ctx.beginPath(); ctx.roundRect(note.x + inset, note.y + inset, note.w - inset * 2, note.h - inset * 2, Math.max(3, H * 0.012)); ctx.stroke();
    ctx.setLineDash([]);
    const rows = 5, top = note.y + note.h * 0.28, step = note.h * 0.1;
    for (let i = 0; i < rows; i++) {
      const width = (note.w - inset * 6) * (i === rows - 1 ? 0.55 : 0.9 - 0.08 * (i % 2));
      ctx.beginPath(); ctx.moveTo(note.x + inset * 3, top + i * step); ctx.lineTo(note.x + inset * 3 + width, top + i * step); ctx.stroke();
    }
    ctx.restore();
  }
  if (lines?.length) {
    ctx.save();
    ctx.globalAlpha = lifting ? lift : 1;
    ctx.fillStyle = paper.ink;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `100px ${HAND_FONT}`;
    // The wider of the advance and the ink: a script font's swash may reach past its advance (visual-precision-v6 R1).
    const widest = Math.max(...lines.map(text => { const m = ctx.measureText(text); return Math.max(m.width, m.actualBoundingBoxLeft + m.actualBoundingBoxRight); })) / 100;
    // No floor that would push the words past the paper: a thumbnail shows the same letter, only smaller.
    const size = Math.max(2, Math.min(note.w / widest, note.h / (lines.length * 1.55 + 0.4), H * 0.075));
    ctx.font = `${size}px ${HAND_FONT}`;
    const block = lines.length * size * 1.55;
    const baselines: number[] = [];
    let y = note.y + Math.max(0, (note.h - block) / 2) + size * 1.1;
    lines.forEach((_, index) => { y += index === 2 ? size * 0.45 : 0; baselines.push(y); y += size * 1.55; });
    // While lifting, the words settle from a little lower, but never from below the note area: the drift is bounded by
    // the room under the block's measured ink, so no frame of the animation puts a word near the paper's edge.
    const inkBottom = Math.max(...lines.map((text, index) => baselines[index]! + ctx.measureText(text).actualBoundingBoxDescent));
    const drift = lifting ? (1 - lift) * Math.min(size * 1.2, Math.max(0, note.y + note.h - inkBottom)) : 0;
    lines.forEach((text, index) => {
      const signature = index === lines.length - 1 && text.startsWith('—');
      ctx.textAlign = signature ? 'right' : 'left';
      ctx.fillText(text, signature ? note.x + note.w : note.x, baselines[index]! + drift);
    });
    ctx.restore();
  }
  ctx.restore();
}

/** A thumbnail canvas for any capture's picture (its frame), at device resolution. */
export function captureCanvas(negative: Negative, frame: Box, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas'), ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d')!;
  if (negative.kind === 'session') drawSessionFrame(ctx, negative.session, canvas.width, canvas.height);
  else drawNegative(ctx, negative, negative.kind === 'limited' ? negative.crop : frame, canvas.width, canvas.height);
  return canvas;
}

/** Sizes a canvas to its CSS box at device resolution; returns whether it has any area. */
export function fitCanvas(canvas: HTMLCanvasElement): boolean {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const ratio = Math.min(2, window.devicePixelRatio || 1), width = Math.round(rect.width * ratio), height = Math.round(rect.height * ratio);
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  return true;
}
