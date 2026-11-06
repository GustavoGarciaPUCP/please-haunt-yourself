import { EPSILON, FIGURE, FRAME, GALLERY, MAX_REACH, MAX_SLOPE, MAX_STEP } from './constants';
import { buildSurfaces, frameContacts, heightAt, validateConfiguration } from './geometry';
import type { Configuration, Point, RoutePoint, RouteResult, Surface } from './types';

interface Node extends Point { surface: number }
interface Edge { to: number; cost: number; transition: boolean }

export function hasArrived(point: Point, config: Configuration): boolean {
  const footLeft = point.x - FIGURE.width / 2;
  return Math.abs(point.y - GALLERY.y) <= EPSILON
    && footLeft >= GALLERY.left - EPSILON
    && point.x + FIGURE.width / 2 <= GALLERY.right + EPSILON
    && footLeft > config.frame.x + FRAME.width / 2 + EPSILON;
}

/** A finite support graph. Continuous slopes and support changes are distinct edges. */
export function planOnSurfaces(allSurfaces: readonly Surface[], config: Configuration): RouteResult {
  const surfaces = allSurfaces.filter(surface => {
    const dx = surface.b.x - surface.a.x;
    return surface.walkable && dx > EPSILON
      && Math.abs(surface.b.y - surface.a.y) <= MAX_SLOPE * dx + EPSILON;
  });
  const nodes: Node[] = [];
  const adjacency: Edge[][] = [];
  const bySurface: number[][] = surfaces.map(() => []);
  const nodeKeys = new Map<string, number>();
  const goalX = Math.max(GALLERY.left, config.frame.x + FRAME.width / 2) + FIGURE.width / 2 + 1;

  const addNode = (surfaceIndex: number, x: number): number => {
    const surface = surfaces[surfaceIndex]!;
    x = Math.max(surface.a.x, Math.min(surface.b.x, x));
    const key = `${surfaceIndex}:${x.toFixed(7)}`;
    const existing = nodeKeys.get(key);
    if (existing !== undefined) return existing;
    const index = nodes.length;
    nodes.push({ x, y: heightAt(surface, x), surface: surfaceIndex });
    adjacency.push([]); bySurface[surfaceIndex]!.push(index); nodeKeys.set(key, index);
    return index;
  };

  const addTransition = (aIndex: number, bIndex: number, ax: number, bx: number): void => {
    const a = surfaces[aIndex]!, b = surfaces[bIndex]!;
    const ay = heightAt(a, ax), by = heightAt(b, bx);
    if (bx < ax - EPSILON || bx - ax > MAX_REACH + EPSILON || Math.abs(by - ay) > MAX_STEP + EPSILON) return;
    // A continuous support cannot be dropped through before its actual edge.
    if (by < ay - EPSILON && ax < a.b.x - EPSILON) return;
    const from = addNode(aIndex, ax), to = addNode(bIndex, bx);
    adjacency[from]!.push({ to, cost: Math.max(0, bx - ax) * 1.5 + Math.abs(by - ay) * 4 + .001, transition: true });
  };

  surfaces.forEach((surface, index) => {
    addNode(index, surface.a.x); addNode(index, surface.b.x);
    for (const x of [FIGURE.startX, goalX]) if (x >= surface.a.x && x <= surface.b.x) addNode(index, x);
  });

  for (let aIndex = 0; aIndex < surfaces.length; aIndex++) {
    for (let bIndex = 0; bIndex < surfaces.length; bIndex++) {
      if (aIndex === bIndex) continue;
      const a = surfaces[aIndex]!, b = surfaces[bIndex]!;
      const lo = Math.max(a.a.x, b.a.x), hi = Math.min(a.b.x, b.b.x);
      if (lo <= hi + EPSILON) {
        const candidates = [lo, hi, FIGURE.startX, goalX];
        const aSlope = (a.b.y - a.a.y) / (a.b.x - a.a.x);
        const bSlope = (b.b.y - b.a.y) / (b.b.x - b.a.x);
        const slopeDifference = bSlope - aSlope;
        const interceptDifference = b.a.y - bSlope * b.a.x - (a.a.y - aSlope * a.a.x);
        if (Math.abs(slopeDifference) > EPSILON) {
          for (const delta of [-MAX_STEP, 0, MAX_STEP]) candidates.push((delta - interceptDifference) / slopeDifference);
        }
        for (const x of candidates) if (x >= lo - EPSILON && x <= hi + EPSILON) addTransition(aIndex, bIndex, Math.max(lo, Math.min(hi, x)), Math.max(lo, Math.min(hi, x)));
      } else if (b.a.x >= a.b.x) addTransition(aIndex, bIndex, a.b.x, b.a.x);
    }
  }

  surfaces.forEach((_surface, index) => {
    const indices = bySurface[index]!.sort((a, b) => nodes[a]!.x - nodes[b]!.x);
    for (let n = 0; n + 1 < indices.length; n++) {
      const from = indices[n]!, to = indices[n + 1]!;
      adjacency[from]!.push({ to, cost: Math.hypot(nodes[to]!.x - nodes[from]!.x, nodes[to]!.y - nodes[from]!.y), transition: false });
    }
  });

  const startSurface = surfaces.findIndex(surface => surface.source === 'floor' && surface.a.x <= FIGURE.startX && surface.b.x >= FIGURE.startX);
  if (startSurface < 0) return { success: false, points: [], failure: { reason: 'invalid', point: { x: FIGURE.startX, y: FIGURE.startY } } };
  const start = addNode(startSurface, FIGURE.startX);
  const distances = nodes.map(() => Infinity), visited = nodes.map(() => false);
  const parents: ({ from: number; transition: boolean } | null)[] = nodes.map(() => null);
  distances[start] = 0;
  let reached: number | undefined;
  for (let iteration = 0; iteration < nodes.length; iteration++) {
    let current = -1;
    for (let n = 0; n < nodes.length; n++) if (!visited[n] && Number.isFinite(distances[n]) && (current < 0 || distances[n]! < distances[current]!)) current = n;
    if (current < 0) break;
    visited[current] = true;
    const point = nodes[current]!;
    if (surfaces[point.surface]!.source === 'gallery' && hasArrived(point, config)) { reached = current; break; }
    for (const edge of adjacency[current]!) {
      const distance = distances[current]! + edge.cost;
      if (distance < distances[edge.to]! - EPSILON) { distances[edge.to] = distance; parents[edge.to] = { from: current, transition: edge.transition }; }
    }
  }

  let end = reached ?? start;
  if (reached === undefined) for (let n = 0; n < nodes.length; n++) {
    if (Number.isFinite(distances[n]) && (nodes[n]!.x > nodes[end]!.x + EPSILON || (Math.abs(nodes[n]!.x - nodes[end]!.x) <= EPSILON && distances[n]! < distances[end]!))) end = n;
  }
  const chain: number[] = [];
  for (let current: number | undefined = end; current !== undefined;) { chain.push(current); current = parents[current]?.from; }
  chain.reverse();
  const points: RoutePoint[] = chain.map(index => ({ x: nodes[index]!.x, y: nodes[index]!.y, support: surfaces[nodes[index]!.surface]!.source, transition: parents[index]?.transition ?? false }));
  if (reached !== undefined) return { success: true, points };
  const last = nodes[end]!;
  const steepNearby = allSurfaces.some(surface => !surface.walkable && surface.source === 'shadow' && surface.a.x <= last.x + MAX_REACH && surface.b.x >= last.x - EPSILON);
  const next = surfaces.filter(surface => surface.b.x > last.x + EPSILON && surface.a.x <= last.x + MAX_REACH + EPSILON);
  const reason = steepNearby ? 'slope' : next.some(surface => heightAt(surface, Math.max(last.x, surface.a.x)) > last.y + MAX_STEP) ? 'step' : 'gap';
  return { success: false, points, failure: { reason, point: { x: last.x, y: last.y } } };
}

export function tryRoute(value: unknown, options?: { includeFrame?: boolean; includeShadow?: boolean }): RouteResult {
  if (!validateConfiguration(value)) {
    const config = value && typeof value === 'object' ? value as Partial<Configuration> : {};
    const frame = config.frame;
    const point = { x: Number.isFinite(frame?.x) ? frame!.x - FRAME.width / 2 + FRAME.padWidth / 2 : FIGURE.startX, y: Number.isFinite(frame?.y) ? frame!.y : FIGURE.startY };
    const contacts = Number.isFinite(config.lampX) && Number.isFinite(config.angle) && Number.isFinite(frame?.x) && Number.isFinite(frame?.y) ? frameContacts(config as Configuration) : null;
    return { success: false, points: [{ x: FIGURE.startX, y: FIGURE.startY, support: 'floor' }], failure: { reason: contacts && !contacts.valid ? 'contact' : 'invalid', point } };
  }
  return planOnSurfaces(buildSurfaces(value, options), value);
}
