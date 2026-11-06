import './workshop.css';

export type Locale = 'en' | 'es';
export type EditKind = 'lamp' | 'cutout' | 'frame';
export type Point = { x: number; y: number };
export type WorkshopAction =
  | { type: 'start' | 'continue' | 'trial' | 'pause' | 'resume' | 'stop' | 'undo' | 'home' | 'review' | 'restart' | 'hint' | 'help' | 'close-help' }
  | { type: 'preference'; key: 'language' | 'sound' | 'reducedMotion'; value: Locale | boolean }
  | { type: 'begin'; kind: EditKind }
  | { type: 'preview'; lampX?: number; angle?: number; frameX?: number; frameY?: number }
  | { type: 'commit' | 'cancel' };

export interface WorkshopModel {
  phase: 'cover' | 'editing' | 'tentative' | 'trial' | 'paused' | 'failed' | 'arrival' | 'final';
  locale: Locale;
  sound: boolean;
  reducedMotion: boolean;
  hasSave: boolean;
  canUndo: boolean;
  editingKind?: EditKind;
  lampX: number;
  angle: number;
  lampMin: number;
  lampMax: number;
  shadow: readonly Point[];
  cutout: readonly Point[];
  frame: { centerX: number; bottomY: number; held: boolean; leftContact: number; rightContact: number };
  figure: Point;
  feedback: string;
  failurePoint?: Point;
  geometry: { frameWidth: number; frameHeight: number; frameBorder: number; padWidth: number; minContact: number; figureWidth: number; figureHeight: number };
}

const copy = {
  en: {
    title: 'The Wrong Window', subtitle: 'A paper-theatre mystery', language: 'Language', soundOff: 'Sound off', soundOn: 'Sound on', motion: 'Reduced motion',
    quote: '“There’s a way out. The path is missing.”', note: 'A note from Vera', enter: 'Enter the workshop', continue: 'Continue', newGame: 'Begin again',
    objective: 'Help the little figure reach the high gallery.', introduction: 'A lamp. A piece of paper. Something that looks like a way through.',
    lamp: 'Move the light', cutout: 'Turn the paper', lampControl: 'Lamp carriage', cutoutControl: 'Paper pivot', frameControl: 'Movable frame',
    frame: 'The frame', place: 'Place frame', confirm: 'Set it down', cancel: 'Cancel', home: 'Return to the wall',
    frameHint: 'Drag the frame, or choose Place frame and a spot on the stage.', placingHint: 'Choose a place. Enter sets it down; Escape cancels.',
    trial: 'Try the route', pause: 'Pause', resume: 'Continue walking', stop: 'Back to the table', undo: 'Undo', help: 'How to play', hint: 'A small hint',
    floor: 'The workshop', gallery: 'The gallery', status: 'Workshop observations', stage: 'Paper stage with a lamp’s shadow, a frame and the figure’s destination',
    finalTitle: 'The way was yours to make.', finalText: 'The shadow stays. The frame comes with you.', review: 'Look at your construction', restart: 'A new performance',
    helpTitle: 'A few things about this workshop', helpText: 'Black edges support the figure from above. Try moving the light and turning the paper, then watch what happens to the shadow. The gallery stays where it is.',
    helpKeys: 'Tab moves between controls. Arrow keys move the selected mechanism. Home and End take the lamp or paper to their stops. For the frame, Enter confirms and Escape cancels.',
    close: 'Back to the workshop', trialStatus: 'The figure is trying your construction.', pausedStatus: 'The performance is paused.',
    frameKeys: 'Arrow keys move the frame; Enter sets it down; Escape cancels.', rest: 'Resting', raised: 'Raised',
  },
  es: {
    title: 'La ventana equivocada', subtitle: 'Un misterio de teatro de papel', language: 'Idioma', soundOff: 'Sonido apagado', soundOn: 'Sonido encendido', motion: 'Movimiento reducido',
    quote: '«Hay salida. Falta camino».', note: 'Una nota de Vera', enter: 'Entrar al taller', continue: 'Continuar', newGame: 'Empezar de nuevo',
    objective: 'Ayuda a la pequeña figura a llegar a la galería alta.', introduction: 'Una lámpara. Un recorte. Algo que parece una salida.',
    lamp: 'Mueve la luz', cutout: 'Gira el recorte', lampControl: 'Carro de la lámpara', cutoutControl: 'Pivote del recorte', frameControl: 'Marco móvil',
    frame: 'El marco', place: 'Colocar el marco', confirm: 'Dejar aquí', cancel: 'Cancelar', home: 'Volver a la pared',
    frameHint: 'Arrastra el marco o elige Colocar el marco y un lugar del escenario.', placingHint: 'Elige un lugar. Enter lo confirma; Escape cancela.',
    trial: 'Probar el recorrido', pause: 'Pausar', resume: 'Seguir caminando', stop: 'Volver a la mesa', undo: 'Deshacer', help: 'Cómo jugar', hint: 'Una pequeña pista',
    floor: 'El taller', gallery: 'La galería', status: 'Observaciones del taller', stage: 'Escenario de papel con una sombra, un marco y el destino de la figura',
    finalTitle: 'El camino lo hiciste tú.', finalText: 'La sombra se queda. El marco viene contigo.', review: 'Revisar tu construcción', restart: 'Una nueva función',
    helpTitle: 'Unas cosas sobre este taller', helpText: 'Los trazos negros sostienen a la figura desde arriba. Prueba a mover la luz y girar el recorte; observa qué cambia en la sombra. La galería permanece en su sitio.',
    helpKeys: 'Tab cambia de control. Las flechas mueven el mecanismo seleccionado. Inicio y Fin llevan la luz o el recorte a sus topes. En el marco, Enter confirma y Escape cancela.',
    close: 'Volver al taller', trialStatus: 'La figura está probando tu construcción.', pausedStatus: 'La función está en pausa.',
    frameKeys: 'Las flechas mueven el marco; Enter confirma; Escape cancela.', rest: 'En reposo', raised: 'Alzado',
  },
} as const;

type CopyKey = keyof typeof copy.en;
type Drag = { kind: EditKind; pointer: number; element: Element; offset: Point };

export class WorkshopView {
  private model: WorkshopModel | null = null;
  private drag: Drag | null = null;
  private placing = false;
  private frameKeyboardPoint: Point | null = null;
  private readonly stage: SVGSVGElement;
  private readonly frameElement: SVGGElement;
  private readonly helpDialog: HTMLDialogElement;

  constructor(private readonly root: HTMLElement, private readonly dispatch: (action: WorkshopAction) => void) {
    root.innerHTML = `
      <div class="workshop-shell">
        <header class="masthead">
          <div class="brand"><span class="brand-window" aria-hidden="true"></span><div><h1 data-copy="title"></h1><p data-copy="subtitle"></p></div></div>
          <div class="preferences" aria-label="Preferences">
            <div class="languages" role="group" data-language-group><button type="button" data-locale="es" lang="es">ES</button><button type="button" data-locale="en" lang="en">EN</button></div>
            <button type="button" class="quiet sound-button" data-action="sound"></button>
            <label class="motion-control"><input type="checkbox" data-motion><span data-copy="motion"></span></label>
          </div>
        </header>
        <main>
          <div class="stage-heading"><p data-copy="objective"></p><button type="button" class="quiet" data-action="help" data-copy="help"></button></div>
          <section class="theatre">
            <div class="proscenium" aria-hidden="true"><span></span><i></i><span></span></div>
            <svg class="stage" data-stage viewBox="-280 -100 1810 920" role="group">
              <defs>
                <filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".065"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
                <radialGradient id="lamp-wash"><stop offset="0" stop-color="#fff1c6" stop-opacity=".8"/><stop offset="1" stop-color="#e6dabf" stop-opacity="0"/></radialGradient>
                <pattern id="paper-lines" width="13" height="13" patternUnits="userSpaceOnUse"><path d="M0 12H13" stroke="#594936" stroke-opacity=".045" stroke-width=".7"/></pattern>
              </defs>
              <rect x="-280" y="-100" width="1810" height="920" fill="#e6dabf"/>
              <rect x="-280" y="-100" width="1810" height="920" fill="url(#paper-lines)"/>
              <ellipse cx="750" cy="360" rx="830" ry="570" fill="url(#lamp-wash)" data-light-wash/>
              <g transform="translate(0 660) scale(1 -1)" class="world">
                <path d="M-246 0V270L-185 282L-90 268L-5 281L129 270L211 279V0Z" fill="#d2c09e" opacity=".45" data-paper-wall/>
                <path d="M1280 160V311Q1340 380 1400 311V160" fill="#c7a46c" opacity=".32"/>
                <path d="M1286 160V307Q1340 367 1394 307V160" fill="#a88e60" opacity=".24"/>
                <path d="M1340 160V334M1284 260H1396" stroke="#67513a" stroke-width="5" opacity=".35"/>
                <polygon data-shadow class="shadow" points=""/>
                <path d="M-250 0H220V-100H-250Z" fill="#8e7555"/>
                <path d="M-250 0H220" class="fixed-edge"/>
                <path d="M1120 160H1500V-100L1460 -90L1395 -98L1305 -82L1200 -94L1120 -83Z" fill="#c4b391"/>
                <path d="M1120 160H1500" class="fixed-edge"/>
                <path d="M1150 125H1470M1170 92H1450M1152 62H1460M1160 30H1480" stroke="#a48e6a" stroke-width="2" opacity=".4"/>
                <g data-frame class="frame-piece" tabindex="0" role="button" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Enter Escape">
                  <rect data-frame-hit class="frame-hit" fill="transparent"/>
                  <path data-frame-shape class="frame-ink" fill-rule="evenodd"/>
                  <path data-frame-left-pad class="frame-pad"/>
                  <path data-frame-right-pad class="frame-pad"/>
                  <path data-frame-left-contact class="contact-mark"/>
                  <path data-frame-right-contact class="contact-mark"/>
                  <rect data-frame-focus class="frame-focus" fill="none"/>
                </g>
                <g data-figure class="figure" aria-hidden="true">
                  <path d="M-10 30L-14 0H-18M10 30L14 0H18" fill="none" stroke="#33262b" stroke-width="4" stroke-linecap="round"/>
                  <path d="M-12 65Q-18 53 -18 41M12 65Q18 56 18 48" fill="none" stroke="#33262b" stroke-width="4" stroke-linecap="round"/>
                  <path d="M-14 72L14 72L18 29Q0 20 -18 29Z" fill="#eeeadc" stroke="#33262b" stroke-width="3"/>
                  <circle cx="0" cy="85" r="13" fill="#eeeadc" stroke="#33262b" stroke-width="3"/>
                  <circle cx="-4" cy="87" r="1.7" fill="#33262b"/><circle cx="4" cy="87" r="1.7" fill="#33262b"/>
                  <path d="M-3 79Q0 77 3 79" fill="none" stroke="#594247" stroke-width="1.5"/>
                </g>
                <g data-failure-marker hidden aria-hidden="true"><circle r="16" fill="#e6dabf" stroke="#8d493a" stroke-width="3"/><path d="M-5 -5L5 5M-5 5L5 -5" stroke="#8d493a" stroke-width="3"/></g>
              </g>
              <text x="-190" y="726" class="stage-label" data-copy="floor"></text>
              <text x="1340" y="292" text-anchor="middle" class="stage-label" data-copy="gallery"></text>
            </svg>
            <div class="cover" data-cover>
              <div class="vera-note"><span data-copy="note"></span><h2 data-copy="quote"></h2><p data-copy="introduction"></p>
                <div class="cover-actions"><button type="button" class="primary" data-action="start" data-copy="enter"></button><button type="button" class="secondary" data-action="continue" data-copy="continue" hidden></button></div>
              </div>
            </div>
            <div class="ending" data-ending hidden><div><h2 data-copy="finalTitle"></h2><p data-copy="finalText"></p><div class="cover-actions"><button type="button" class="primary" data-action="review" data-copy="review"></button><button type="button" class="secondary" data-action="restart" data-copy="restart"></button></div></div></div>
          </section>
          <section class="worktable" data-worktable>
            <div class="mechanism lamp-mechanism"><h2 data-copy="lamp"></h2>
              <svg data-lamp-svg viewBox="0 0 340 160" aria-hidden="false">
                <path d="M31 131H309M31 138H309" stroke="#a18b6f" stroke-width="2"/><path d="M35 128V143M305 128V143" stroke="#d9af59" stroke-width="3"/>
                <path data-lamp-rail d="M35 134H305" fill="none" stroke="transparent" stroke-width="30"/>
                <g data-lamp-cart tabindex="0" role="slider" aria-valuemin="500" aria-valuemax="740" aria-keyshortcuts="ArrowLeft ArrowRight Home End">
                  <path d="M-22 0H22V14H-22Z" fill="#9c7c49" stroke="#d9af59" stroke-width="2"/><circle cx="-13" cy="17" r="5" fill="#211b26" stroke="#b69c74"/><circle cx="13" cy="17" r="5" fill="#211b26" stroke="#b69c74"/>
                  <path d="M0 0V-48M-9 -47H9" stroke="#c4a16a" stroke-width="5" stroke-linecap="round"/><path d="M-20 -52L-13 -82H13L20 -52Z" fill="#d9af59" stroke="#efd09a" stroke-width="2"/>
                  <ellipse cx="0" cy="-52" rx="20" ry="5" fill="#f7dca0"/><path d="M-16 -48L-47 -11H47L16 -48Z" fill="#d9af59" opacity=".08"/><rect x="-29" y="-90" width="58" height="115" rx="8" class="mechanism-focus" fill="transparent"/>
                </g>
              </svg>
            </div>
            <div class="mechanism cutout-mechanism"><h2 data-copy="cutout"></h2>
              <svg data-cutout-svg viewBox="0 0 245 160">
                <path d="M190 124A100 100 0 0 0 90 24" fill="none" stroke="#a18b6f" stroke-width="2"/>
                <path data-cutout-arc d="M190 124A100 100 0 0 0 90 24" fill="none" stroke="transparent" stroke-width="24"/>
                <path d="M194 115V133M81 20H99" stroke="#d9af59" stroke-width="3"/>
                <g data-cutout-paper><polygon data-paper-polygon fill="#e6dabf" stroke="#c2ae87" stroke-width="1.5"/><path d="M0 0L85 0" stroke="#7e6a56" stroke-width="2"/></g>
                <circle cx="90" cy="124" r="7" fill="#b99b67" stroke="#edd29b" stroke-width="2"/>
                <g data-cutout-handle tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="90" aria-keyshortcuts="ArrowLeft ArrowRight Home End"><circle r="10" fill="#d9af59" stroke="#f3d797" stroke-width="2"/><circle r="21" class="mechanism-focus" fill="transparent"/></g>
              </svg>
            </div>
            <div class="frame-controls"><h2 data-copy="frame"></h2><p data-frame-hint></p><div class="frame-actions"><button type="button" class="secondary" data-action="place" data-copy="place"></button><button type="button" class="primary" data-action="confirm" data-copy="confirm" hidden></button><button type="button" class="quiet" data-action="cancel" data-copy="cancel" hidden></button><button type="button" class="quiet" data-action="home" data-copy="home"></button></div></div>
          </section>
          <footer class="performance-controls"><div class="observation" role="status" aria-live="polite" aria-atomic="true" data-feedback></div><div class="trial-actions"><button type="button" class="quiet" data-action="undo" data-copy="undo"></button><button type="button" class="quiet" data-action="hint" data-copy="hint"></button><button type="button" class="primary" data-action="trial" data-copy="trial"></button><button type="button" class="primary" data-action="pause" data-copy="pause" hidden></button><button type="button" class="primary" data-action="resume" data-copy="resume" hidden></button><button type="button" class="secondary" data-action="stop" data-copy="stop" hidden></button></div></footer>
        </main>
        <dialog class="help-dialog" data-help><h2 data-copy="helpTitle"></h2><p data-copy="helpText"></p><p data-copy="helpKeys"></p><button type="button" class="primary" data-action="close-help" data-copy="close"></button></dialog>
      </div>`;
    this.stage = this.get<SVGSVGElement>('[data-stage]');
    this.frameElement = this.get<SVGGElement>('[data-frame]');
    this.helpDialog = this.get<HTMLDialogElement>('[data-help]');
    this.bindButtons();
    this.bindMechanisms();
  }

  private get<T extends Element = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing workshop element: ${selector}`);
    return element;
  }

  private emit(action: WorkshopAction): void { this.dispatch(action); }
  private setText(element: Element, value: string): void { if (element.textContent !== value) element.textContent = value; }
  private canEdit(): boolean { return this.model?.phase === 'editing' || this.model?.phase === 'tentative' || this.model?.phase === 'failed'; }

  private bindButtons(): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-action]')) {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'sound') { this.emit({ type: 'preference', key: 'sound', value: !this.model?.sound }); return; }
        if (action === 'place') { this.placing = true; this.frameKeyboardPoint = null; this.emit({ type: 'begin', kind: 'frame' }); this.frameElement.focus(); return; }
        if (action === 'confirm' || action === 'cancel') { this.placing = false; this.frameKeyboardPoint = null; this.emit({ type: action === 'confirm' ? 'commit' : 'cancel' }); return; }
        if (action === 'close-help') { this.helpDialog.close(); this.emit({ type: 'close-help' }); return; }
        if (action === 'help') { this.emit({ type: 'help' }); this.helpDialog.showModal(); return; }
        this.placing = false;
        this.emit({ type: action as 'start' | 'continue' | 'trial' | 'pause' | 'resume' | 'stop' | 'undo' | 'home' | 'review' | 'restart' | 'hint' });
      });
    }
    this.helpDialog.addEventListener('cancel', () => this.emit({ type: 'close-help' }));
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-locale]')) {
      button.addEventListener('click', () => this.emit({ type: 'preference', key: 'language', value: button.dataset.locale as Locale }));
    }
    this.get<HTMLInputElement>('[data-motion]').addEventListener('change', (event) => this.emit({ type: 'preference', key: 'reducedMotion', value: (event.target as HTMLInputElement).checked }));
    window.addEventListener('blur', () => { this.drag = null; this.placing = false; this.emit({ type: 'cancel' }); });
  }

  private svgPoint(svg: SVGSVGElement, event: PointerEvent): Point {
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: point.x, y: point.y };
  }

  private stagePoint(event: PointerEvent): Point {
    const point = this.svgPoint(this.stage, event);
    return { x: point.x, y: 660 - point.y };
  }

  private preview(kind: EditKind, event: PointerEvent, offset: Point = { x: 0, y: 0 }): void {
    if (!this.model || !this.canEdit()) return;
    if (kind === 'lamp') {
      const point = this.svgPoint(this.get<SVGSVGElement>('[data-lamp-svg]'), event);
      const ratio = Math.max(0, Math.min(1, (point.x - 35) / 270));
      this.emit({ type: 'preview', lampX: this.model.lampMin + ratio * (this.model.lampMax - this.model.lampMin) });
    } else if (kind === 'cutout') {
      const point = this.svgPoint(this.get<SVGSVGElement>('[data-cutout-svg]'), event);
      const angle = Math.max(0, Math.min(90, Math.atan2(124 - point.y, point.x - 90) * 180 / Math.PI));
      this.emit({ type: 'preview', angle });
    } else {
      const point = this.stagePoint(event);
      this.frameKeyboardPoint = { x: point.x - offset.x, y: point.y - offset.y };
      this.emit({ type: 'preview', frameX: this.frameKeyboardPoint.x, frameY: this.frameKeyboardPoint.y });
    }
  }

  private bindPointer(element: Element, kind: EditKind): void {
    element.addEventListener('pointerdown', ((event: PointerEvent) => {
      if (!this.model || !this.canEdit()) return;
      event.preventDefault(); event.stopPropagation();
      if (kind === 'frame' && this.placing) {
        this.preview('frame', event, { x: 0, y: this.model.geometry.frameHeight / 2 });
        this.placing = false; this.emit({ type: 'commit' }); return;
      }
      const point = kind === 'frame' ? this.stagePoint(event) : { x: 0, y: 0 };
      const offset = kind === 'frame' ? { x: point.x - this.model.frame.centerX, y: point.y - this.model.frame.bottomY } : { x: 0, y: 0 };
      this.emit({ type: 'begin', kind });
      this.drag = { kind, pointer: event.pointerId, element, offset };
      element.setPointerCapture(event.pointerId);
      if (element instanceof SVGElement) element.focus();
      this.preview(kind, event, offset);
    }) as EventListener);
    element.addEventListener('pointermove', ((event: PointerEvent) => {
      if (this.drag?.pointer === event.pointerId && this.drag.element === element) this.preview(kind, event, this.drag.offset);
    }) as EventListener);
    element.addEventListener('pointerup', ((event: PointerEvent) => {
      if (this.drag?.pointer !== event.pointerId || this.drag.element !== element) return;
      this.preview(kind, event, this.drag.offset);
      this.drag = null;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      this.emit({ type: 'commit' });
    }) as EventListener);
    element.addEventListener('pointercancel', () => { this.drag = null; this.placing = false; this.emit({ type: 'cancel' }); });
  }

  private bindMechanisms(): void {
    this.bindPointer(this.get('[data-lamp-cart]'), 'lamp');
    this.bindPointer(this.get('[data-lamp-rail]'), 'lamp');
    this.bindPointer(this.get('[data-cutout-handle]'), 'cutout');
    this.bindPointer(this.get('[data-cutout-arc]'), 'cutout');
    this.bindPointer(this.frameElement, 'frame');
    this.stage.addEventListener('pointermove', (event) => {
      if (this.placing && !this.drag && this.model) this.preview('frame', event, { x: 0, y: this.model.geometry.frameHeight / 2 });
    });
    this.stage.addEventListener('pointerdown', (event) => {
      if (this.placing && this.model) {
        event.preventDefault();
        this.preview('frame', event, { x: 0, y: this.model.geometry.frameHeight / 2 });
        this.placing = false; this.emit({ type: 'commit' });
      }
    });
    for (const [selector, kind] of [['[data-lamp-cart]', 'lamp'], ['[data-cutout-handle]', 'cutout'], ['[data-frame]', 'frame']] as const) {
      this.get(selector).addEventListener('keydown', ((event: KeyboardEvent) => {
        if (!this.model || !this.canEdit()) return;
        const delta = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : 0;
        if (event.key === 'Escape') { event.preventDefault(); this.drag = null; this.placing = false; this.frameKeyboardPoint = null; this.emit({ type: 'cancel' }); return; }
        if (kind === 'frame') {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (this.model.phase === 'tentative' && this.model.editingKind === 'frame') { this.placing = false; this.frameKeyboardPoint = null; this.emit({ type: 'commit' }); }
            else { this.placing = false; this.frameKeyboardPoint = { x: this.model.frame.centerX, y: this.model.frame.bottomY }; this.emit({ type: 'begin', kind: 'frame' }); }
          } else if (delta) {
            event.preventDefault();
            if (this.model.phase !== 'tentative' || this.model.editingKind !== 'frame') this.emit({ type: 'begin', kind: 'frame' });
            this.frameKeyboardPoint ??= { x: this.model.frame.centerX, y: this.model.frame.bottomY };
            const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
            this.frameKeyboardPoint = { x: this.frameKeyboardPoint.x + (horizontal ? delta * 10 : 0), y: this.frameKeyboardPoint.y + (horizontal ? 0 : delta * 10) };
            this.emit({ type: 'preview', frameX: this.frameKeyboardPoint.x, frameY: this.frameKeyboardPoint.y });
          }
          return;
        }
        if (!delta && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        this.emit({ type: 'begin', kind });
        if (kind === 'lamp') this.emit({ type: 'preview', lampX: event.key === 'Home' ? this.model.lampMin : event.key === 'End' ? this.model.lampMax : Math.max(this.model.lampMin, Math.min(this.model.lampMax, this.model.lampX + delta * 10)) });
        else this.emit({ type: 'preview', angle: event.key === 'Home' ? 0 : event.key === 'End' ? 90 : Math.max(0, Math.min(90, this.model.angle + delta * 5)) });
        this.emit({ type: 'commit' });
      }) as EventListener);
    }
  }

  update(model: WorkshopModel): void {
    this.model = model;
    const labels = copy[model.locale];
    document.documentElement.lang = model.locale;
    document.title = labels.title;
    this.root.classList.toggle('reduce-motion', model.reducedMotion);
    this.root.dataset.phase = model.phase;
    for (const element of this.root.querySelectorAll<HTMLElement>('[data-copy]')) this.setText(element, labels[element.dataset.copy as CopyKey]);
    this.get('[data-language-group]').setAttribute('aria-label', labels.language);
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-locale]')) button.setAttribute('aria-pressed', String(button.dataset.locale === model.locale));
    this.setText(this.get('[data-action="sound"]'), model.sound ? labels.soundOn : labels.soundOff);
    this.get<HTMLButtonElement>('[data-action="sound"]').setAttribute('aria-pressed', String(model.sound));
    this.get<HTMLInputElement>('[data-motion]').checked = model.reducedMotion;
    this.stage.setAttribute('aria-label', labels.stage);
    this.get('[data-shadow]').setAttribute('points', model.shadow.map(point => `${point.x},${point.y}`).join(' '));
    this.get('[data-light-wash]').setAttribute('cx', String(900 - (model.lampX - model.lampMin)));
    const w = model.geometry.frameWidth, h = model.geometry.frameHeight, b = model.geometry.frameBorder, pad = model.geometry.padWidth;
    const frameX = model.frame.held ? model.figure.x - w - 18 : model.frame.centerX - w / 2;
    const frameY = model.frame.held ? model.figure.y + 52 : model.frame.bottomY;
    this.frameElement.setAttribute('transform', `translate(${frameX} ${frameY})`);
    this.frameElement.setAttribute('aria-label', `${labels.frameControl}. ${labels.frameKeys}`);
    this.frameElement.classList.toggle('is-tentative', model.phase === 'tentative');
    this.get('[data-frame-shape]').setAttribute('d', `M0 0H${w}V${h}H0ZM${b} ${b}V${h - b}H${w - b}V${b}Z`);
    for (const selector of ['[data-frame-hit]', '[data-frame-focus]']) {
      const rect = this.get(selector); rect.setAttribute('x', '-8'); rect.setAttribute('y', '-8'); rect.setAttribute('width', String(w + 16)); rect.setAttribute('height', String(h + 16));
    }
    this.get('[data-frame-left-pad]').setAttribute('d', `M0 0H${pad}`);
    this.get('[data-frame-right-pad]').setAttribute('d', `M${w - pad} 0H${w}`);
    this.get('[data-frame-left-contact]').setAttribute('d', `M0 -7H${Math.min(pad, Math.max(0, model.frame.leftContact))}`);
    this.get('[data-frame-right-contact]').setAttribute('d', `M${w - Math.min(pad, Math.max(0, model.frame.rightContact))} -7H${w}`);
    this.get('[data-frame-left-contact]').classList.toggle('unsupported', model.frame.leftContact < model.geometry.minContact);
    this.get('[data-frame-right-contact]').classList.toggle('unsupported', model.frame.rightContact < model.geometry.minContact);
    this.get<SVGElement>('[data-frame-left-contact]').style.visibility = model.frame.held ? 'hidden' : '';
    this.get<SVGElement>('[data-frame-right-contact]').style.visibility = model.frame.held ? 'hidden' : '';
    this.get('[data-figure]').setAttribute('transform', `translate(${model.figure.x} ${model.figure.y}) scale(${model.geometry.figureWidth / 40} ${model.geometry.figureHeight / 100})`);
    const marker = this.get<SVGGElement>('[data-failure-marker]');
    marker.style.display = model.failurePoint ? '' : 'none';
    if (model.failurePoint) { marker.removeAttribute('hidden'); marker.setAttribute('transform', `translate(${model.failurePoint.x} ${model.failurePoint.y + 24})`); }
    const lamp = this.get<SVGGElement>('[data-lamp-cart]');
    lamp.setAttribute('transform', `translate(${35 + (model.lampX - model.lampMin) / (model.lampMax - model.lampMin) * 270} 117)`);
    lamp.setAttribute('aria-label', labels.lampControl); lamp.setAttribute('aria-valuenow', String(model.lampX)); lamp.setAttribute('aria-valuemin', String(model.lampMin)); lamp.setAttribute('aria-valuemax', String(model.lampMax));
    this.get('[data-cutout-paper]').setAttribute('transform', `translate(90 124) rotate(${-model.angle})`);
    this.get('[data-paper-polygon]').setAttribute('points', model.cutout.map(point => `${point.x / 4},${-point.y / 4}`).join(' '));
    const handle = this.get('[data-cutout-handle]'), radians = model.angle * Math.PI / 180;
    handle.setAttribute('transform', `translate(${90 + 100 * Math.cos(radians)} ${124 - 100 * Math.sin(radians)})`);
    handle.setAttribute('aria-label', labels.cutoutControl); handle.setAttribute('aria-valuenow', String(model.angle));
    handle.setAttribute('aria-valuetext', model.angle === 0 ? labels.rest : model.angle === 90 ? labels.raised : `${Math.round(model.angle)}°`);
    this.get<HTMLElement>('[data-cover]').hidden = model.phase !== 'cover';
    this.get<HTMLElement>('[data-ending]').hidden = model.phase !== 'final';
    this.get<HTMLButtonElement>('[data-action="continue"]').hidden = !model.hasSave;
    this.setText(this.get('[data-action="start"]'), model.hasSave ? labels.newGame : labels.enter);
    const editing = this.canEdit(), tentative = model.phase === 'tentative', running = model.phase === 'trial', paused = model.phase === 'paused';
    const placingFrame = tentative && model.editingKind === 'frame';
    for (const selector of ['[data-lamp-cart]', '[data-cutout-handle]', '[data-frame]']) {
      this.get(selector).setAttribute('aria-disabled', String(!editing));
      this.get(selector).setAttribute('tabindex', editing ? '0' : '-1');
    }
    this.get<HTMLElement>('[data-worktable]').inert = !editing;
    this.get('[data-worktable]').classList.toggle('is-locked', !editing);
    for (const action of ['place', 'home']) this.get<HTMLButtonElement>(`[data-action="${action}"]`).disabled = !editing;
    this.get<HTMLButtonElement>('[data-action="place"]').hidden = placingFrame;
    this.get<HTMLButtonElement>('[data-action="confirm"]').hidden = !placingFrame;
    this.get<HTMLButtonElement>('[data-action="cancel"]').hidden = !placingFrame;
    this.setText(this.get('[data-frame-hint]'), placingFrame ? labels.placingHint : labels.frameHint);
    this.get<HTMLButtonElement>('[data-action="trial"]').hidden = running || paused || model.phase === 'final' || model.phase === 'arrival';
    this.get<HTMLButtonElement>('[data-action="trial"]').disabled = !editing || tentative;
    this.get<HTMLButtonElement>('[data-action="pause"]').hidden = !running;
    this.get<HTMLButtonElement>('[data-action="resume"]').hidden = !paused;
    this.get<HTMLButtonElement>('[data-action="stop"]').hidden = !running && !paused;
    this.get<HTMLButtonElement>('[data-action="undo"]').disabled = !editing || !model.canUndo || tentative;
    this.get<HTMLButtonElement>('[data-action="hint"]').disabled = !editing || tentative;
    this.setText(this.get('[data-feedback]'), model.feedback || (running ? labels.trialStatus : paused ? labels.pausedStatus : ''));
    this.get('[data-feedback]').setAttribute('aria-label', labels.status);
    if (!placingFrame) { this.placing = false; this.frameKeyboardPoint = null; }
  }
}
