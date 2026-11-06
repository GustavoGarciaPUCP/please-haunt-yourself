import { CUTOUT, FIGURE, FRAME, LAMP, STORAGE_KEY } from './core/constants';
import { frameContacts, project } from './core/geometry';
import { openingDuration, OPENING_WAYPOINTS, sampleOpening } from './core/opening';
import { decodeSave, encodeSave } from './core/persistence';
import { tryRoute } from './core/route';
import { beginEdit, cancelEdit, commitEdit, finishArrival, finishTrial, newGame, pauseTrial, previewEdit, resumeTrial, returnFrameHome, reviewConstruction, startTrial, stopTrial, undo } from './core/state';
import type { GameState, Locale, Point, Preferences, RouteResult } from './core/types';
import { WorkshopView, type WorkshopAction, type WorkshopModel } from './ui/workshop-view';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('The workshop root is missing.');
const preferencesKey = `${STORAGE_KEY}.preferences`;
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let storageUnavailable = false;
const read = (key: string): string | null => { try { return localStorage.getItem(key); } catch { storageUnavailable = true; return null; } };
const write = (key: string, value: string): void => { try { localStorage.setItem(key, value); } catch { storageUnavailable = true; } };
let manualPreferences: Partial<Preferences> = {};
try {
  const raw: unknown = JSON.parse(read(preferencesKey) ?? '{}');
  if (raw && typeof raw === 'object') {
    const value = raw as Record<string, unknown>;
    if (value.language === 'es' || value.language === 'en') manualPreferences.language = value.language;
    if (typeof value.sound === 'boolean') manualPreferences.sound = value.sound;
    if (typeof value.reducedMotion === 'boolean') manualPreferences.reducedMotion = value.reducedMotion;
  }
} catch { /* Malformed preferences fall back to the browser. */ }
const initialPreferences = (): Preferences => ({
  language: manualPreferences.language ?? ((navigator.languages[0] ?? navigator.language).toLowerCase().startsWith('es') ? 'es' : 'en'),
  sound: manualPreferences.sound ?? false,
  reducedMotion: manualPreferences.reducedMotion ?? motionQuery.matches,
});
const rawSave = read(STORAGE_KEY);
let savedState = rawSave ? decodeSave(rawSave) : null;
let state: GameState = { ...newGame(initialPreferences()), phase: 'cover' };
let notice = rawSave && !savedState ? 'invalid-save' : '';
let hintLevel = 0;
let elapsed = 0;
let duration = 1000;
let openingElapsed = 0;
let openingDurationValue = 0;
let arrivalElapsed = 0;
let lastTick = performance.now();
let endPosition: Point = { x: FIGURE.startX, y: FIGURE.startY };
let audio: AudioContext | null = null;
const view = new WorkshopView(root, dispatch);

const translated = (en: string, es: string): string => state.preferences.language === 'es' ? es : en;
const failureMessage = (reason: string): string => ({
  gap: translated('The path breaks here. There is not enough support to cross.', 'El camino se interrumpe aquí. Falta apoyo para cruzar.'),
  slope: translated('This part of the shadow is too steep to walk on.', 'Esta parte de la sombra está demasiado inclinada para caminar.'),
  step: translated('The next edge is too high to step onto.', 'El siguiente borde está demasiado alto para dar el paso.'),
  contact: translated('A corner of the frame lost its support. Your previous arrangement is restored.', 'Una esquina del marco perdió su apoyo. Se recuperó tu configuración anterior.'),
  invalid: translated('This arrangement could not be restored safely. Try a new construction.', 'No se pudo recuperar esta configuración con seguridad. Prueba una nueva construcción.'),
}[reason] ?? '');

function feedback(): string {
  if (hintLevel) {
    const hints = [
      translated('Watch the edges the figure can actually put its feet on.', 'Observa los bordes en los que la figura puede apoyar los pies.'),
      translated('The lamp changes where the shadow falls. The paper changes its shape. Look at what the frame is made of, too.', 'La lámpara cambia dónde cae la sombra. El recorte cambia su forma. Mira también de qué está hecho el marco.'),
      translated('The next hint explains one construction. Ask once more if you want to reveal it.', 'La siguiente pista explica una construcción. Pídela otra vez si quieres descubrirla.'),
      translated('Rest the paper at its lower stop. Move the light until the shadow meets the starting floor. The frame can rest with one end on the shadow’s flat top and the other on the gallery.', 'Lleva el recorte a su tope inferior. Mueve la luz hasta que la sombra conecte con el suelo inicial. El marco puede apoyar un extremo en la parte plana de la sombra y el otro en la galería.'),
    ];
    return hints[Math.min(hintLevel, 4) - 1]!;
  }
  if (state.failure) return failureMessage(state.failure.reason);
  if (state.phase === 'trial' && elapsed >= duration && state.route?.failure) return failureMessage(state.route.failure.reason);
  if (notice === 'invalid-save') return translated('The saved scene could not be read. You can begin a new performance.', 'No se pudo leer la escena guardada. Puedes empezar una nueva función.');
  if (storageUnavailable) return translated('Saving is unavailable in this browser. You can still play this session.', 'Este navegador no permite guardar. Puedes seguir jugando en esta sesión.');
  if (notice === 'cancelled') return translated('The tentative change was put back.', 'Se deshizo el cambio provisional.');
  if (state.phase === 'editing') return translated('Take your time. The figure will wait while you prepare the scene.', 'Tómate tu tiempo. La figura espera mientras preparas la escena.');
  return '';
}

function pathLength(route: RouteResult): number {
  return route.points.reduce((sum, point, index) => {
    const previous = route.points[index - 1];
    return sum + (previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0);
  }, 0);
}

function sampleRoute(route: RouteResult, fraction: number): Point {
  const first = route.points[0] ?? { x: FIGURE.startX, y: FIGURE.startY };
  let remaining = Math.max(0, Math.min(1, fraction)) * pathLength(route);
  for (let index = 1; index < route.points.length; index++) {
    const a = route.points[index - 1]!, b = route.points[index]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= length && length > 0) {
      if (state.preferences.reducedMotion) return fraction >= 1 ? b : a;
      let ratio = remaining / length;
      const gap = b.x - a.x;
      if (b.transition && gap > FIGURE.width) {
        const beforeSnap = FIGURE.width / 2 / gap, afterSnap = 1 - beforeSnap;
        if (ratio >= beforeSnap && ratio < afterSnap) ratio = afterSnap;
      }
      return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
    }
    remaining -= length;
  }
  return route.points[route.points.length - 1] ?? first;
}

function render(): void {
  const config = state.pending?.config ?? state.config;
  const contact = frameContacts(config);
  const figure = ['trial', 'paused'].includes(state.phase) && state.route ? sampleRoute(state.route, Math.min(1, elapsed / duration))
    : state.phase === 'opening' ? sampleOpening(OPENING_WAYPOINTS, Math.min(1, openingElapsed / openingDurationValue), state.preferences.reducedMotion)
    : ['arrival', 'final'].includes(state.phase) ? endPosition : { x: FIGURE.startX, y: FIGURE.startY };
  const model: WorkshopModel = {
    phase: state.phase, locale: state.preferences.language, sound: state.preferences.sound, reducedMotion: state.preferences.reducedMotion,
    hasSave: !!savedState, canUndo: !!state.history.length, lampX: config.lampX, angle: config.angle, lampMin: LAMP.min, lampMax: LAMP.max,
    shadow: project(config), cutout: CUTOUT, frame: { centerX: config.frame.x, bottomY: config.frame.y, atHome: config.frame.mode === 'home', held: state.phase === 'final', leftContact: contact.left, rightContact: contact.right },
    figure, feedback: feedback(), failurePoint: state.failure?.point ?? (state.phase === 'trial' && elapsed >= duration ? state.route?.failure?.point : undefined),
    editingKind: state.pending?.kind,
    geometry: { frameWidth: FRAME.width, frameHeight: FRAME.height, frameBorder: FRAME.border, padWidth: FRAME.padWidth, minContact: FRAME.minContact, figureWidth: FIGURE.width, figureHeight: FIGURE.height },
  };
  view.update(model);
}

function persist(): void {
  if (state.phase === 'cover') return;
  const encoded = encodeSave(state);
  write(STORAGE_KEY, encoded);
  savedState = decodeSave(encoded);
}

function tone(kind: 'edit' | 'trial' | 'arrival'): void {
  if (!state.preferences.sound) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(kind === 'arrival' ? 523.25 : kind === 'trial' ? 220 : 146.83, now);
    gain.gain.setValueAtTime(.001, now); gain.gain.linearRampToValueAtTime(.035, now + .012); gain.gain.exponentialRampToValueAtTime(.001, now + .14);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + .15);
  } catch { /* Sound remains optional; geometry and controls are unaffected. */ }
}

function askRestart(): void {
  const dialog = document.createElement('dialog'); dialog.className = 'help-dialog';
  const heading = document.createElement('h2'); heading.textContent = translated('Begin a new performance?', '¿Empezar una nueva función?');
  const text = document.createElement('p'); text.textContent = translated('This replaces the saved construction. Your preferences will stay.', 'Se sustituirá la construcción guardada. Se conservarán tus preferencias.');
  const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'primary'; confirm.textContent = translated('Begin again', 'Empezar de nuevo');
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'quiet'; cancel.textContent = translated('Keep this construction', 'Conservar esta construcción');
  cancel.style.color = '#49362e'; cancel.style.marginLeft = '10px';
  confirm.addEventListener('click', () => { dialog.close(); dialog.remove(); beginNewGame(); });
  cancel.addEventListener('click', () => { dialog.close(); dialog.remove(); });
  dialog.addEventListener('cancel', () => dialog.remove());
  dialog.append(heading, text, confirm, cancel); document.body.append(dialog); dialog.showModal();
}

function beginNewGame(): void {
  state = newGame({ ...state.preferences }); notice = ''; hintLevel = 0; elapsed = 0;

  // Start opening demonstration if not seen
  if (!state.introSeen) {
    state = { ...state, phase: 'opening' };
    openingElapsed = 0;
    openingDurationValue = openingDuration(state.preferences.reducedMotion);
  }

  persist(); render();
}

function dispatch(action: WorkshopAction): void {
  if (action.type === 'start') { if (savedState) askRestart(); else beginNewGame(); return; }
  if (action.type === 'restart') { askRestart(); return; }
  if (action.type === 'continue') {
    if (savedState) {
      state = { ...savedState, preferences: initialPreferences() };
      if (state.phase === 'final') { const route = tryRoute(state.config); endPosition = route.points[route.points.length - 1] ?? endPosition; }
      notice = ''; render();
      // If returning to editing after intro was seen, focus lamp
      if (state.phase === 'editing' && state.introSeen) {
        requestAnimationFrame(() => view.focusLampControl());
      }
    }
    return;
  }
  if (action.type === 'skip-opening') {
    if (state.phase === 'opening') {
      state = { ...state, phase: 'editing', introSeen: true };
      openingElapsed = 0;
      persist(); render();
      // Transfer focus to lamp control after rendering
      requestAnimationFrame(() => view.focusLampControl());
    }
    return;
  }
  if (action.type === 'preference') {
    state = cancelEdit(state);
    if (action.key === 'language' && (action.value === 'en' || action.value === 'es')) manualPreferences.language = action.value as Locale;
    if (action.key === 'sound' && typeof action.value === 'boolean') manualPreferences.sound = action.value;
    if (action.key === 'reducedMotion' && typeof action.value === 'boolean') manualPreferences.reducedMotion = action.value;
    state = { ...state, preferences: initialPreferences() };

    // If disabling reduced motion during opening, restart animation
    if (state.phase === 'opening' && action.key === 'reducedMotion' && !state.preferences.reducedMotion) {
      openingElapsed = 0;
      openingDurationValue = openingDuration(false);
    }
    // If enabling reduced motion during opening, keep coherent behavior
    if (state.phase === 'opening' && action.key === 'reducedMotion' && state.preferences.reducedMotion) {
      openingElapsed = 0;
      openingDurationValue = openingDuration(true);
    }

    write(preferencesKey, JSON.stringify(manualPreferences)); persist(); render(); return;
  }
  notice = ''; if (action.type !== 'hint') hintLevel = 0;
  switch (action.type) {
    case 'begin': state = beginEdit(state, action.kind); break;
    case 'preview': state = previewEdit(state, action); render(); return;
    case 'commit': { const result = commitEdit(state); state = result.state; if (result.accepted && result.changed) tone('edit'); break; }
    case 'cancel': if (state.pending) { state = cancelEdit(state); notice = 'cancelled'; } break;
    case 'home': state = returnFrameHome(state); break;
    case 'undo': state = undo(state); break;
    case 'trial': state = startTrial(state); elapsed = 0; if (state.route) duration = state.preferences.reducedMotion ? Math.max(600, Math.min(2200, pathLength(state.route) / 400 * 1000)) : Math.max(800, Math.min(12000, pathLength(state.route) / 160 * 1000)); tone('trial'); break;
    case 'pause': state = pauseTrial(state); break;
    case 'resume': state = resumeTrial(state); break;
    case 'stop': state = stopTrial(state); elapsed = 0; break;
    case 'review': state = reviewConstruction(state); break;
    case 'hint': if (['editing', 'failed'].includes(state.phase)) hintLevel = Math.min(4, hintLevel + 1); break;
    case 'help': {
      // Finish opening safely before showing dialog
      if (state.phase === 'opening') {
        state = { ...state, phase: 'editing', introSeen: true };
        openingElapsed = 0;
      }
      state = pauseTrial(cancelEdit(state));
      break;
    }
    case 'close-help': break;
  }
  persist(); render();
}

motionQuery.addEventListener('change', () => { if (manualPreferences.reducedMotion === undefined) { state = { ...state, preferences: { ...state.preferences, reducedMotion: motionQuery.matches } }; render(); } });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Finish opening safely if interrupted
    if (state.phase === 'opening') {
      state = { ...state, phase: 'editing', introSeen: true };
      openingElapsed = 0;
      persist(); render();
    } else {
      state = pauseTrial(cancelEdit(state));
      persist(); render();
    }
  }
});

function tick(timestamp: number): void {
  const delta = Math.max(0, Math.min(70, timestamp - lastTick)); lastTick = timestamp;
  if (state.phase === 'opening') {
    const wasReducedMotion = state.preferences.reducedMotion;

    // In reduced motion, hold at contact pose indefinitely
    if (wasReducedMotion) {
      // Don't increment elapsed time - wait for explicit Continue
      render();
    } else {
      // Normal motion: auto-complete after duration
      openingElapsed += delta;
      render();
      if (openingElapsed >= openingDurationValue) {
        state = { ...state, phase: 'editing', introSeen: true };
        openingElapsed = 0;
        persist(); render();
        // Transfer focus to lamp control after rendering
        requestAnimationFrame(() => view.focusLampControl());
      }
    }
  } else if (state.phase === 'trial' && state.route) {
    elapsed += delta;
    if (elapsed >= duration + 450) {
      endPosition = state.route.points[state.route.points.length - 1] ?? endPosition;
      state = finishTrial(state); arrivalElapsed = 0; persist();
    }
    render();
  } else if (state.phase === 'arrival') {
    arrivalElapsed += delta;
    if (arrivalElapsed >= 400) { state = finishArrival(state); persist(); tone('arrival'); render(); }
  }
  requestAnimationFrame(tick);
}
render(); requestAnimationFrame(tick);
