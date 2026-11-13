/**
 * Window geometry for HAUNT OS (.kiro/specs/os-case-v4 design §6). Pure functions: bounds are pixels inside the
 * workspace (the desktop stage above the taskbar). Windows own `left/top/width/height`; animations own only
 * `transform/opacity`, so a resize or a drag can never be overwritten by motion.
 */
export interface Bounds { left: number; top: number; width: number; height: number; }
export interface Workspace { width: number; height: number; }
export interface MinSize { width: number; height: number; }
export type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export type AppKind = 'terminal' | 'echo' | 'canvas' | 'postman';
export const EDGES: readonly Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
export const MIN_SIZE: Readonly<Record<AppKind, MinSize>> = {
  terminal: { width: 480, height: 420 },
  echo: { width: 640, height: 480 },
  canvas: { width: 680, height: 500 },
  postman: { width: 640, height: 460 },
};
export const KEY_STEP = 20;
export const KEY_STEP_LARGE = 80;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const round = (bounds: Bounds): Bounds => ({ left: Math.round(bounds.left), top: Math.round(bounds.top), width: Math.round(bounds.width), height: Math.round(bounds.height) });

/** The smallest size a window may take in this workspace (never larger than the workspace itself). */
export function effectiveMin(min: MinSize, ws: Workspace): MinSize {
  return { width: Math.min(min.width, ws.width), height: Math.min(min.height, ws.height) };
}

/** Keeps a window's size within its minimum and the workspace, and the whole window inside the workspace. */
export function clampBounds(bounds: Bounds, ws: Workspace, min: MinSize): Bounds {
  const m = effectiveMin(min, ws);
  const width = clamp(bounds.width, m.width, ws.width), height = clamp(bounds.height, m.height, ws.height);
  return round({ left: clamp(bounds.left, 0, ws.width - width), top: clamp(bounds.top, 0, ws.height - height), width, height });
}

export const maximizedBounds = (ws: Workspace): Bounds => ({ left: 0, top: 0, width: Math.round(ws.width), height: Math.round(ws.height) });

/** Moving keeps the size; only the position is clamped. */
export function moveBounds(bounds: Bounds, dx: number, dy: number, ws: Workspace, min: MinSize): Bounds {
  return clampBounds({ ...bounds, left: bounds.left + dx, top: bounds.top + dy }, ws, min);
}

/**
 * Resizing from an edge or corner: the opposite edge stays where it is. The size never goes below the app's minimum and
 * the window never leaves the workspace.
 */
export function resizeBounds(start: Bounds, edge: Edge, dx: number, dy: number, ws: Workspace, min: MinSize): Bounds {
  const m = effectiveMin(min, ws);
  let { left, top, width, height } = start;
  const right = start.left + start.width, bottom = start.top + start.height;
  if (edge.includes('e')) width = clamp(start.width + dx, m.width, ws.width - start.left);
  if (edge.includes('s')) height = clamp(start.height + dy, m.height, ws.height - start.top);
  if (edge.includes('w')) { left = clamp(start.left + dx, 0, right - m.width); width = right - left; }
  if (edge.includes('n')) { top = clamp(start.top + dy, 0, bottom - m.height); height = bottom - top; }
  return round({ left, top, width, height });
}

/** Keyboard resizing grows or shrinks the right and bottom edges. */
export function keyboardResize(bounds: Bounds, dx: number, dy: number, ws: Workspace, min: MinSize): Bounds {
  return resizeBounds(bounds, dx !== 0 && dy !== 0 ? 'se' : dx !== 0 ? 'e' : 's', dx, dy, ws, min);
}

export function keyboardStep(key: string, large: boolean): { dx: number; dy: number } | null {
  const step = large ? KEY_STEP_LARGE : KEY_STEP;
  switch (key) {
    case 'ArrowLeft': return { dx: -step, dy: 0 };
    case 'ArrowRight': return { dx: step, dy: 0 };
    case 'ArrowUp': return { dx: 0, dy: -step };
    case 'ArrowDown': return { dx: 0, dy: step };
    default: return null;
  }
}

/**
 * Dragging a maximized window restores its normal size under the pointer, keeping the pointer at the same relative
 * point of the titlebar.
 */
export function restoreUnderPointer(normal: Bounds, pointer: { x: number; y: number }, ratioX: number, titlebarY: number, ws: Workspace, min: MinSize): Bounds {
  return clampBounds({ ...normal, left: pointer.x - clamp(ratioX, 0, 1) * normal.width, top: pointer.y - titlebarY }, ws, min);
}

/** The default layout for each app, so TERMINAL and ECHO can sit side by side and the others open centred. */
export function defaultBounds(app: AppKind, ws: Workspace): Bounds {
  const min = MIN_SIZE[app];
  const top = (height: number, nudge = 0) => clamp(Math.round((ws.height - height) / 2) + nudge, 12, 96 + nudge);
  let bounds: Bounds;
  switch (app) {
    case 'terminal': {
      const width = clamp(0.42 * ws.width, 560, 700), height = clamp(ws.height - 48, 480, 780);
      bounds = { left: clamp(0.08 * ws.width, 112, 200), top: top(height), width, height };
      break;
    }
    case 'echo': {
      const width = clamp(0.56 * ws.width, 720, 940), height = clamp(ws.height - 48, 520, 780);
      bounds = { left: ws.width - width - 24, top: top(height), width, height };
      break;
    }
    case 'canvas': {
      const width = clamp(0.6 * ws.width, 760, 1000), height = clamp(ws.height - 48, 540, 780);
      bounds = { left: (ws.width - width) / 2 + 40, top: top(height, 6), width, height };
      break;
    }
    case 'postman': {
      const width = clamp(0.58 * ws.width, 760, 960), height = clamp(ws.height - 64, 520, 740);
      bounds = { left: (ws.width - width) / 2 + 72, top: top(height, 18), width, height };
      break;
    }
  }
  return clampBounds(bounds, ws, min);
}

export const sameBounds = (a: Bounds | null, b: Bounds | null): boolean =>
  !!a && !!b && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
