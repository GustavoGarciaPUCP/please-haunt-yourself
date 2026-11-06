/**
 * PLEASE HAUNT YOURSELF — Desktop window management foundation
 * Window lifecycle, focus management, keyboard control
 */

import { animateOpen, animateClose, animateMinimize, animateRestore, cancelAllAnimations, onPreferenceChange } from './window-motion';
import { initEchoScene, EchoController } from './echo-view';
import { TerminalController } from './terminal-view';
import { ProcessSession } from './process-session';
import { DesktopShell } from './desktop-shell';

type WindowState = 'closed' | 'opening' | 'open' | 'closing' | 'minimized' | 'restoring';
type AppId = 'echo' | 'terminal';

interface WindowInstance {
  id: AppId;
  state: WindowState;
  element: HTMLElement;
  operationGen: number;
  zIndex: number;
  trigger: HTMLElement | null;
  echoController?: EchoController;
  terminalController?: TerminalController;
}

const windows = new Map<AppId, WindowInstance>();
const processSession = new ProcessSession();
let nextZIndex = 100;
let desktopShell: DesktopShell;

/**
 * Initialize desktop and start TERMINAL
 */
export function init(): void {
  const stage = document.getElementById('desktop-stage');
  if (!stage) return;
  desktopShell = new DesktopShell(id => openWindow(id, document.getElementById(`btn-${id}`)),
    () => windows.forEach(instance => instance.echoController?.pause()));

  // Set up taskbar buttons
  const terminalBtn = document.getElementById('btn-terminal') as HTMLElement;
  const echoBtn = document.getElementById('btn-echo') as HTMLElement;

  if (terminalBtn) {
    terminalBtn.addEventListener('click', () => toggleWindow('terminal', terminalBtn));
  }
  if (echoBtn) {
    echoBtn.addEventListener('click', () => toggleWindow('echo', echoBtn));
  }

  // Global keyboard handlers
  document.addEventListener('keydown', handleGlobalKeyboard);

  // Focus-in brings windows forward
  document.addEventListener('focusin', handleFocusIn);

  // Handle reduced-motion changes
  onPreferenceChange(handleMotionPreferenceChange);

  // Start with TERMINAL open
  if (terminalBtn) {
    openWindow('terminal', terminalBtn);
  }
  desktopShell.guide.startIfNew();
}

/**
 * Toggle window open/closed/minimized
 */
function toggleWindow(id: AppId, trigger: HTMLElement): void {
  const instance = windows.get(id);

  if (!instance || instance.state === 'closed') {
    openWindow(id, trigger);
  } else if (instance.state === 'open' || instance.state === 'opening' || instance.state === 'restoring') {
    bringToFront(instance);
    focusWindow(instance);
  } else if (instance.state === 'minimized') {
    restoreWindow(id);
  } else if (instance.state === 'closing') {
    // Reopen while closing
    openWindow(id, trigger);
  }
}

/**
 * Open a window
 */
function openWindow(id: AppId, trigger: HTMLElement | null): void {
  let instance = windows.get(id);

  // If closing or minimized, cancel and reopen
  if (instance) {
    if (instance.state === 'closing' || instance.state === 'minimized') {
      cancelPendingMotion(instance);
      instance.state = 'opening';
      instance.operationGen++;
      instance.trigger = trigger;
      instance.zIndex = nextZIndex++;
      instance.element.style.zIndex = String(instance.zIndex);
      instance.element.style.display = '';
      instance.element.style.pointerEvents = '';
      instance.element.inert = false;
      instance.element.removeAttribute('aria-hidden');
      updateTaskbarButton(id, true);

      const opGen = instance.operationGen;
      const animation = animateOpen(instance.element, trigger);
      focusWindow(instance);

      animation.finished
        .then(() => {
          if (instance && instance.operationGen === opGen && instance.state === 'opening') {
            instance.state = 'open';
          }
        })
        .catch(() => {});
      return;
    } else if (instance.state === 'opening' || instance.state === 'open' || instance.state === 'restoring') {
      // Already opening or open, just bring to front
      bringToFront(instance);
      focusWindow(instance);
      return;
    }
  }

  const stage = document.getElementById('desktop-stage');
  if (!stage) return;

  // Create window element
  const windowEl = createWindowElement(id);
  stage.appendChild(windowEl);

  instance = {
    id,
    state: 'opening',
    element: windowEl,
    operationGen: 1,
    zIndex: nextZIndex++,
    trigger
  };

  windows.set(id, instance);
  if (id === 'echo') {
    instance.echoController = initEchoScene(windowEl.querySelector<HTMLElement>('.window-content')!, processSession, result => desktopShell.markRehearsal(result));
  } else {
    instance.terminalController = new TerminalController(windowEl.querySelector<HTMLElement>('.window-content')!, processSession,
      () => openWindow('echo', document.getElementById('btn-echo')));
  }
  instance.element.style.zIndex = String(instance.zIndex);
  updateTaskbarButton(id, true);

  const opGen = instance.operationGen;
  const animation = animateOpen(windowEl, trigger);
  focusWindow(instance);

  animation.finished
    .then(() => {
      if (instance && instance.operationGen === opGen && instance.state === 'opening') {
        instance.state = 'open';
      }
    })
    .catch(() => {});
}

/**
 * Close a window
 */
function closeWindow(id: AppId): void {
  const instance = windows.get(id);
  if (!instance || instance.state === 'closed' || instance.state === 'closing') return;

  cancelPendingMotion(instance);

  instance.state = 'closing';
  desktopShell.setContext(findActiveWindow()?.id);
  instance.echoController?.leave();
  instance.operationGen++;

  // Restore focus and disable interactions immediately
  restoreFocusToTrigger(instance);
  instance.element.style.pointerEvents = 'none';
  instance.element.inert = true;
  instance.element.setAttribute('aria-hidden', 'true');

  const opGen = instance.operationGen;
  const animation = animateClose(instance.element);

  animation.finished
    .then(() => {
      if (instance.operationGen === opGen && instance.state === 'closing') {
        cleanup(instance);
      }
    })
    .catch(() => {});
}

/**
 * Minimize a window
 */
function minimizeWindow(id: AppId): void {
  const instance = windows.get(id);
  if (!instance || (instance.state !== 'open' && instance.state !== 'opening' && instance.state !== 'restoring')) return;

  cancelPendingMotion(instance);

  instance.state = 'minimized';
  desktopShell.setContext(findActiveWindow()?.id);
  instance.echoController?.pause();
  instance.operationGen++;

  // Restore focus and disable interactions immediately
  restoreFocusToTrigger(instance);
  instance.element.style.pointerEvents = 'none';
  instance.element.inert = true;
  instance.element.setAttribute('aria-hidden', 'true');

  const opGen = instance.operationGen;
  const animation = animateMinimize(instance.element, instance.trigger);

  animation.finished
    .then(() => {
      if (instance.operationGen === opGen && instance.state === 'minimized') {
        instance.element.style.display = 'none';
      }
    })
    .catch(() => {});
}

/**
 * Restore a minimized window
 */
function restoreWindow(id: AppId): void {
  const instance = windows.get(id);
  if (!instance || instance.state !== 'minimized') return;

  cancelPendingMotion(instance);

  instance.state = 'restoring';
  instance.operationGen++;
  instance.element.style.display = '';
  instance.element.style.pointerEvents = '';
  instance.element.inert = false;
  instance.element.removeAttribute('aria-hidden');

  const opGen = instance.operationGen;
  const animation = animateRestore(instance.element, instance.trigger);
  bringToFront(instance);
  focusWindow(instance);

  animation.finished
    .then(() => {
      if (instance.operationGen === opGen && instance.state === 'restoring') {
        instance.state = 'open';
      }
    })
    .catch(() => {});
}

/**
 * Cancel pending motion for an instance
 */
function cancelPendingMotion(instance: WindowInstance): void {
  cancelAllAnimations(instance.element);
}

/**
 * Cleanup after close
 */
function cleanup(instance: WindowInstance): void {
  instance.terminalController?.dispose();
  // Dispose ECHO controller if present
  if (instance.echoController) {
    instance.echoController.dispose();
    instance.echoController = undefined;
  }

  instance.element.remove();
  windows.delete(instance.id);
  instance.state = 'closed';
  updateTaskbarButton(instance.id, false);
}

/**
 * Bring window to front
 */
function bringToFront(instance: WindowInstance): void {
  instance.zIndex = nextZIndex++;
  instance.element.style.zIndex = String(instance.zIndex);
  desktopShell.setContext(instance.id);
}

/**
 * Focus window
 */
function focusWindow(instance: WindowInstance): void {
  desktopShell.setContext(instance.id);
  const focusTarget = instance.element.querySelector<HTMLElement>('[data-primary]')
    ?? instance.element.querySelector<HTMLElement>('[autofocus], button, [tabindex="0"]');
  if (focusTarget) {
    focusTarget.focus();
  } else {
    instance.element.focus();
  }
}

/**
 * Restore focus to trigger button
 */
function restoreFocusToTrigger(instance: WindowInstance): void {
  if (instance.trigger && document.body.contains(instance.trigger)) {
    instance.trigger.focus();
  }
}

/**
 * Check if window is currently active (topmost)
 */
function isActiveWindow(instance: WindowInstance): boolean {
  let maxZ = 0;
  windows.forEach(w => {
    if (['open', 'opening', 'restoring'].includes(w.state) && w.zIndex > maxZ) {
      maxZ = w.zIndex;
    }
  });
  return instance.zIndex === maxZ;
}

/**
 * Update taskbar button state
 */
function updateTaskbarButton(id: AppId, isActive: boolean): void {
  const button = document.getElementById(`btn-${id}`);
  if (button) {
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  }
}

/**
 * Global keyboard handler
 */
function handleGlobalKeyboard(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    // Close the currently focused/active window
    const activeWindow = findActiveWindow();
    if (activeWindow && (activeWindow.state === 'open' || activeWindow.state === 'opening' || activeWindow.state === 'restoring')) {
      closeWindow(activeWindow.id);
      e.preventDefault();
    }
  }
}

/**
 * Focus-in handler to bring windows forward
 */
function handleFocusIn(e: FocusEvent): void {
  const target = e.target as HTMLElement;

  // Find which window received focus
  for (const instance of windows.values()) {
    if (['open', 'opening', 'restoring'].includes(instance.state) && instance.element.contains(target)) {
      if (!isActiveWindow(instance)) {
        bringToFront(instance);
      }
      break;
    }
  }
}

/**
 * Handle motion preference changes
 */
function handleMotionPreferenceChange(): void {
  // Settle all active operations
  windows.forEach(instance => {
    if (instance.state === 'opening' || instance.state === 'closing' ||
        instance.state === 'minimized' || instance.state === 'restoring') {
      cancelPendingMotion(instance);

      // Settle to target state
      if (instance.state === 'opening' || instance.state === 'restoring') {
        instance.state = 'open';
        instance.element.style.opacity = '1';
        instance.element.style.transform = '';
        instance.element.style.display = '';
        instance.element.style.pointerEvents = '';
        instance.element.inert = false;
        instance.element.removeAttribute('aria-hidden');
      } else if (instance.state === 'closing') {
        cleanup(instance);
      } else if (instance.state === 'minimized') {
        instance.element.style.opacity = '0';
        instance.element.style.transform = '';
        instance.element.style.display = 'none';
      }
    }
  });
}

/**
 * Find the currently active (topmost open) window
 */
function findActiveWindow(): WindowInstance | null {
  let active: WindowInstance | null = null;
  let maxZ = 0;

  windows.forEach(instance => {
    if (['open', 'opening', 'restoring'].includes(instance.state) && instance.zIndex > maxZ) {
      maxZ = instance.zIndex;
      active = instance;
    }
  });

  return active;
}

/**
 * Create window DOM element
 */
function createWindowElement(id: AppId): HTMLElement {
  const win = document.createElement('div');
  win.className = 'window';
  win.id = `window-${id}`;
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-labelledby', `${id}-title`);
  win.tabIndex = -1;

  const titleBar = document.createElement('div');
  titleBar.className = 'window-titlebar';

  const title = document.createElement('h2');
  title.id = `${id}-title`;
  title.className = 'window-title';
  title.textContent = id.toUpperCase();

  const controls = document.createElement('div');
  controls.className = 'window-controls';

  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'window-btn';
  minimizeBtn.setAttribute('aria-label', 'Minimize');
  minimizeBtn.innerHTML = '−';
  minimizeBtn.addEventListener('click', () => minimizeWindow(id));

  const closeBtn = document.createElement('button');
  closeBtn.className = 'window-btn window-btn-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('click', () => closeWindow(id));

  controls.appendChild(minimizeBtn);
  controls.appendChild(closeBtn);
  titleBar.appendChild(title);
  titleBar.appendChild(controls);

  const content = document.createElement('div');
  content.className = 'window-content';

  if (id === 'echo') {
    content.classList.add('echo-scene-container');
  }

  win.appendChild(titleBar);
  win.appendChild(content);

  // Make window clickable to bring to front
  win.addEventListener('mousedown', () => {
    const instance = windows.get(id);
    if (instance && instance.state === 'open') {
      bringToFront(instance);
    }
  });

  return win;
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
