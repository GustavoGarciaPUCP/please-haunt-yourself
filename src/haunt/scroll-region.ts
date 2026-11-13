/**
 * A panel that really scrolls must be reachable from the keyboard (.kiro/specs/playability-v5 R3). While its content
 * overflows, the element joins the Tab order with a name (and the region role when it has no role of its own), so the
 * arrow and Page keys scroll it. When everything fits, those attributes go back to what they were and Tab does not stop
 * on an empty place. Checks are batched to one per frame. Returns a disposer.
 */
export function scrollRegion(element: HTMLElement, label: string): () => void {
  const original = { tabindex: element.getAttribute('tabindex'), role: element.getAttribute('role'), label: element.getAttribute('aria-label') };
  const named = element.hasAttribute('aria-labelledby') || original.label !== null;
  let on = false, frame = 0;
  const restore = (name: string, value: string | null) => { if (value === null) element.removeAttribute(name); else element.setAttribute(name, value); };
  const update = () => {
    frame = 0;
    if (!element.isConnected) return;
    const overflow = !element.hidden && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1);
    if (overflow === on) return;
    on = overflow;
    if (overflow) {
      element.tabIndex = 0;
      if (original.role === null && element.tagName === 'DIV') element.setAttribute('role', 'region');
      if (!named) element.setAttribute('aria-label', label);
      element.dataset.scrolls = 'true';
    } else {
      restore('tabindex', original.tabindex);
      restore('role', original.role);
      restore('aria-label', original.label);
      delete element.dataset.scrolls;
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const resize = new ResizeObserver(schedule);
  const observeChildren = () => { for (const child of element.children) resize.observe(child); };
  resize.observe(element);
  observeChildren();
  // Content that appears, disappears or changes text changes the scroll height without resizing the element itself.
  const mutation = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList')) observeChildren();
    schedule();
  });
  mutation.observe(element, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  update();
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    mutation.disconnect();
  };
}
