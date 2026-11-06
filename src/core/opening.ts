/**
 * Opening demonstration: the figure recognizes the high gallery and demonstrates
 * local support contact with the home frame, including lateral passage.
 *
 * Uses world/model coordinates (y-up). Demonstrates observable material rules
 * without solving the puzzle or moving any mechanism.
 */

import { FIGURE, FRAME } from './constants';
import type { Point } from './types';

/** A waypoint in the opening demonstration (world coordinates, y-up) */
export interface OpeningWaypoint {
  /** X position in world coordinates */
  x: number;
  /** Y position in world coordinates (0 = floor level, positive = up) */
  y: number;
  /** Whether this is a significant pause point */
  pause?: boolean;
}

/**
 * Opening demonstration waypoints (world coordinates, y-up).
 *
 * The figure starts at x170/y0, approaches the home frame, lifts to rail height
 * before reaching its side, traverses laterally at y=10 (on-rail), then reverses
 * safely back to the waiting position.
 *
 * Home frame: centerX = -40, bounds x = -210 to 130, rail at y=10, border=10.
 * Figure: width=40. The path lifts at x=150 (approach), traverses the right side
 * at rail-top height (y=10), then returns along the floor.
 */
export const OPENING_WAYPOINTS: readonly OpeningWaypoint[] = [
  { x: FIGURE.startX, y: FIGURE.startY }, // Start: x170, y0
  { x: 150, y: 0 }, // Approach the frame
  { x: 130, y: FRAME.border }, // Lift to rail-top height before the side
  { x: 90, y: FRAME.border, pause: true }, // Traverse laterally on-rail, pause at contact
  { x: 130, y: FRAME.border }, // Reverse back along the rail
  { x: FIGURE.startX, y: FIGURE.startY }, // Return to waiting position
];

/**
 * Calculate the total path length for the opening demonstration.
 */
export function openingPathLength(waypoints: readonly OpeningWaypoint[]): number {
  return waypoints.reduce((sum, point, index) => {
    const previous = waypoints[index - 1];
    return sum + (previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0);
  }, 0);
}

/**
 * Sample a position along the opening path at the given fraction (0 to 1).
 * Reduced motion always holds the contact pose, independent of the clock.
 */
export function sampleOpening(
  waypoints: readonly OpeningWaypoint[],
  fraction: number,
  reducedMotion: boolean
): Point {
  const first = waypoints[0] ?? { x: FIGURE.startX, y: FIGURE.startY };

  // Clamp fraction
  const t = Math.max(0, Math.min(1, fraction));

  // A still contact pose must also be available before the first animation tick.
  if (reducedMotion) {
    // Show the main contact pose (on the frame rail) as the key still
    const contactPoint = waypoints.find(w => w.pause);
    if (contactPoint) return { x: contactPoint.x, y: contactPoint.y };
    return waypoints[waypoints.length - 1] ?? first;
  }

  // Normal motion: interpolate along the path
  let remaining = t * openingPathLength(waypoints);

  for (let index = 1; index < waypoints.length; index++) {
    const a = waypoints[index - 1]!;
    const b = waypoints[index]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);

    if (remaining <= length && length > 0) {
      const ratio = remaining / length;
      return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
    }

    remaining -= length;
  }

  return waypoints[waypoints.length - 1] ?? first;
}

/**
 * Calculate duration for the opening animation based on path length and motion preference.
 * Normal motion: ~4 seconds. Reduced motion: brief display of key pose.
 */
export function openingDuration(reducedMotion: boolean): number {
  if (reducedMotion) {
    return 1500; // Brief display in reduced motion
  }
  // Normal motion: approximately 4 seconds for the demonstration
  const length = openingPathLength(OPENING_WAYPOINTS);
  return Math.max(3500, Math.min(4500, length / 80 * 1000));
}
