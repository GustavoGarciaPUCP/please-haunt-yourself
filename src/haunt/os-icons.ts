/**
 * HAUNT OS icon family (.kiro/specs/os-case-v4 design §5). One 24×24 grid, 1.6 px round strokes in currentColor, so
 * apps, files and controls read as one system. Original drawings; no external assets.
 */
const svg = (body: string, extra = ''): string =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${body}</svg>`;

export const ICONS = {
  /** The launcher: a window pane with the case's bell hanging in it. */
  haunt: svg('<rect x="3" y="3" width="18" height="18" rx="3.5"/><path d="M12 7v1.2"/><path d="M8.6 15.4c.9-.8 1.1-2 1.1-3.2a2.3 2.3 0 0 1 4.6 0c0 1.2.2 2.4 1.1 3.2z" fill="currentColor" fill-opacity=".18"/><path d="M11 17.6h2"/>'),
  terminal: svg('<rect x="2.8" y="4" width="18.4" height="16" rx="2.6"/><path d="m7 9.5 3 2.5-3 2.5"/><path d="M12.5 15h4.5"/>'),
  echo: svg('<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><path d="M17.6 6.4l1.4-1.4"/>'),
  canvas: svg('<path d="M5.5 6.5h10a2 2 0 0 1 2 2v10"/><rect x="3" y="9" width="12" height="11.5" rx="1.8"/><path d="m5.6 17.4 2.8-3.1 2.1 2.1 1.6-1.6 1.4 1.4"/><circle cx="7.6" cy="12" r=".9" fill="currentColor" stroke="none"/>'),
  postman: svg('<rect x="2.8" y="5.5" width="18.4" height="13.5" rx="2.4"/><path d="m3.6 7 8.4 6.2L20.4 7"/>'),
  job: svg('<path d="M6 2.8h8.2L18.5 7v13.2a1.2 1.2 0 0 1-1.2 1.2H6a1.2 1.2 0 0 1-1.2-1.2V4A1.2 1.2 0 0 1 6 2.8z"/><path d="M14 2.8V7h4.5"/><path d="M8 11.5h7M8 14.5h7M8 17.5h4.5"/>'),
  capture: svg('<rect x="2.8" y="4.5" width="18.4" height="15" rx="1.6"/><path d="M2.8 8h18.4M2.8 16h18.4"/><path d="M5.5 6.2h.01M9 6.2h.01M12.5 6.2h.01M16 6.2h.01M19 6.2h.01M5.5 17.8h.01M9 17.8h.01M12.5 17.8h.01M16 17.8h.01M19 17.8h.01" stroke-width="2"/><path d="M9.4 14.2c.2-1.6.7-2.6 1.6-3.1"/>'),
  letter: svg('<path d="M4 9.2 12 4l8 5.2v9.6a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 18.8z"/><path d="m4 9.2 8 5.4 8-5.4"/><path d="M8 7.3V5.5h8v1.8"/>'),
  receipt: svg('<path d="M6 2.8h12v18.4l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z"/><path d="m9 11.5 2 2 4-4.2"/><path d="M9 16.8h6"/>'),
  soundOn: svg('<path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.4 7.4 0 0 1 0 10.4"/>'),
  soundOff: svg('<path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="m15.5 9.5 5 5m0-5-5 5"/>'),
  minimize: svg('<path d="M6 17h12"/>'),
  maximize: svg('<rect x="5.5" y="5.5" width="13" height="13" rx="1.5"/>'),
  restore: svg('<rect x="5" y="8.5" width="10.5" height="10.5" rx="1.4"/><path d="M8.5 8.5V6.4A1.4 1.4 0 0 1 9.9 5h7.7A1.4 1.4 0 0 1 19 6.4v7.7a1.4 1.4 0 0 1-1.4 1.4h-2.1"/>'),
  close: svg('<path d="m6.5 6.5 11 11m0-11-11 11"/>'),
  undo: svg('<path d="M9 14 4.5 9.5 9 5"/><path d="M4.5 9.5h9a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: svg('<path d="m15 14 4.5-4.5L15 5"/><path d="M19.5 9.5h-9a5.5 5.5 0 0 0 0 11H13"/>'),
  reply: svg('<path d="M10 7 4.5 12l5.5 5"/><path d="M4.5 12H14a5.5 5.5 0 0 1 5.5 5.5V19"/>'),
  send: svg('<path d="m4 12 16-7-6.5 15-2.6-6.4z"/><path d="m10.9 13.6 4.6-4.6"/>'),
  info: svg('<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2M12 7.6h.01" stroke-width="2"/>'),
} as const;
export type IconName = keyof typeof ICONS;
export const icon = (name: IconName): string => ICONS[name];
