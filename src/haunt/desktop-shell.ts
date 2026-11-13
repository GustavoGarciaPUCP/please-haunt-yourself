import { PHASES, PHASE_ORDER, phaseIndex, type CasePhase } from './case-phase';
import { CASE_SAVE_KEY } from './case-save';
import { isUsefulCapture } from './echo-studio';
import { icon, type IconName } from './os-icons';
import { terminalBell } from './terminal-bell';
import { noticeText } from './haunting-presentation';
import { prefersReducedMotion } from './ghost-writing';
import type { CaseStore, OpenTarget } from './case-store';
import type { WindowManager } from './window-manager';
import type { AppKind } from './window-geometry';

export interface ShellHooks { arrange(): void; }

const APPS: ReadonlyArray<{ id: AppKind; label: string }> = [
  { id: 'terminal', label: 'TERMINAL' }, { id: 'echo', label: 'ECHO' }, { id: 'canvas', label: 'CANVAS' }, { id: 'postman', label: 'POSTMAN' },
];

/** What the desktop announces when the case moves forward: once, in the phase's own words. */
const PHASE_TOASTS: Partial<Record<CasePhase, string>> = {
  'call-stopped': 'The job will not restart. Its letter is still waiting.',
  'capture-retained': 'ECHO kept the glass: the picture and the writing.',
  'draft-ready': 'CANVAS has the picture and Mara’s words.',
  'ready-to-finish': 'Guest Inbox has the letter and its receipt.',
  finished: 'The letter arrived.',
};

interface DesktopFile { id: string; label: string; icon: IconName; title: string; target: OpenTarget; }

/**
 * HAUNT OS chrome (.kiro/specs/os-case-v4 R1): the taskbar with its launcher, running programs and tray, the desktop's
 * case files, notifications, the phase help, About and Start the case over. It only reads the case and asks the store
 * or the window manager to act; it never decides progress.
 */
export class DesktopShell {
  private readonly launcher: HTMLButtonElement;
  private readonly menu: HTMLElement;
  private readonly phaseButton: HTMLButtonElement;
  private readonly popover: HTMLElement;
  private hintLevel = 0;
  private filesKey = '';

  constructor(private readonly store: CaseStore, private readonly manager: WindowManager, private readonly hooks: ShellHooks) {
    this.launcher = document.getElementById('btn-launcher') as HTMLButtonElement;
    this.menu = document.getElementById('launcher-menu')!;
    this.phaseButton = document.getElementById('btn-phase') as HTMLButtonElement;
    this.popover = document.getElementById('phase-popover')!;
    for (const element of document.querySelectorAll<HTMLElement>('[data-icon]')) element.innerHTML = icon(element.dataset.icon as IconName);
    this.launcher.addEventListener('click', () => this.toggleMenu(this.menu.hidden === true, true));
    this.launcher.addEventListener('keydown', event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); this.toggleMenu(true, true); } });
    this.menu.addEventListener('click', event => this.menuClick(event));
    this.menu.addEventListener('keydown', event => this.menuKey(event));
    for (const app of APPS) {
      const button = document.getElementById(`btn-${app.id}`)!;
      button.addEventListener('click', () => manager.toggleFromTaskbar(app.id, button));
    }
    this.phaseButton.addEventListener('click', () => this.togglePopover(this.popover.hidden === true));
    this.popover.addEventListener('click', event => {
      const target = event.target as Element;
      if (target.closest('[data-phase-hint]')) { this.hintLevel = Math.max(this.hintLevel, 1); this.renderPopover(); this.popover.querySelector<HTMLButtonElement>('[data-phase-answer]')?.focus(); }
      if (target.closest('[data-phase-answer]')) { this.hintLevel = 2; this.renderPopover(); this.popover.querySelector<HTMLButtonElement>('[data-phase-close]')?.focus(); }
      if (target.closest('[data-phase-close]')) this.togglePopover(false, true);
    });
    document.getElementById('btn-sound')!.addEventListener('click', () => {
      // An explicit press is the user gesture browsers require before audio. Off by default.
      terminalBell.setEnabled(!terminalBell.enabled);
      this.renderSound();
    });
    document.addEventListener('pointerdown', event => {
      const target = event.target as Node;
      if (!this.menu.hidden && !this.menu.contains(target) && !this.launcher.contains(target)) this.toggleMenu(false, false);
      if (!this.popover.hidden && !this.popover.contains(target) && !this.phaseButton.contains(target)) this.togglePopover(false);
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (!this.menu.hidden) { event.preventDefault(); this.toggleMenu(false, true); }
      else if (!this.popover.hidden) { event.preventDefault(); this.togglePopover(false, true); }
    });
    const files = document.querySelector<HTMLElement>('.desktop-files')!;
    files.addEventListener('dblclick', event => this.openFile(event.target as Element));
    files.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); this.openFile(event.target as Element); } });
    files.addEventListener('click', event => {
      const file = (event.target as Element).closest<HTMLButtonElement>('.desktop-file');
      for (const other of files.querySelectorAll('.desktop-file')) other.setAttribute('aria-pressed', String(other === file));
    });
    const about = document.getElementById('about-dialog') as HTMLDialogElement;
    about.querySelector('[data-close]')!.addEventListener('click', () => about.close());
    const startOver = document.getElementById('start-over-dialog') as HTMLDialogElement;
    startOver.querySelector('[data-cancel]')!.addEventListener('click', () => startOver.close());
    startOver.querySelector('[data-confirm]')!.addEventListener('click', () => {
      startOver.close();
      this.store.startOver();
      this.toast('The case starts over', 'Mara’s job is open again. Letters you sent are in POSTMAN’s Archive.');
      this.manager.open('terminal', document.getElementById('btn-terminal'));
    });
    // The tray, the case files and the glass description never show POSTMAN's mail draft (.kiro/specs/fluid-typing-v9).
    store.subscribe(change => { if (change !== 'mail-draft') this.render(); });
    store.onPhase((phase, previous) => {
      // A new phase asks a new question: help starts again at the question, never at an answer given for another one,
      // also when the case falls back (confirmation-flow-v7 R4.3). Toasts only announce progress; when the case falls
      // back, a toast still announcing the earlier progress ("ready to finish") is no longer true, so it goes.
      this.hintLevel = 0;
      if (!this.popover.hidden) this.renderPopover();
      if (phaseIndex(phase) <= phaseIndex(previous)) { document.getElementById('toasts')?.replaceChildren(); return; }
      const text = PHASE_TOASTS[phase];
      if (text) this.toast(PHASES[phase].label, text);
    });
    manager.onChange(() => this.renderTaskbar());
    this.renderSound();
    this.renderClock();
    window.setInterval(() => this.renderClock(), 30_000);
    const notice = noticeText(store.peekNotice());
    if (notice) this.toast('HAUNT OS was updated', notice);
    this.render();
    this.renderTaskbar();
  }

  // ---------- Launcher ----------

  private toggleMenu(open: boolean, focus: boolean): void {
    this.menu.hidden = !open;
    this.launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      this.togglePopover(false);
      if (focus) this.menu.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    } else if (focus) this.launcher.focus();
  }
  private menuClick(event: MouseEvent): void {
    const item = (event.target as Element).closest<HTMLButtonElement>('[role="menuitem"]');
    if (!item) return;
    this.toggleMenu(false, false);
    const launch = item.dataset.launch as AppKind | undefined;
    if (launch) this.manager.open(launch, document.getElementById(`btn-${launch}`));
    if (item.hasAttribute('data-arrange')) this.hooks.arrange();
    if (item.hasAttribute('data-help')) this.togglePopover(true);
    if (item.hasAttribute('data-about')) this.openAbout();
    if (item.hasAttribute('data-start-over')) (document.getElementById('start-over-dialog') as HTMLDialogElement).showModal();
  }
  private menuKey(event: KeyboardEvent): void {
    const items = [...this.menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }
    else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); items[event.key === 'Home' ? 0 : items.length - 1]?.focus(); }
    else if (event.key === 'Tab') this.toggleMenu(false, false);
  }

  // ---------- Phase help ----------

  private togglePopover(open: boolean, focusButton = false): void {
    this.popover.hidden = !open;
    this.phaseButton.setAttribute('aria-expanded', String(open));
    if (open) {
      this.toggleMenu(false, false);
      this.renderPopover();
      const first = this.popover.querySelector<HTMLButtonElement>('[data-phase-hint]:not([hidden])') ?? this.popover.querySelector<HTMLButtonElement>('[data-phase-close]');
      first?.focus();
    } else if (focusButton) this.phaseButton.focus();
  }
  private renderPopover(): void {
    const info = this.store.phaseInfo, phase = this.store.phase, p = this.popover;
    p.querySelector('.phase-title')!.textContent = info.label;
    p.querySelector('.phase-pending')!.textContent = phase === 'finished' ? info.pending : `Still pending: ${info.pending}`;
    p.querySelector('.phase-question')!.textContent = info.question;
    const hint = p.querySelector<HTMLElement>('.phase-hint')!;
    hint.hidden = this.hintLevel === 0;
    hint.textContent = this.hintLevel >= 2 ? `${info.hint} ${info.answer}` : info.hint;
    p.querySelector<HTMLElement>('[data-phase-hint]')!.hidden = this.hintLevel > 0;
    p.querySelector<HTMLElement>('[data-phase-answer]')!.hidden = this.hintLevel !== 1;
    p.querySelector('.phase-steps')!.replaceChildren(...PHASE_ORDER.map(step => {
      const item = document.createElement('li');
      item.textContent = PHASES[step].label;
      item.dataset.state = phaseIndex(step) < phaseIndex(phase) ? 'done' : step === phase ? 'current' : 'next';
      if (step === phase) item.setAttribute('aria-current', 'step');
      return item;
    }));
  }

  // ---------- About ----------

  private openAbout(): void {
    const about = document.getElementById('about-dialog') as HTMLDialogElement;
    about.querySelector('[data-about="storage"]')!.textContent = this.store.saveState === 'saved'
      ? `Saved in this browser only (${CASE_SAVE_KEY}). Reloading continues this case.`
      : 'Session only: this browser did not keep the save, so the case lives only in this tab. It still finishes normally.';
    about.querySelector('[data-about="phase"]')!.textContent = this.store.phaseInfo.label;
    about.showModal();
  }

  // ---------- Notifications ----------

  toast(title: string, text: string): void {
    const box = document.getElementById('toasts')!;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = '<strong></strong><p></p>';
    toast.querySelector('strong')!.textContent = title;
    toast.querySelector('p')!.textContent = text;
    // One notification at a time, in the taskbar: the newest replaces the last.
    box.replaceChildren(toast);
    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), prefersReducedMotion() ? 0 : 260);
    }, 6500);
  }

  // ---------- Rendering ----------

  setContext(_app: AppKind | null): void { this.renderTaskbar(); }

  private renderTaskbar(): void {
    for (const app of this.manager.info()) {
      const button = document.getElementById(`btn-${app.id}`);
      if (!button) continue;
      const running = app.state !== 'closed';
      button.dataset.running = String(running);
      button.dataset.minimized = String(app.state === 'minimized');
      button.setAttribute('aria-pressed', String(app.active));
      const label = APPS.find(entry => entry.id === app.id)!.label;
      button.title = `${label}${running ? app.state === 'minimized' ? ' · minimized' : app.active ? ' · active' : ' · open' : ''}`;
    }
  }

  private renderSound(): void {
    const toggle = document.getElementById('btn-sound') as HTMLButtonElement;
    toggle.hidden = !terminalBell.supported;
    toggle.setAttribute('aria-pressed', String(terminalBell.enabled));
    toggle.setAttribute('aria-label', `Bell sound: ${terminalBell.enabled ? 'on' : 'off'}`);
    toggle.title = `Bell sound: ${terminalBell.enabled ? 'on' : 'off'}`;
    toggle.innerHTML = icon(terminalBell.enabled ? 'soundOn' : 'soundOff');
  }

  private renderClock(): void {
    const clock = document.querySelector<HTMLElement>('.tray-clock')!, now = new Date();
    clock.textContent = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(now);
    clock.setAttribute('datetime', now.toISOString());
    clock.title = now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** The case files on the desktop: the job always, then each object once it exists. Each opens that object. */
  private files(): DesktopFile[] {
    const store = this.store, files: DesktopFile[] = [{ id: 'job', label: 'last.job', icon: 'job', title: `Mara’s job · ${store.phaseInfo.label}`, target: { app: 'terminal', focus: 'job' } }];
    const captures = store.studio.list(), draft = store.letter.draft;
    const capture = (draft && captures.find(item => item.id === draft.captureId)) || [...captures].reverse().find(isUsefulCapture) || captures.at(-1);
    if (capture) files.push({ id: 'capture', label: `capture-${capture.id}`, icon: 'capture', title: draft?.captureId === capture.id ? 'The capture in the letter' : 'The latest capture in ECHO', target: { app: 'echo', capture: capture.id } });
    if (draft) files.push({ id: 'letter', label: 'letter', icon: 'letter', title: 'The letter in CANVAS', target: { app: 'canvas' } });
    const delivery = store.deliveredLetter();
    if (delivery?.receipt) files.push({ id: 'receipt', label: 'receipt', icon: 'receipt', title: store.finished ? 'The receipt the job accepted' : 'The receipt in Guest Inbox', target: { app: 'postman', delivery: delivery.id } });
    return files;
  }
  private openFile(target: Element): void {
    const button = target.closest<HTMLButtonElement>('.desktop-file');
    const file = button ? this.files().find(item => item.id === button.dataset.file) : null;
    if (file) this.store.open(file.target);
  }
  private renderFiles(): void {
    const files = this.files(), key = files.map(file => `${file.id}:${file.label}:${file.title}`).join('|');
    if (key === this.filesKey) return;
    this.filesKey = key;
    const list = document.querySelector('.desktop-files ul')!;
    const focused = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('.desktop-file')?.dataset.file;
    list.replaceChildren(...files.map(file => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'desktop-file';
      button.dataset.file = file.id;
      button.setAttribute('aria-pressed', 'false');
      button.title = `${file.title}. Double-click or press Enter to open.`;
      button.innerHTML = `<span class="file-icon" aria-hidden="true">${icon(file.icon)}</span><span class="file-label"></span>`;
      button.querySelector('.file-label')!.textContent = file.label;
      button.setAttribute('aria-label', `${file.label}: ${file.title}`);
      item.append(button);
      return item;
    }));
    if (focused) list.querySelector<HTMLButtonElement>(`[data-file="${focused}"]`)?.focus({ preventScroll: true });
  }

  private render(): void {
    const store = this.store, phase = store.phase;
    this.phaseButton.dataset.phase = phase;
    this.phaseButton.querySelector('.phase-label')!.textContent = PHASES[phase].label;
    this.phaseButton.setAttribute('aria-label', `Job phase: ${PHASES[phase].label}. Open help for this phase.`);
    document.querySelector<HTMLElement>('.tray-session-only')!.hidden = store.saveState !== 'session-only';
    document.body.dataset.phase = phase;
    const glass = store.glass;
    document.getElementById('glass-description')!.textContent = glass.released ? 'The desktop glass is clear. The hand let go when the letter arrived.'
      : glass.placement ? 'The desktop glass is misted. A handprint is pressed against it at the edge of TERMINAL, a figure made of text stands behind the glass, and words are written in the mist beside the hand. Drag on bare glass, or use ECHO, to wipe it.'
        : 'A quiet night behind the desktop glass.';
    if (!this.popover.hidden) this.renderPopover();
    this.renderFiles();
  }
}
