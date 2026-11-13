import { describe, expect, it } from 'vitest';
import { CASE_SAVE_KEY, LEGACY_TERMINAL_KEY, MAX_SAVE_LENGTH, V3_SAVE_KEY, clearCase, loadCase, migrateV3, parseCaseSave, writeCase, type CaseSave } from '../src/haunt/case-save';
import { CaseStore } from '../src/haunt/case-store';
import { MIST_LINES, encodeBytes, createFog } from '../src/haunt/glass-model';
import { deliverValidLetter, memoryStore } from './case-helpers';

class MemoryStore {
  values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function finishedSave(): CaseSave {
  const { store, saves } = memoryStore();
  const receipt = deliverValidLetter(store);
  store.finish(receipt);
  return saves.at(-1)!;
}

/** A realistic v3 save at the checkpoint: the glass, one session print and one limited glass print kept "for the letter". */
function v3Checkpoint(): string {
  const fog = encodeBytes(createFog());
  return JSON.stringify({ v: 3,
    terminal: { retry: false, muffled: false, attempts: 2, presence: 'glass', said: ['help', 'same-minute'] },
    glass: { hand: [0.47, 0.42], side: 'right', fog, revealSeen: true },
    studio: { prints: [
      { id: 1, kind: 'empty-window', source: 'session', session: { presence: 'glass', attempts: 2, pid: null, retry: false, muffled: false } },
      { id: 2, kind: 'impression', source: 'glass', glass: { stage: { w: 1366, h: 656 }, frame: { x: 400, y: 150, w: 470, h: 294 },
        placement: { hand: { u: 0.47, v: 0.42 }, side: 'right' }, patch: { c0: 36, r0: 15, cols: 6, rows: 4, data: encodeBytes(new Uint8Array(24)) },
        facts: { hand: 1, lines: [0, 1, 2, 3, 4], linesInFrame: 5, figure: 'clear' } } },
    ], retained: 2, nextId: 3 } });
}

describe('haunt.case.v4 save', () => {
  it('round-trips a finished case and stays well under its size bound', () => {
    const save = finishedSave();
    const raw = JSON.stringify(save);
    expect(raw.length).toBeLessThan(MAX_SAVE_LENGTH / 5);
    expect(parseCaseSave(raw)).toEqual(save);
    const restored = new CaseStore({ save: parseCaseSave(raw), notice: null }, { write: () => true });
    expect(restored.phase).toBe('finished');
    expect(restored.legacy.snapshot().presence).toBe('released');
    expect(restored.finish(save.ack!.receiptId)).toEqual({ ok: false, reason: 'finished' });
  });

  it('rejects inconsistent or tampered cases', () => {
    const save = finishedSave();
    const variants: unknown[] = [
      { ...save, v: 3 },
      { ...save, run: '' },
      { ...save, ack: null },
      { ...save, terminal: { ...save.terminal, presence: 'glass' } },
      { ...save, glass: { ...save.glass!, released: false } },
      { ...save, ack: { ...save.ack!, receiptId: 999 } },
      { ...save, glass: { ...save.glass!, writing: ['<img src=x onerror=alert(1)>'.repeat(5)] } },
      { ...save, mail: { ...save.mail, archive: save.mail.deliveries } },
      { ...save, echo: { ...save.echo, captures: save.echo.captures.map(item => ({ ...item, run: 'run-other' })) } },
    ];
    for (const variant of variants) expect(parseCaseSave(JSON.stringify(variant))).toBeNull();
    for (const raw of [null, '', 'not json', '[]', 'x'.repeat(MAX_SAVE_LENGTH + 1)]) expect(parseCaseSave(raw)).toBeNull();
  });

  it('migrates v3: keeps the checkpoint, turns glass prints into limited captures and never completes anything', () => {
    const save = migrateV3(v3Checkpoint(), 'run-migrated')!;
    expect(save).not.toBeNull();
    expect(save.terminal).toMatchObject({ presence: 'glass', attempts: 2, retry: false });
    expect(save.glass!.writing).toEqual(MIST_LINES);
    expect(save.echo.captures.map(item => item.negative.kind)).toEqual(['session', 'limited']);
    expect(save.letter.draft).toBeNull();
    expect(save.mail.deliveries).toEqual([]);
    expect(parseCaseSave(JSON.stringify(save))).toEqual(save);
    const store = new CaseStore({ save, notice: 'migrated-v3' }, { write: () => true });
    expect(store.phase).toBe('call-stopped');
    store.useCapture(2);
    expect(store.letter.status()!.missing).toContain('no-writing');
    expect(store.letter.liftWriting()).toBe(false);
  });

  it('loads in order v4, v3, v1; removes only its own keys; reports each migration once', () => {
    const store = new MemoryStore();
    store.setItem(V3_SAVE_KEY, v3Checkpoint());
    store.setItem('haunt.guide.v2', 'dismissed');
    store.setItem('la-ventana-equivocada.v3', '{"paper":"bridge"}');
    const first = loadCase(store);
    expect(first.notice).toBe('migrated-v3');
    expect(store.getItem(V3_SAVE_KEY)).toBeNull();
    expect(store.getItem(CASE_SAVE_KEY)).not.toBeNull();
    expect(loadCase(store).notice).toBeNull();
    expect(store.getItem('haunt.guide.v2')).toBe('dismissed');
    expect(store.getItem('la-ventana-equivocada.v3')).toBe('{"paper":"bridge"}');
    const old = new MemoryStore();
    old.setItem(LEGACY_TERMINAL_KEY, '{"v":1,"outcome":"remembered","returns":3}');
    expect(loadCase(old)).toEqual({ save: null, notice: 'migrated-v1' });
    expect(old.getItem(LEGACY_TERMINAL_KEY)).toBeNull();
    const corrupt = new MemoryStore();
    corrupt.setItem(CASE_SAVE_KEY, '{"v":4,"terminal":"<script>"}');
    expect(loadCase(corrupt)).toEqual({ save: null, notice: 'corrupt' });
    expect(corrupt.getItem(CASE_SAVE_KEY)).toBeNull();
  });

  it('writes, verifies and clears only its own key; storage failures never throw', () => {
    const store = new MemoryStore();
    const save = finishedSave();
    expect(writeCase(save, store)).toBe(true);
    expect(loadCase(store).save).toEqual(save);
    store.setItem('other', 'kept');
    clearCase(store);
    expect(store.getItem(CASE_SAVE_KEY)).toBeNull();
    expect(store.getItem('other')).toBe('kept');
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
    expect(loadCase(broken)).toEqual({ save: null, notice: null });
    expect(writeCase(save, broken)).toBe(false);
    const silent = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    expect(writeCase(save, silent)).toBe(false);
  });
});
