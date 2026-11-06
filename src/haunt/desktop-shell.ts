import { FirstRunGuide } from './first-run';
import type { RehearsalResult } from './echo-view';

export class DesktopShell {
  readonly guide: FirstRunGuide;
  private reactions = new Set<RehearsalResult['reaction']>();
  constructor(launch: (app: 'terminal' | 'echo') => void, pause: () => void) {
    this.guide = new FirstRunGuide(launch, pause);
    document.getElementById('btn-guide')!.addEventListener('click', () => this.guide.start());
    document.addEventListener('click', event => {
      const target = (event.target as Element).closest<HTMLElement>('[data-launch]');
      if (target?.dataset.launch === 'terminal' || target?.dataset.launch === 'echo') {
        launch(target.dataset.launch);
        document.querySelector<HTMLDetailsElement>('.os-session-menu')!.open = false;
      }
      if ((event.target as Element).closest('[data-open-guide]')) {
        document.querySelector<HTMLDetailsElement>('.os-session-menu')!.open = false;
        this.guide.start();
      }
      const menu = document.querySelector<HTMLDetailsElement>('.os-session-menu')!;
      if (!menu.contains(event.target as Node)) menu.open = false;
    });
    document.addEventListener('keydown', event => {
      const menu = document.querySelector<HTMLDetailsElement>('.os-session-menu')!;
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary')!.focus();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    const clock = document.querySelector<HTMLElement>('.os-clock')!;
    const updateClock = () => {
      const now = new Date();
      clock.textContent = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(now);
      clock.title = now.toLocaleDateString();
    };
    updateClock();
    setInterval(updateClock, 60_000);
  }

  setContext(app: 'terminal' | 'echo' | undefined): void {
    document.getElementById('os-app-context')!.textContent = app === 'terminal' ? 'Terminal' : app === 'echo' ? 'Echo Studio' : 'Desktop';
  }

  markRehearsal(result: RehearsalResult): void {
    this.reactions.add(result.reaction);
    const task = document.querySelector<HTMLElement>('.desktop-task')!;
    task.dataset.complete = 'true';
    task.textContent = `${this.reactions.size === 2 ? '✓ Both host reactions rehearsed.' : '✓ ECHO made an entrance. Try the other host reaction.'}\nLast take: ${result.reaction === 'collapse' ? 'Collapse' : 'Scare back'} / ${result.privacy === 'released' ? 'feed released' : 'monitor covered'}.\nTwo apps recovered. Four still missing.`;
  }
}
