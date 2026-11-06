import type { Configuration, Point } from './types';

export const EPSILON = 1e-7;
export const PIVOT: Point = { x: 400, y: 100 };
export const CUTOUT: readonly [Point, Point, Point] = [{ x: 0, y: 0 }, { x: 225, y: 90 }, { x: 375, y: 90 }];
export const LAMP = { min: 500, max: 740, y: 220 } as const;
export const FLOOR = { left: -250, right: 220, y: 0 } as const;
export const GALLERY = { left: 1120, right: 1500, y: 160 } as const;
export const FRAME = { width: 340, height: 180, border: 10, padWidth: 40, minContact: 20, homeX: -40, placementReach: 30 } as const;
export const FIGURE = { width: 40, height: 100, startX: 170, startY: 0 } as const;
export const MAX_SLOPE = Math.tan(Math.PI / 6);
export const MAX_STEP = 20;
export const MAX_REACH = 48;
export const HISTORY_LIMIT = 20;
export const STORAGE_KEY = 'the-wrong-window.v1';
export const cloneConfig = (config: Configuration): Configuration => ({ lampX: config.lampX, angle: config.angle, frame: { ...config.frame } });
export const initialConfig = (): Configuration => ({ lampX: LAMP.min, angle: 90, frame: { x: FRAME.homeX, y: FLOOR.y, mode: 'home' } });
