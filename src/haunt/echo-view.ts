/** ECHO-01. Kiro first pass, completed in Codex; see development log. */
import { createScene, moveProp, setPropPosition, validateCoverage, startPerformance,
  pausePerformance, resumePerformance, returnToEditing, completePerformance,
  failPerformance, setHostReaction, SCENE_CONFIG, type HostReaction } from './echo-scene';
import { ProcessSession, assessStage } from './process-session';

type Phase = 'idle' | 'appearance' | 'host-reaction' | 'echo-response';
const durations = { appearance: 280, 'host-reaction': 240, 'echo-response': 160 };
const inkCreature = `<path d="M273 236q-21-43-11-81-30 30-41 58-8-47 24-80 5-43 30-57 32-16 49 19 15 37 5 65 29 32 30 72-27-21-37-40l10 51-17-9-8 9-12-8-9 9z" fill="#11171e" stroke="#849292" stroke-opacity=".5"/>
  <ellipse cx="278" cy="111" rx="5" ry="10" fill="#e7d9b7"/><ellipse cx="296" cy="114" rx="5" ry="9" fill="#e7d9b7"/>
  <path class="ink-mouth" d="M278 145q8-16 18 0" stroke="#b08781" stroke-width="3" fill="none"/>`;
const paperHost = `<path d="m141 129-43 108 28-8 4 18 27-10 17 11 21-12 24 7-28-101z" fill="url(#paper-fold)" stroke="#aa9273"/>
  <path d="m141 129 13 108 20 11-6-104 27 92-4-94z" fill="#aa9273" opacity=".45"/>
  <path d="m141 129-44 43 28-3 28-33 38 6 24 31-26-10-14-19z" fill="#e5d8ba"/>
  <path d="m157 68-44 72 39-14 38 14z" fill="#ede3cc" stroke="#c1aa85"/>
  <path d="m137 116 10-6 5 5-8 6zM160 111l10 5-8 5-6-5z" fill="#36332e"/>
  <path d="m145 160 7 13-12 9m16 15-12 9m28-33 10 9-6 14" stroke="#8a765a" fill="none" stroke-width="2"/>`;

export class EchoController {
  private scene = createScene();
  private phase: Phase = 'idle';
  private timer: number | undefined;
  private disposed = false;
  private readonly unsubscribe: () => void;
  private processNotice = false;
  private readonly events = new AbortController();
  private readonly motion = matchMedia('(prefers-reduced-motion: reduce)');
  private readonly prop: HTMLElement;
  private readonly board: HTMLElement;
  private readonly status: HTMLElement;
  private readonly caption: HTMLElement;
  private readonly help: HTMLElement;
  private drag: { pointerId: number; x: number; y: number; target: HTMLElement } | undefined;

  constructor(private readonly container: HTMLElement, private readonly session: ProcessSession) {
    const { publicStage: stage, privateView: view } = SCENE_CONFIG;
    container.innerHTML = `
      <div class="echo-appbar"><span class="echo-brand"><span aria-hidden="true">◉</span> ECHO <span>Capture studio</span></span><span class="echo-transport-state"></span></div>
      <header class="echo-intro"><p class="echo-source">Example entrance</p>
        <h3>Don't let me watch myself.</h3>
        <p>“I can scare a stranger. My own reflection? Absolutely not.”</p></header>
      <div class="echo-board-wrap">
        <svg class="echo-board" viewBox="0 0 640 410" role="img" aria-label="A paper host on the public stage; ECHO waits in a separate private self-view.">
          <defs>
            <radialGradient id="stage-light"><stop stop-color="#a16b41" stop-opacity=".6"/><stop offset="1" stop-color="#172329"/></radialGradient>
            <linearGradient id="paper-fold"><stop stop-color="#f1e6cc"/><stop offset="1" stop-color="#bda783"/></linearGradient>
          </defs>
          <text x="20" y="45" class="board-label">Public stage</text>
          <text x="450" y="45" class="board-label">Private self-view</text>
          <svg x="${stage.x}" y="${stage.y}" width="${stage.width}" height="${stage.height}" viewBox="0 0 480 290" preserveAspectRatio="none" class="public-footage">
            <rect width="480" height="290" rx="9" fill="url(#stage-light)"/>
            <path d="M0 0h105Q88 57 17 95L0 152zM480 0H375q18 57 88 95l17 57z" fill="#642c34"/>
            <path d="M0 0q45 28 105 0M375 0q60 28 105 0" fill="none" stroke="#b5794a" stroke-opacity=".5"/>
            <ellipse cx="249" cy="252" rx="175" ry="14" fill="#11181e" opacity=".8"/>
            <g id="host" class="actor host-actor">${paperHost}</g>
            <g id="echo" class="actor ink-actor">${inkCreature}</g>
            <path d="M27 251h426" stroke="#aa7b53" stroke-opacity=".5"/>
            <g fill="#c49a63"><circle cx="46" cy="267" r="2"/><circle cx="143" cy="267" r="2"/><circle cx="240" cy="267" r="2"/><circle cx="337" cy="267" r="2"/><circle cx="434" cy="267" r="2"/></g>
          </svg>
          <rect x="${view.x}" y="${view.y}" width="${view.width}" height="${view.height}" fill="#0f1820"/>
          <svg x="${view.x}" y="${view.y}" width="${view.width}" height="${view.height}" viewBox="0 0 160 110" class="private-footage">
            <rect width="160" height="110" fill="#39434a"/><g transform="translate(-78 -24) scale(.55)">${inkCreature}</g>
          </svg>
          <path d="M450 200h160" stroke="#8d9b9a" stroke-opacity=".25"/>
          <text x="450" y="218" class="board-note" data-private-note>Only ECHO sees this.</text>
          <text x="20" y="365" class="board-note">Keep the stage clear. Give ECHO some privacy.</text>
        </svg>
        <div class="farewell-prop" role="group" aria-label="Farewell panel. Arrow keys move; Shift for fine adjustment." tabindex="0">
          <div class="prop-header">UNINSTALL <span aria-hidden="true">⠿</span></div>
          <div class="prop-body"><p>A permanent<br>farewell.</p></div>
        </div>
      </div>
      <p class="echo-caption">The host is waiting. ECHO isn't ready.</p>
      <p class="echo-feed-state"></p>
      <div class="echo-readiness" aria-label="Set readiness"><span data-private></span><span data-public></span></div>
      <div class="echo-controls" aria-label="Scene controls">
        <div class="control-group">
          <button class="control-btn" data-action="rehearse" data-primary>Rehearse entrance</button>
          <button class="control-btn" data-action="resume" hidden>Resume entrance</button>
          <button class="control-btn" data-action="edit">Edit set</button>
          <button class="control-btn" data-action="leave">Leave now</button>
        </div>
        <div class="control-group">
          <label class="control-label">Host reaction <select class="control-select" data-reaction>
            <option value="collapse">Collapse</option><option value="scare">Scare back</option>
          </select></label>
          <button class="control-btn control-btn-secondary" data-action="help" aria-expanded="false" aria-controls="echo-help">Help</button>
          <div class="move-controls" role="group" aria-label="Move farewell panel">
            <button class="move-btn" data-dir="left" aria-label="Move left">←</button><button class="move-btn" data-dir="up" aria-label="Move up">↑</button>
            <button class="move-btn" data-dir="down" aria-label="Move down">↓</button><button class="move-btn" data-dir="right" aria-label="Move right">→</button>
          </div>
        </div>
        <div id="echo-help" class="echo-help" hidden>
          <p>Drag the UNINSTALL header over the whole private self-view. Keep every part of the public stage visible. Focus the panel and use arrow keys (Shift for smaller moves), or use the direction buttons.</p>
          <button class="control-btn" data-action="align">Align panel over private view</button>
        </div>
      </div>
      <p class="echo-status" role="status" aria-live="polite"></p>`;
    this.prop = container.querySelector<HTMLElement>('.farewell-prop')!;
    this.board = container.querySelector<HTMLElement>('.echo-board-wrap')!;
    this.status = container.querySelector<HTMLElement>('.echo-status')!;
    this.caption = container.querySelector<HTMLElement>('.echo-caption')!;
    this.help = container.querySelector<HTMLElement>('.echo-help')!;
    const options = { signal: this.events.signal };
    this.prop.querySelector<HTMLElement>('.prop-header')!.addEventListener('pointerdown', this.dragStart, options);
    document.addEventListener('pointermove', this.dragMove, options);
    document.addEventListener('pointerup', this.dragEnd, options);
    document.addEventListener('pointercancel', this.dragEnd, options);
    this.prop.addEventListener('keydown', event => {
      const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
      if (!direction || this.scene.state !== 'editing') return;
      event.preventDefault();
      this.move(direction, event.shiftKey);
    }, options);
    container.addEventListener('click', event => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('button');
      if (!target || target.matches(':disabled')) return;
      if (target.dataset.dir) this.move(target.dataset.dir, event.shiftKey);
      switch (target.dataset.action) {
        case 'rehearse': this.rehearse(); break;
        case 'edit': this.edit(); break;
        case 'leave': this.leave(); break;
        case 'resume': this.resume(); break;
        case 'help':
          this.help.hidden = !this.help.hidden;
          target.setAttribute('aria-expanded', String(!this.help.hidden));
          break;
        case 'align':
          this.scene = setPropPosition(this.scene, { x: view.x - 10, y: view.y - 10 }, SCENE_CONFIG);
          this.render();
          break;
      }
    }, options);
    container.querySelector('select')!.addEventListener('change', event => {
      this.scene = setHostReaction(this.scene, (event.target as HTMLSelectElement).value as HostReaction);
      this.render();
    }, options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, options);
    this.motion.addEventListener('change', () => {
      if (this.scene.state === 'performing') this.schedule();
    }, options);
    this.unsubscribe = session.subscribe(() => {
      this.cancelTimer();
      this.dragEnd();
      if (this.scene.state !== 'left') this.scene = returnToEditing(this.scene);
      this.phase = 'idle';
      this.processNotice = true;
      this.render();
    });
    this.render();
  }

  private dragStart = (event: PointerEvent): void => {
    if (this.scene.state !== 'editing' || event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    this.prop.focus({ preventScroll: true });
    const bounds = this.prop.getBoundingClientRect();
    this.drag = { pointerId: event.pointerId, x: event.clientX - bounds.left, y: event.clientY - bounds.top, target };
  };

  private dragMove = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId || this.scene.state !== 'editing') return;
    const bounds = this.board.getBoundingClientRect();
    this.scene = setPropPosition(this.scene, {
      x: (event.clientX - bounds.left - this.drag.x) * 640 / bounds.width,
      y: (event.clientY - bounds.top - this.drag.y) * 410 / bounds.height,
    }, SCENE_CONFIG);
    this.render();
  };

  private dragEnd = (event?: PointerEvent): void => {
    if (!this.drag) return;
    if (event && event.pointerId !== this.drag.pointerId) return;
    if (this.drag.target.hasPointerCapture(this.drag.pointerId)) this.drag.target.releasePointerCapture(this.drag.pointerId);
    this.drag = undefined;
  };

  private move(direction: string, fine: boolean): void {
    const step = fine ? 2 : 10;
    const delta = { left: [-step, 0], right: [step, 0], up: [0, -step], down: [0, step] }[direction];
    if (!delta) return;
    this.scene = moveProp(this.scene, { dx: delta[0]!, dy: delta[1]! }, SCENE_CONFIG);
    this.render();
  }

  private rehearse(): void {
    if (this.scene.state !== 'editing' && this.scene.state !== 'complete') return;
    this.dragEnd();
    if (!assessStage(validateCoverage(this.scene, SCENE_CONFIG), this.session.snapshot().frame).ready) {
      this.scene = failPerformance(this.scene);
      this.render();
      return;
    }
    this.cancelTimer();
    this.processNotice = false;
    // A repeated take starts from the same empty stage, rather than reversing the last pose.
    if (this.scene.state === 'complete') {
      this.scene = returnToEditing(this.scene);
      this.phase = 'idle';
      this.render();
      getComputedStyle(this.container.querySelector('#echo')!).opacity;
    }
    this.scene = startPerformance(this.scene);
    this.phase = 'appearance';
    this.render();
    this.schedule();
  }

  private schedule(): void {
    this.cancelTimer();
    if (this.phase === 'idle' || this.scene.state !== 'performing') return;
    const generation = this.scene.runGeneration;
    this.timer = window.setTimeout(() => {
      if (this.disposed || generation !== this.scene.runGeneration || this.scene.state !== 'performing') return;
      if (this.phase === 'appearance') this.phase = 'host-reaction';
      else if (this.phase === 'host-reaction') this.phase = 'echo-response';
      else this.scene = completePerformance(this.scene);
      this.render();
      if (this.scene.state === 'performing') this.schedule();
    }, this.motion.matches ? 50 : durations[this.phase]);
  }

  public pause(): void {
    this.dragEnd();
    if (this.scene.state !== 'performing') return;
    this.cancelTimer();
    this.scene = pausePerformance(this.scene);
    this.render();
  }

  private resume(): void {
    if (this.scene.state !== 'paused' || document.hidden) return;
    this.scene = resumePerformance(this.scene);
    this.render();
    this.schedule();
  }

  private edit(): void {
    this.processNotice = false;
    this.cancelTimer();
    this.scene = returnToEditing(this.scene);
    this.phase = 'idle';
    this.render();
  }

  public leave(): void {
    this.cancelTimer();
    this.dragEnd();
    this.scene = { ...returnToEditing(this.scene), state: 'left' };
    this.phase = 'idle';
    this.render();
  }

  private cancelTimer(): void { window.clearTimeout(this.timer); this.timer = undefined; }

  private render(): void {
    const { state, hostReaction, propPosition } = this.scene;
    const coverage = validateCoverage(this.scene, SCENE_CONFIG);
    const processes = this.session.snapshot();
    const readiness = assessStage(coverage, processes.frame);
    const editing = state === 'editing';
    this.container.dataset.state = state;
    this.container.dataset.phase = this.phase;
    this.container.dataset.reaction = hostReaction;
    this.container.dataset.frame = processes.frame;
    this.container.querySelector('.echo-transport-state')!.textContent = state === 'performing' ? '● Playing example' : state === 'paused' ? 'Ⅱ Paused' : state === 'complete' ? '■ Take complete' : state === 'left' ? '■ Entrance left' : state === 'failed' ? '■ Needs repair' : '■ Edit mode';
    this.container.querySelector('.echo-feed-state')!.textContent = `Private input: ${processes.mirrorPid === null ? 'no process' : `mirror.watch [${processes.mirrorPid}]`} / ${processes.frame}${processes.frame === 'afterimage' ? ' — last frame retained' : ''}`;
    this.container.querySelector('[data-private-note]')!.textContent = processes.frame === 'released' ? 'Display released.' : processes.frame === 'afterimage' ? 'Last frame remains.' : 'Only ECHO sees this.';
    this.prop.style.left = `${propPosition.x / 640 * 100}%`;
    this.prop.style.top = `${propPosition.y / 410 * 100}%`;
    this.prop.style.width = `${SCENE_CONFIG.propSize.width / 640 * 100}%`;
    this.prop.style.height = `${SCENE_CONFIG.propSize.height / 410 * 100}%`;
    this.prop.classList.toggle('coverage-ready', readiness.ready);
    this.prop.classList.toggle('coverage-invalid', !readiness.ready);
    this.prop.setAttribute('aria-disabled', String(!editing));
    this.container.querySelector('[data-private]')!.textContent = processes.frame === 'released' ? '✓ Private feed released' : coverage.privateFullyCovered ? '✓ Private view covered' : '○ Private view exposed';
    this.container.querySelector('[data-public]')!.textContent = coverage.publicOverlap ? '× Stage blocked' : '✓ Stage clear';
    const problem = [!readiness.privateSafe ? processes.frame === 'afterimage' ? 'A private afterimage is still exposed.' : 'The private self-view is still exposed.' : '', coverage.publicOverlap ? 'The panel blocks the public stage.' : ''].filter(Boolean).join(' ');
    const statuses = {
      editing: `${this.processNotice ? 'Console changed the set. ' : ''}${readiness.ready ? 'Set ready. Try the example entrance.' : 'Cover the private monitor, or inspect its process in TERMINAL.'}`,
      performing: this.phase === 'appearance' ? 'Example entrance: ECHO appears.' : this.phase === 'host-reaction' ? 'The host reacts.' : 'ECHO answers.',
      paused: 'Entrance paused. Resume explicitly, or edit the set.',
      complete: 'Example entrance complete. Choose Edit set to try another host reaction.',
      failed: `${problem} Choose Edit set to adjust it.`,
      left: 'You left the entrance. Nothing else will play. Choose Edit set to return.',
    };
    if (this.status.textContent !== statuses[state]) this.status.textContent = statuses[state];
    this.caption.textContent = state === 'left' ? 'The curtain can wait.' : state === 'failed' ? '“I can still see myself. Please, not yet.”' :
      state === 'complete' || this.phase === 'echo-response' ? hostReaction === 'collapse' ? '“That worked? Oh. That worked!”' : '“Wait. You were supposed to be scared of me.”' :
      this.phase === 'host-reaction' ? hostReaction === 'collapse' ? 'The host folds under pressure.' : 'The host has other plans.' :
      this.phase === 'appearance' ? 'For one brave second, ECHO takes the stage.' : readiness.ready ? '“It’s quiet now. I think I can do this.”' : 'The host is waiting. ECHO isn’t ready.';
    const responding = this.phase === 'echo-response';
    this.container.querySelector('.public-footage .ink-mouth')!.setAttribute('d', responding
      ? hostReaction === 'collapse' ? 'M278 138q8 15 18 0' : 'M281 141a6 9 0 1 0 12 0a6 9 0 1 0-12 0'
      : 'M278 145q8-16 18 0');
    for (const button of this.container.querySelectorAll<HTMLButtonElement>('button')) {
      const action = button.dataset.action;
      button.disabled = button.hasAttribute('data-dir') || action === 'align' ? !editing : action === 'rehearse' ? !['editing', 'complete'].includes(state) : action === 'edit' ? editing : action === 'leave' ? state === 'left' : false;
      if (action === 'resume') button.hidden = state !== 'paused';
    }
    this.container.querySelector<HTMLSelectElement>('select')!.disabled = !editing;
  }

  public dispose(): void {
    if (this.disposed) return;
    this.leave();
    this.disposed = true;
    this.events.abort();
    this.unsubscribe();
  }
}

export function initEchoScene(container: HTMLElement, session: ProcessSession): EchoController { return new EchoController(container, session); }
