export type Point = { x: number; y: number };
export type FrameMode = 'home' | 'placed';
export interface Frame { x: number; y: number; mode: FrameMode }
export interface Configuration { lampX: number; angle: number; frame: Frame }
export type SurfaceSource = 'floor' | 'shadow' | 'frame-bottom' | 'frame-top' | 'gallery';
export interface Surface { id: string; source: SurfaceSource; a: Point; b: Point; walkable: boolean }
export interface ContactResult { valid: boolean; left: number; right: number }
export type FailureReason = 'gap' | 'step' | 'slope' | 'contact' | 'invalid';
export interface RoutePoint extends Point { support: SurfaceSource; transition?: boolean }
export interface RouteResult { success: boolean; points: RoutePoint[]; failure?: { reason: FailureReason; point: Point } }
export type Phase = 'cover' | 'editing' | 'tentative' | 'trial' | 'paused' | 'failed' | 'arrival' | 'final';
export type EditKind = 'lamp' | 'cutout' | 'frame';
export type Locale = 'en' | 'es';
export interface Preferences { language: Locale; sound: boolean; reducedMotion: boolean }
export interface GameState {
  phase: Phase;
  config: Configuration;
  pending: { kind: EditKind; before: Configuration; config: Configuration } | null;
  history: Configuration[];
  preferences: Preferences;
  completed: boolean;
  finalPlan: Configuration | null;
  introSeen: boolean;
  route: RouteResult | null;
  failure: RouteResult['failure'] | null;
}
export interface EditPatch { lampX?: number; angle?: number; frameX?: number; frameY?: number }
export interface SaveRecord {
  version: 1;
  config: Configuration;
  history: Configuration[];
  preferences: Preferences;
  completed: boolean;
  finalPlan: Configuration | null;
  introSeen: boolean;
  termination: 'playing' | 'final';
}
