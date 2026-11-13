/**
 * A small application menu bar (Edit, Letter, Message…), the same pattern in every app: a button opens a menu, arrow
 * keys move through its items, Escape or a click elsewhere closes it, and every item runs the same handler as the
 * matching button in the app. Disabled items stay visible so the menu explains what exists.
 */
export interface MenuItem { id: string; label: string; shortcut?: string; enabled: boolean; separator?: boolean; }
export interface MenuSpec { id: string; label: string; items(): MenuItem[]; }

export class AppMenuBar {
  readonly element: HTMLElement;
  private open: { spec: MenuSpec; button: HTMLButtonElement; menu: HTMLElement } | null = null;
  private readonly events = new AbortController();

  constructor(specs: MenuSpec[], private readonly run: (item: string) => void, label: string) {
    this.element = document.createElement('div');
    this.element.className = 'app-menubar';
    this.element.setAttribute('role', 'menubar');
    this.element.setAttribute('aria-label', label);
    for (const spec of specs) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'app-menu-button';
      button.setAttribute('role', 'menuitem');
      button.setAttribute('aria-haspopup', 'menu');
      button.setAttribute('aria-expanded', 'false');
      button.dataset.menu = spec.id;
      button.textContent = spec.label;
      button.addEventListener('click', () => (this.open?.spec === spec ? this.close(true) : this.show(spec, button, false)), { signal: this.events.signal });
      button.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.show(spec, button, true); }
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          const buttons = [...this.element.querySelectorAll<HTMLButtonElement>('.app-menu-button')];
          buttons[(buttons.indexOf(button) + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length]!.focus();
        }
      }, { signal: this.events.signal });
      this.element.append(button);
    }
    document.addEventListener('pointerdown', event => {
      if (this.open && !this.open.menu.contains(event.target as Node) && !this.open.button.contains(event.target as Node)) this.close(false);
    }, { capture: true, signal: this.events.signal });
  }

  get isOpen(): boolean { return this.open !== null; }

  private show(spec: MenuSpec, button: HTMLButtonElement, focusFirst: boolean): void {
    this.close(false);
    const menu = document.createElement('div');
    menu.className = 'app-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', spec.label);
    for (const item of spec.items()) {
      if (item.separator) { const line = document.createElement('div'); line.className = 'app-menu-separator'; line.setAttribute('role', 'separator'); menu.append(line); continue; }
      const entry = document.createElement('button');
      entry.type = 'button';
      entry.setAttribute('role', 'menuitem');
      entry.dataset.item = item.id;
      entry.disabled = !item.enabled;
      entry.innerHTML = '<span class="app-menu-label"></span><span class="app-menu-shortcut"></span>';
      entry.querySelector('.app-menu-label')!.textContent = item.label;
      entry.querySelector('.app-menu-shortcut')!.textContent = item.shortcut ?? '';
      menu.append(entry);
    }
    menu.addEventListener('click', event => {
      const entry = (event.target as Element).closest<HTMLButtonElement>('[data-item]');
      if (!entry || entry.disabled) return;
      this.close(false);
      this.run(entry.dataset.item!);
    });
    menu.addEventListener('keydown', event => {
      const items = [...menu.querySelectorAll<HTMLButtonElement>('[data-item]:not([disabled])')];
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); items[event.key === 'Home' ? 0 : items.length - 1]?.focus(); }
      else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(true); }
      else if (event.key === 'Tab') this.close(false);
    });
    this.element.append(menu);
    menu.style.left = `${button.offsetLeft}px`;
    button.setAttribute('aria-expanded', 'true');
    this.open = { spec, button, menu };
    if (focusFirst) menu.querySelector<HTMLButtonElement>('[data-item]:not([disabled])')?.focus();
  }

  close(focusButton: boolean): void {
    const open = this.open;
    if (!open) return;
    this.open = null;
    open.menu.remove();
    open.button.setAttribute('aria-expanded', 'false');
    if (focusButton) open.button.focus();
  }

  dispose(): void { this.close(false); this.events.abort(); this.element.remove(); }
}
