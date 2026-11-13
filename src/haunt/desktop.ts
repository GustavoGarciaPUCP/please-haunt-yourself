/**
 * PLEASE HAUNT YOURSELF — HAUNT OS 4 (.kiro/specs/os-case-v4). One case store shared by TERMINAL, ECHO, CANVAS and
 * POSTMAN; one window manager; the desktop glass painted behind every window; the shell around them.
 */
import { CaseStore } from './case-store';
import { loadCase } from './case-save';
import { placeImpression, type Box } from './glass-model';
import { GlassView } from './glass-view';
import { WindowManager, type AppEntry } from './window-manager';
import type { AppKind } from './window-geometry';
import { DesktopShell } from './desktop-shell';
import { FirstVisitCoach, playBoot } from './first-run';
import { TerminalController } from './terminal-view';
import { EchoController } from './echo-view';
import { CanvasController } from './canvas-view';
import { PostmanController } from './postman-view';
import { FIGURE_MASK } from './specter-art';

export function init(): void {
  const stage = document.getElementById('desktop-stage');
  if (!stage) return;
  document.documentElement.style.setProperty('--figure-mask', FIGURE_MASK);
  const loaded = loadCase();
  // The entry plays only for a desk that has never held this case; a reload goes straight back to work.
  const fresh = loaded.save === null && loaded.notice === null;
  const store = new CaseStore(loaded);
  const glassView = new GlassView(stage, store.glass, { wipeEnded: () => store.persist(), revealSeen: () => store.persist() });
  if (store.glass.placement) glassView.finishReveal();

  const registry = new Map<AppKind, AppEntry>([
    ['terminal', { id: 'terminal', title: 'TERMINAL', icon: 'terminal', create: (content, context) => new TerminalController(content, store, context, { takeNotice: () => store.takeNotice(), glassView }) }],
    ['echo', { id: 'echo', title: 'ECHO', icon: 'echo', create: (content, context) => new EchoController(content, store, context, { stage, glassView }) }],
    ['canvas', { id: 'canvas', title: 'CANVAS', icon: 'canvas', create: (content, context) => new CanvasController(content, store, context) }],
    ['postman', { id: 'postman', title: 'POSTMAN', icon: 'postman', create: (content, context) => new PostmanController(content, store, context) }],
  ]);
  let shell: DesktopShell | null = null;
  const coach = new FirstVisitCoach(stage);
  const manager = new WindowManager(stage, registry, () => { shell?.setContext(null); coach.refresh(); });
  shell = new DesktopShell(store, manager, { arrange: () => manager.arrange() });
  manager.onChange(() => coach.refresh());

  const stageBox = (element: Element): Box => {
    const rect = element.getBoundingClientRect(), origin = stage.getBoundingClientRect();
    return { x: rect.left - origin.left, y: rect.top - origin.top, w: rect.width, h: rect.height };
  };
  // The impression is pressed against TERMINAL's real edge, avoiding the other windows when it can.
  store.setPlacer(() => {
    const terminal = manager.isOpen('terminal') ? manager.element('terminal') : null;
    const occluders = (['echo', 'canvas', 'postman'] as const).filter(id => manager.isOpen(id)).map(id => stageBox(manager.element(id)!));
    return placeImpression(glassView.stageSize, terminal ? stageBox(terminal) : null, occluders);
  });
  store.glass.subscribe(change => {
    if (change !== 'place') return;
    // TERMINAL's pane renders after this listener in the same notification; read its cue length once it has.
    queueMicrotask(() => {
      const pane = manager.element('terminal')?.querySelector<HTMLElement>('.session-pane');
      const delay = pane && !pane.closest('[hidden]') ? Number(pane.dataset.impressDelay ?? 0) : 0;
      glassView.startReveal(Number.isFinite(delay) ? delay : 0);
    });
  });
  store.onOpen(target => manager.open(target.app, document.getElementById(`btn-${target.app}`), target));

  const start = () => {
    manager.open('terminal', document.getElementById('btn-terminal'));
    if (store.phase === 'repeating') coach.show(manager.element('terminal')?.querySelector<HTMLElement>('[data-enter-session]') ?? null);
  };
  const boot = document.getElementById('boot');
  if (fresh && boot) playBoot(boot, start);
  else start();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
