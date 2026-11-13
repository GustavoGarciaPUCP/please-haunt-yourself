// DOM layout audit for HAUNT OS 4 (.kiro/specs/os-case-v4 R9). Runs in the page; reports, never fixes.
// - text-overflow: a text element whose own box clips its content (ellipsis or hidden overflow).
// - text-clipped: text cut by a non-scrolling ancestor that clips (a window, a panel), or by the viewport.
// - covered: a visible control whose centre is not hit by itself (something lies on top of it).
// - outside-window: a control that sticks out of its window.
// Decorative content (aria-hidden) and text inside scroll containers' vertical overflow are not defects.
// playability-v5 R3: a control partly cut by a panel that really scrolls is reachable (scrolling or focusing it brings
// it into view), so it is not reported as covered or outside its window; the panel itself must then lie inside its
// window and be reachable from the keyboard (scroll-unfocusable otherwise). Nothing else is exempt.
// visual-precision-v6: text-covered — visible text (decorative text included) with something else of the same window
// painted over it: a background, a border, other text or a picture. Hit testing runs with pointer events forced on,
// so labels and badges that ignore the pointer are seen too. Not defects: menus and dialogs opened over content, a
// transparent element (an invisible radio over its own label), and the texture of the figure made of its own output.
// free-text-v8: picture-clipped — a canvas or image cut off by a box that clips it (see below).
export async function auditLayout(page, label = '') {
  return page.evaluate(label => {
    const out = [];
    const describe = el => {
      const cls = typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
      return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls} “${(el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 48)}”`;
    };
    const shown = el => {
      if (el.closest('[hidden], [inert], [aria-hidden="true"], .sr-only')) return false;
      const style = getComputedStyle(el), rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && Number(style.opacity) > 0.05;
    };
    const clipper = el => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.overflowX !== 'visible' || s.overflowY !== 'visible') return p;
      }
      return null;
    };
    const scrolls = el => ['auto', 'scroll'].includes(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1;
    const root = document.getElementById('desktop-root');
    const texts = [...root.querySelectorAll('*')].filter(el => [...el.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()) && shown(el));
    for (const el of texts) {
      const style = getComputedStyle(el), rect = el.getBoundingClientRect();
      if ((style.overflowX !== 'visible' || style.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) out.push({ kind: 'text-overflow', el: describe(el) });
      const clip = clipper(el);
      let scrolledAway = false;
      if (clip) {
        const c = clip.getBoundingClientRect(), scrolling = scrolls(clip);
        const outX = rect.left < c.left - 1 || rect.right > c.right + 1, outY = rect.top < c.top - 1 || rect.bottom > c.bottom + 1;
        if (outX || (outY && !scrolling)) out.push({ kind: 'text-clipped', el: describe(el), by: describe(clip) });
        // Text scrolled out of a panel that really scrolls is not off the screen: scrolling the panel shows it.
        scrolledAway = scrolling && outY && !outX;
      }
      if (!scrolledAway && (rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1 || rect.left < -1)) out.push({ kind: 'text-offscreen', el: describe(el) });
    }
    const controls = [...root.querySelectorAll('button, input:not([type="hidden"]), textarea, select, [role="tab"]')].filter(shown);
    for (const el of controls) {
      const rect = el.getBoundingClientRect();
      // A control scrolled out of its list is reachable by scrolling; only check what is meant to be on screen.
      const clip = clipper(el);
      if (clip && scrolls(clip)) {
        const c = clip.getBoundingClientRect();
        if (rect.bottom <= c.top || rect.top >= c.bottom) continue;
        if (rect.top < c.top - 1 || rect.bottom > c.bottom + 1) {
          const w = el.closest('.window')?.getBoundingClientRect();
          if (w && (c.left < w.left - 1 || c.right > w.right + 1 || c.top < w.top - 1 || c.bottom > w.bottom + 1)) out.push({ kind: 'outside-window', el: describe(clip) });
          continue;
        }
      }
      const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { out.push({ kind: 'control-offscreen', el: describe(el) }); continue; }
      const hit = document.elementFromPoint(x, y);
      const ok = hit && (hit === el || el.contains(hit) || hit.contains(el) || (el.tagName === 'INPUT' && hit.closest('label')?.contains(el)));
      // Overlapping windows, an open menu, a dialog or a notification covering things is normal desktop behaviour.
      // A defect is a control hidden by something inside its own window, or anything lying on the taskbar.
      const win = el.closest('.window'), hitWin = hit?.closest('.window');
      const own = win ? hitWin === win : !!el.closest('#taskbar') && !hit?.closest('#taskbar, .launcher-menu, .phase-popover, dialog, .toasts');
      if (!ok && own) out.push({ kind: 'covered', el: describe(el), by: hit ? describe(hit) : 'nothing' });
      if (win) {
        const w = win.getBoundingClientRect();
        if (rect.left < w.left - 1 || rect.right > w.right + 1 || rect.top < w.top - 1 || rect.bottom > w.bottom + 1) out.push({ kind: 'outside-window', el: describe(el) });
      }
    }
    // free-text-v8: picture-clipped — a canvas or image inside a window cut off by an ancestor that clips: sideways, or
    // vertically when that ancestor does not scroll (scrolled out of a panel that scrolls is reachable, as for text).
    // aria-hidden pictures count: a thumbnail is decorative for assistive technology, not for the eye. SVG icons and
    // figures are drawn to overflow on purpose and are not checked.
    for (const el of root.querySelectorAll('.window canvas, .window img')) {
      if (el.closest('[hidden], .sr-only')) continue;
      const style = getComputedStyle(el), rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || style.visibility !== 'visible' || Number(style.opacity) < 0.05) continue;
      const clip = clipper(el);
      if (!clip) continue;
      const c = clip.getBoundingClientRect(), left = c.left + clip.clientLeft, top = c.top + clip.clientTop;
      const box = { left, top, right: left + clip.clientWidth, bottom: top + clip.clientHeight };
      const outX = rect.left < box.left - 1 || rect.right > box.right + 1, outY = rect.top < box.top - 1 || rect.bottom > box.bottom + 1;
      if (outX || (outY && !scrolls(clip))) out.push({ kind: 'picture-clipped', el: describe(el), by: describe(clip) });
    }
    // A panel that really scrolls inside a window must be reachable from the keyboard, not only by the wheel.
    for (const el of root.querySelectorAll('.window *')) {
      if (!shown(el) || !scrolls(el)) continue;
      if (el.tabIndex < 0) out.push({ kind: 'scroll-unfocusable', el: describe(el) });
    }
    // Text with something of its own window painted over it.
    const colorCtx = document.createElement('canvas').getContext('2d');
    const alpha = css => { colorCtx.fillStyle = 'rgba(0,0,0,0)'; colorCtx.fillStyle = css; const v = colorCtx.fillStyle; return v.startsWith('#') ? 1 : Number(v.match(/[\d.]+/g)?.[3] ?? 1); };
    const paints = (el, x, y) => {
      const s = getComputedStyle(el);
      if (s.visibility !== 'visible') return false;
      let opacity = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
      if (opacity < 0.05) return false;
      if (el instanceof HTMLCanvasElement || el instanceof HTMLImageElement || el instanceof SVGElement) return true;
      if (alpha(s.backgroundColor) > 0.05 || s.backgroundImage !== 'none') return true;
      const r = el.getBoundingClientRect(), side = n => (s[`border${n}Style`] !== 'none' && alpha(s[`border${n}Color`]) > 0.05 ? parseFloat(s[`border${n}Width`]) : 0);
      if (x < r.left + side('Left') || x > r.right - side('Right') || y < r.top + side('Top') || y > r.bottom - side('Bottom')) return true;
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const box of range.getClientRects()) if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return true;
      }
      return false;
    };
    // Windows are themselves role="dialog": only a dialog or menu opened inside the window counts as an overlay.
    const overlay = (el, win) => { const o = el.closest('[role="dialog"], [role="alertdialog"], [role="menu"], dialog, .app-menu, .window-menu'); return !!o && o !== win && win.contains(o); };
    const blockOf = el => { let n = el; while (n && getComputedStyle(n).display.startsWith('inline')) n = n.parentElement; return n; };
    /** The part of the viewport where `el` can be seen: inside every ancestor that clips (a scrolled panel, a window). */
    const visibleRect = el => {
      let r = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
      for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
        const b = n.getBoundingClientRect(), left = b.left + n.clientLeft, top = b.top + n.clientTop;
        r = { left: Math.max(r.left, left), top: Math.max(r.top, top), right: Math.min(r.right, left + n.clientWidth), bottom: Math.min(r.bottom, top + n.clientHeight) };
      }
      return r;
    };
    const force = document.createElement('style');
    force.textContent = '* { pointer-events: auto !important; }';
    document.head.append(force);
    try {
      const seen = new Set();
      for (const el of root.querySelectorAll('.window *')) {
        if (el.closest('[hidden], [inert], .sr-only, .presence') || !el.closest('.window')) continue;
        const style = getComputedStyle(el);
        if (style.visibility !== 'visible' || Number(style.opacity) < 0.05) continue;
        const win = el.closest('.window');
        let view = null;
        for (const node of el.childNodes) {
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const box of range.getClientRects()) {
            if (box.width < 1 || box.height < 1) continue;
            view ??= visibleRect(el);
            for (const [fx, fy] of [[0.5, 0.5], [0.12, 0.5], [0.88, 0.5], [0.5, 0.2], [0.5, 0.8]]) {
              const x = box.left + box.width * fx, y = box.top + box.height * fy;
              // Text scrolled out of its panel, or past a window's edge, is not on screen there: nothing covers it. Within a
              // pixel of the clipping edge, hit testing can return the neighbour across it (a scrolled transcript's last
              // line against TERMINAL's prompt), so those points are not sampled either.
              if (x < view.left + 1 || y < view.top + 1 || x > view.right - 1 || y > view.bottom - 1) continue;
              for (const hit of document.elementsFromPoint(x, y)) {
                if (hit === el || el.contains(hit) || hit.contains(el)) break;
                if (!win.contains(hit) || overlay(hit, win)) break;
                // Letters of the same line touching (ghost writing, italics) are typography, not one thing over another.
                if (blockOf(hit) === blockOf(el) && getComputedStyle(hit).display.startsWith('inline')) break;
                if (paints(hit, x, y)) {
                  const key = `${describe(el)}|${describe(hit)}`;
                  if (!seen.has(key)) { seen.add(key); out.push({ kind: 'text-covered', el: describe(el), by: describe(hit) }); }
                  break;
                }
              }
            }
          }
        }
      }
    } finally { force.remove(); }
    // Unexpected page scrolling.
    if (document.scrollingElement.scrollHeight > innerHeight + 1 || document.scrollingElement.scrollWidth > innerWidth + 1) out.push({ kind: 'page-scroll', el: 'document' });
    return { label, problems: out };
  }, label);
}
