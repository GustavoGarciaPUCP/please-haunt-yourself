import { describe, expect, it } from 'vitest';
import { FIGURE, FRAME } from '../src/core/constants';
import { frameContacts } from '../src/core/geometry';
import { initialConfig } from '../src/core/constants';
import { openingDuration, openingPathLength, OPENING_WAYPOINTS, sampleOpening } from '../src/core/opening';

describe('Opening demonstration', () => {
  it('provides waypoints starting and ending at figure start position', () => {
    expect(OPENING_WAYPOINTS[0]).toEqual({ x: FIGURE.startX, y: FIGURE.startY });
    const last = OPENING_WAYPOINTS[OPENING_WAYPOINTS.length - 1];
    expect(last).toEqual({ x: FIGURE.startX, y: FIGURE.startY });
  });

  it('includes a pause point on the frame rail for contact demonstration', () => {
    const pausePoint = OPENING_WAYPOINTS.find(w => w.pause);
    expect(pausePoint).toBeDefined();
    expect(pausePoint?.y).toBe(FRAME.border); // On the frame bottom rail
  });

  it('calculates bounded local path length', () => {
    const length = openingPathLength(OPENING_WAYPOINTS);
    expect(length).toBeGreaterThan(100); // Non-trivial demonstration
    expect(length).toBeLessThan(300); // Local, not crossing the full stage
  });

  it('demonstrates physical contact with home frame from above', () => {
    // The pause point should be within the home frame's horizontal bounds
    // Home frame: centerX = -40, width = 340, so bounds are x ∈ [-210, 130]
    const config = initialConfig();
    const pausePoint = OPENING_WAYPOINTS.find(w => w.pause);
    expect(pausePoint).toBeDefined();

    const frameLeft = config.frame.x - FRAME.width / 2;
    const frameRight = config.frame.x + FRAME.width / 2;
    expect(pausePoint!.x).toBeGreaterThanOrEqual(frameLeft);
    expect(pausePoint!.x).toBeLessThanOrEqual(frameRight);
    expect(pausePoint!.y).toBe(FRAME.border); // On top of rail

    // Verify home frame actually supports this position
    const contacts = frameContacts(config);
    expect(contacts.left).toBeGreaterThanOrEqual(FRAME.minContact);
    expect(contacts.right).toBeGreaterThanOrEqual(FRAME.minContact);
  });

  it('lifts before traversing frame side at rail height', () => {
    // Path should lift to rail height (y=10) before traversing laterally
    // Check that no waypoint is both at y=0 and inside the frame's right zone
    const frameRight = initialConfig().frame.x + FRAME.width / 2; // x = 130

    for (let i = 1; i < OPENING_WAYPOINTS.length - 1; i++) {
      const point = OPENING_WAYPOINTS[i]!;
      // If near or inside the frame's right edge
      if (point.x < frameRight && point.x > frameRight - 50) {
        // Should be at rail height, not floor level
        expect(point.y).toBeGreaterThanOrEqual(FRAME.border);
      }
    }
  });

  it('samples contact pose in reduced motion regardless of timing', () => {
    const pausePoint = OPENING_WAYPOINTS.find(w => w.pause)!;

    // All non-zero fractions should show the contact pose in reduced motion
    for (const fraction of [0, 0.3, 0.5, 0.7, 0.95, 1]) {
      const pos = sampleOpening(OPENING_WAYPOINTS, fraction, true);
      expect(pos).toEqual({ x: pausePoint.x, y: pausePoint.y });
    }

  });

  it('provides distinct durations for motion preferences', () => {
    const normal = openingDuration(false);
    const reduced = openingDuration(true);
    expect(normal).toBeGreaterThan(3000);
    expect(normal).toBeLessThan(5000);
    expect(reduced).toBeLessThan(2000);
    expect(reduced).toBeGreaterThan(1000);
  });
});
