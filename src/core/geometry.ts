import { CUTOUT, EPSILON, FLOOR, FRAME, GALLERY, LAMP, MAX_SLOPE, PIVOT } from './constants';
import type { Configuration, ContactResult, Frame, Point, Surface, SurfaceSource } from './types';

export function project(config: Pick<Configuration, 'lampX' | 'angle'>): Point[] {
  const radians = config.angle * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians);
  return CUTOUT.map(point => ({ x: 2 * (PIVOT.x + point.x * c - point.y * s) - config.lampX, y: 2 * (PIVOT.y + point.x * s + point.y * c) - LAMP.y }));
}

const segment = (id: string, source: SurfaceSource, a: Point, b: Point): Surface => ({
  id, source, a, b, walkable: b.x - a.x > EPSILON && Math.abs(b.y - a.y) <= MAX_SLOPE * (b.x - a.x) + EPSILON,
});

export function upperProfile(points: readonly Point[]): Surface[] {
  const sorted = points.map(point => ({ ...point })).sort((a, b) => a.x - b.x || b.y - a.y);
  const unique: Point[] = [];
  for (const point of sorted) {
    const prior = unique[unique.length - 1];
    if (prior && Math.abs(point.x - prior.x) <= EPSILON) { if (point.y > prior.y) unique[unique.length - 1] = point; }
    else unique.push(point);
  }
  const hull: Point[] = [];
  for (const point of unique) {
    while (hull.length >= 2) {
      const a = hull[hull.length - 2]!, b = hull[hull.length - 1]!;
      const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
      if (cross < -EPSILON) break;
      hull.pop();
    }
    hull.push(point);
  }
  return hull.slice(1).map((point, index) => segment(`shadow-${index}`, 'shadow', hull[index]!, point));
}

export function heightAt(surface: Surface, x: number): number {
  const dx = surface.b.x - surface.a.x;
  return Math.abs(dx) <= EPSILON ? Math.max(surface.a.y, surface.b.y) : surface.a.y + (x - surface.a.x) / dx * (surface.b.y - surface.a.y);
}

function baseSurfaces(config: Configuration, includeShadow = true): Surface[] {
  return [
    segment('floor', 'floor', { x: FLOOR.left, y: FLOOR.y }, { x: FLOOR.right, y: FLOOR.y }),
    ...(includeShadow ? upperProfile(project(config)) : []),
    segment('gallery', 'gallery', { x: GALLERY.left, y: GALLERY.y }, { x: GALLERY.right, y: GALLERY.y }),
  ];
}

function overlapOnSupports(left: number, right: number, y: number, supports: readonly Surface[]): number {
  const intervals = supports.filter(surface => Math.abs(surface.b.y - surface.a.y) <= EPSILON && Math.abs(surface.a.y - y) <= EPSILON)
    .map(surface => [Math.max(left, surface.a.x), Math.min(right, surface.b.x)] as const)
    .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  let total = 0, end = -Infinity;
  for (const [a, b] of intervals) { total += Math.max(0, b - Math.max(a, end)); end = Math.max(end, b); }
  return total;
}

function contactsOn(config: Configuration, supports: readonly Surface[]): ContactResult {
  const leftEdge = config.frame.x - FRAME.width / 2, rightEdge = config.frame.x + FRAME.width / 2;
  const left = overlapOnSupports(leftEdge, leftEdge + FRAME.padWidth, config.frame.y, supports);
  const right = overlapOnSupports(rightEdge - FRAME.padWidth, rightEdge, config.frame.y, supports);
  return { left, right, valid: left >= FRAME.minContact - EPSILON && right >= FRAME.minContact - EPSILON };
}

export function frameContacts(config: Configuration): ContactResult { return contactsOn(config, baseSurfaces(config)); }

export function buildSurfaces(config: Configuration, options: { includeFrame?: boolean; includeShadow?: boolean } = {}): Surface[] {
  const surfaces = baseSurfaces(config, options.includeShadow !== false);
  if (options.includeFrame !== false && contactsOn(config, surfaces).valid) {
    const x = config.frame.x - FRAME.width / 2, right = x + FRAME.width;
    surfaces.push(segment('frame-bottom', 'frame-bottom', { x, y: config.frame.y + FRAME.border }, { x: right, y: config.frame.y + FRAME.border }));
    surfaces.push(segment('frame-top', 'frame-top', { x, y: config.frame.y + FRAME.height }, { x: right, y: config.frame.y + FRAME.height }));
  }
  return surfaces;
}

export function settleFrame(config: Configuration, x: number, y: number): Frame {
  const heights = baseSurfaces(config).filter(surface => Math.abs(surface.b.y - surface.a.y) <= EPSILON && Math.abs(surface.a.y - y) <= FRAME.placementReach + EPSILON)
    .map(surface => surface.a.y).sort((a, b) => Math.abs(a - y) - Math.abs(b - y));
  return { x, y: heights[0] ?? y, mode: 'placed' };
}

export function validateConfiguration(value: unknown): value is Configuration {
  if (!value || typeof value !== 'object') return false;
  const config = value as Configuration;
  if (!Number.isFinite(config.lampX) || config.lampX < LAMP.min || config.lampX > LAMP.max || !Number.isFinite(config.angle) || config.angle < 0 || config.angle > 90
    || !config.frame || typeof config.frame !== 'object' || !Number.isFinite(config.frame.x) || !Number.isFinite(config.frame.y)
    || (config.frame.mode !== 'home' && config.frame.mode !== 'placed')) return false;
  if (config.frame.mode === 'home' && (Math.abs(config.frame.x - FRAME.homeX) > EPSILON || Math.abs(config.frame.y - FLOOR.y) > EPSILON)) return false;
  return frameContacts(config).valid;
}
