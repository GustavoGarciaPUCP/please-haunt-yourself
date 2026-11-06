import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { project, frameContacts } from '../src/core/geometry';
import { tryRoute } from '../src/core/route';
import { newGame, beginEdit, previewEdit, commitEdit } from '../src/core/state';
import { encodeSave, decodeSave } from '../src/core/persistence';
import type { Configuration, Preferences } from '../src/core/types';

describe('Physics Properties', () => {
  describe('Projection geometry', () => {
    it('fixed projection equation', () => {
      const result = project({ lampX: 650, angle: 45 });
      expect(result).toHaveLength(3);
      expect(result[0]!.x).toBeCloseTo(2 * 400 - 650, 5);
      expect(result[0]!.y).toBeCloseTo(2 * 100 - 220, 5);
    });

    it('lamp translation invariance', () => {
      const base = project({ lampX: 600, angle: 30 });
      const shifted = project({ lampX: 640, angle: 30 });
      for (let i = 0; i < 3; i++) {
        expect(shifted[i]!.x).toBeCloseTo(base[i]!.x - 40, 5);
        expect(shifted[i]!.y).toBeCloseTo(base[i]!.y, 5);
      }
    });

    it('shadow span bounded by 750 for angle [0,90]', () => {
      fc.assert(fc.property(
        fc.integer({ min: 500, max: 740 }),
        fc.integer({ min: 0, max: 90 }),
        (lampX, angle) => {
          const points = project({ lampX, angle });
          const xs = points.map(p => p.x);
          const span = Math.max(...xs) - Math.min(...xs);
          expect(span).toBeLessThanOrEqual(750 + 0.01);
        }
      ), { numRuns: 150, seed: 42 });
    });
  });

  describe('Frame contact validation', () => {
    it('known valid configuration has sufficient overlap', () => {
      const config: Configuration = { lampX: 700, angle: 0, frame: { x: 985, y: 160, mode: 'placed' } };
      const contacts = frameContacts(config);
      expect(contacts.valid).toBe(true);
      expect(contacts.left).toBeGreaterThanOrEqual(35 - 0.01);
      expect(contacts.right).toBeGreaterThanOrEqual(35 - 0.01);
    });

    it('insufficient left overlap invalidates frame', () => {
      const config: Configuration = { lampX: 740, angle: 0, frame: { x: 970, y: 160, mode: 'placed' } };
      const contacts = frameContacts(config);
      expect(contacts.left).toBeCloseTo(10, 0);
      expect(contacts.valid).toBe(false);
    });

    it('frame edge cases: lamp=650 angle=0 at y=160', () => {
      // At x=990: both pads have 40 overlap
      const config990: Configuration = { lampX: 650, angle: 0, frame: { x: 990, y: 160, mode: 'placed' } };
      const contacts990 = frameContacts(config990);
      expect(contacts990.left).toBeCloseTo(40, 1);
      expect(contacts990.right).toBeCloseTo(40, 1);
      expect(contacts990.valid).toBe(true);
      
      // At x=970: left=40, right=20 (boundary valid)
      const config970: Configuration = { lampX: 650, angle: 0, frame: { x: 970, y: 160, mode: 'placed' } };
      const contacts970 = frameContacts(config970);
      expect(contacts970.left).toBeCloseTo(40, 1);
      expect(contacts970.right).toBeCloseTo(20, 1);
      expect(contacts970.valid).toBe(true);
      
      // At x=969: left=40, right=19 (invalid)
      const config969: Configuration = { lampX: 650, angle: 0, frame: { x: 969, y: 160, mode: 'placed' } };
      const contacts969 = frameContacts(config969);
      expect(contacts969.left).toBeCloseTo(40, 1);
      expect(contacts969.right).toBeCloseTo(19, 1);
      expect(contacts969.valid).toBe(false);
    });
  });

  describe('Route validation', () => {
    it('known valid poses reach gallery', () => {
      const configs: Configuration[] = [
        { lampX: 650, angle: 0, frame: { x: 1010, y: 160, mode: 'placed' } },
        { lampX: 700, angle: 0, frame: { x: 985, y: 160, mode: 'placed' } },
      ];
      
      for (const config of configs) {
        const result = tryRoute(config);
        expect(result.success).toBe(true);
        const last = result.points[result.points.length - 1]!;
        expect(last.support).toBe('gallery');
        expect(last.y).toBeCloseTo(160, 0);
        const footLeft = last.x - 20;
        const frameRight = config.frame.x + 170;
        expect(footLeft).toBeGreaterThan(frameRight);
        expect(last.x + 20).toBeLessThanOrEqual(1500 + 0.01);
      }
    });

    it('includeFrame:false blocks crossing frame', () => {
      const config: Configuration = { lampX: 700, angle: 0, frame: { x: 985, y: 160, mode: 'placed' } };
      const withoutFrame = tryRoute(config, { includeFrame: false });
      expect(withoutFrame.success).toBe(false);
    });

    it('includeShadow:false blocks crossing shadow', () => {
      const config: Configuration = { lampX: 650, angle: 0, frame: { x: 1010, y: 160, mode: 'placed' } };
      const withoutShadow = tryRoute(config, { includeShadow: false });
      expect(withoutShadow.success).toBe(false);
    });
  });

  describe('State edit transactions', () => {
    it('valid lamp edit preserves or updates config', () => {
      fc.assert(fc.property(
        fc.integer({ min: 500, max: 740 }),
        (lampX) => {
          let state = newGame({ language: 'en', sound: false, reducedMotion: true });
          state = beginEdit(state, 'lamp');
          state = previewEdit(state, { lampX });
          const result = commitEdit(state);
          
          expect(result.accepted).toBe(true);
          expect(result.state.pending).toBeNull();
          expect(result.state.config.lampX).toBeCloseTo(lampX, 5);
          expect(frameContacts(result.state.config).valid).toBe(true);
        }
      ), { numRuns: 150, seed: 123 });
    });

    it('invalid frame placement rejects entire candidate', () => {
      let state = newGame({ language: 'en', sound: false, reducedMotion: true });
      state = beginEdit(state, 'frame');
      state = previewEdit(state, { frameX: 100, frameY: 50 });
      const result = commitEdit(state);
      
      expect(result.accepted).toBe(false);
      expect(result.state.config.frame.mode).toBe('home');
      expect(result.state.config.frame.x).toBeCloseTo(-40, 5);
    });

    it('random edits from solved configuration maintain validity or restore state', () => {
      fc.assert(fc.property(
        fc.constantFrom(
          { lampX: 650, angle: 0, frame: { x: 1010, y: 160, mode: 'placed' as const } },
          { lampX: 700, angle: 0, frame: { x: 985, y: 160, mode: 'placed' as const } }
        ),
        fc.constantFrom('lamp', 'cutout', 'frame'),
        fc.record({
          lampX: fc.integer({ min: 500, max: 740 }),
          angle: fc.integer({ min: 0, max: 90 }),
          frameX: fc.integer({ min: 800, max: 1200 }),
          frameY: fc.constant(160)
        }),
        (startConfig, editKind, patch) => {
          let state = newGame({ language: 'en', sound: false, reducedMotion: true });
          // Apply the known valid starting configuration
          state = beginEdit(state, 'lamp');
          state = previewEdit(state, { lampX: startConfig.lampX });
          state = commitEdit(state).state;
          state = beginEdit(state, 'cutout');
          state = previewEdit(state, { angle: startConfig.angle });
          state = commitEdit(state).state;
          state = beginEdit(state, 'frame');
          state = previewEdit(state, { frameX: startConfig.frame.x, frameY: startConfig.frame.y });
          const baseResult = commitEdit(state);
          expect(baseResult.accepted).toBe(true);
          state = baseResult.state;
          
          const beforeConfig = JSON.parse(JSON.stringify(state.config));
          const beforeHistory = JSON.parse(JSON.stringify(state.history));
          
          // Apply random edit
          state = beginEdit(state, editKind);
          state = previewEdit(state, patch);
          const result = commitEdit(state);
          
          if (result.accepted) {
            // Must be valid
            expect(frameContacts(result.state.config).valid).toBe(true);
            expect(result.state.pending).toBeNull();
            expect(result.state.phase).toBe('editing');
          } else {
            // Must restore exactly
            expect(JSON.stringify(result.state.config)).toBe(JSON.stringify(beforeConfig));
            expect(JSON.stringify(result.state.history)).toBe(JSON.stringify(beforeHistory));
            expect(result.state.pending).toBeNull();
          }
        }
      ), { numRuns: 150, seed: 789 });
    });
  });

  describe('Save persistence', () => {
    it('newGame initializes from preferences', () => {
      const prefs: Preferences = { language: 'es', sound: true, reducedMotion: false };
      const state = newGame(prefs);
      
      expect(state.phase).toBe('editing');
      expect(state.preferences).toEqual(prefs);
      expect(state.config.frame.mode).toBe('home');
      expect(state.history).toEqual([]);
      expect(frameContacts(state.config).valid).toBe(true);
    });

    it('encode/decode never restores tentative frame', () => {
      let state = newGame({ language: 'en', sound: false, reducedMotion: true });
      state = beginEdit(state, 'frame');
      state = previewEdit(state, { frameX: 50, frameY: 20 });
      
      const encoded = encodeSave(state);
      const decoded = decodeSave(encoded);
      
      expect(decoded).not.toBeNull();
      expect(decoded!.pending).toBeNull();
      expect(decoded!.config.frame.mode).toBe('home');
      expect(frameContacts(decoded!.config).valid).toBe(true);
    });

    it('restores valid bridge and history after unsupported frame attempt', () => {
      // Build a valid bridge configuration from known valid: lamp=650, angle=0, frame x=1010
      let state = newGame({ language: 'en', sound: false, reducedMotion: true });
      state = beginEdit(state, 'lamp');
      state = previewEdit(state, { lampX: 650 });
      state = commitEdit(state).state;
      state = beginEdit(state, 'cutout');
      state = previewEdit(state, { angle: 0 });
      state = commitEdit(state).state;
      state = beginEdit(state, 'frame');
      state = previewEdit(state, { frameX: 1010, frameY: 160 });
      state = commitEdit(state).state;
      
      expect(state.config.frame.mode).toBe('placed');
      expect(state.history).toHaveLength(3);
      
      // Save during an unsupported preview: storage must retain the confirmed bridge.
      state = beginEdit(state, 'frame');
      state = previewEdit(state, { frameX: 100, frameY: 50 });
      const encoded = encodeSave(state);
      const rejected = commitEdit(state);
      expect(rejected.accepted).toBe(false);
      
      // Decode should restore the valid bridge
      const decoded = decodeSave(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.config.lampX).toBeCloseTo(650, 5);
      expect(decoded!.config.angle).toBeCloseTo(0, 5);
      expect(decoded!.config.frame.x).toBeCloseTo(1010, 5);
      expect(decoded!.config.frame.y).toBeCloseTo(160, 5);
      expect(decoded!.config.frame.mode).toBe('placed');
      expect(decoded!.history).toHaveLength(3);
      expect(decoded!.pending).toBeNull();
      expect(decoded!.config).toEqual(rejected.state.config);
      expect(decoded!.history).toEqual(rejected.state.history);
      expect(frameContacts(decoded!.config).valid).toBe(true);
    });

    it('decode rejects corrupted invalid support', () => {
      const valid = newGame({ language: 'en', sound: false, reducedMotion: true });
      const encoded = encodeSave(valid);
      const tampered = encoded.replace('"x":-40', '"x":999');
      
      expect(decodeSave(tampered)).toBeNull();
    });
  });
});
