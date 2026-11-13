import { ADDRESSES, RETURNED_LINE, SUBJECT, questionWords, resolveRecipient, type Delivery, type SendResult } from './mail-model';
import { letterStatus, missingPhrases, snapshotSource, type LetterDraft, type LetterSource, type Missing } from './letter-model';
import { subjectLabel } from './glass-model';
import { LETTER_ASPECT, drawLetter, fitCanvas, letterArtFromDraft, letterArtFromSnapshot, type LetterArt } from './glass-render';
import { AppMenuBar } from './app-menu';
import { icon } from './os-icons';
import { prefersReducedMotion } from './ghost-writing';
import { scrollRegion } from './scroll-region';
import type { CaseStore, Mailbox, OpenTarget } from './case-store';
import type { AppContext, AppController } from './window-manager';

const BOXES: ReadonlyArray<{ id: Mailbox; label: string; note?: string }> = [
  { id: 'guest', label: 'Guest Inbox', note: 'this desk' },
  { id: 'recovered', label: 'Recovered · 1987' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
  { id: 'returned', label: 'Returned' },
  { id: 'archive', label: 'Archive', note: 'earlier sessions' },
];
const clock = (at: number): string => new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(at);
/** What CANVAS's draft is made from, for the words that say what it lacks (visual-precision-v6 R4). */
const draftSource = (draft: LetterDraft | null, attached: boolean): LetterSource =>
  ({ kind: draft?.source.kind ?? null, subject: draft ? subjectLabel(letterStatus(draft).subjects) : null, attached: attached && !!draft });
/**
 * The one question POSTMAN is asking about a send attempt (.kiro/specs/confirmation-flow-v7): what the letter lacks
 * (null if it is complete), the complete letter it would replace (null if none), whether it would be a copy after the
 * end, and the attempt's key, which the answer carries so it can only ever apply to this attempt.
 */
type Confirm = { key: string; missing: Missing[] | null; replaces: Delivery | null; copy: boolean } | null;
const TEXT_FIELDS = new Set(['to', 'subject', 'message']);
const CHANGED_LINE = 'The letter changed after you pressed Send, so nothing was sent. Send checks it again.';
const FINISHED_LINE = 'The session finished after you pressed Send, so nothing was sent. Sending now delivers another copy.';
let instances = 0;
/** Writes only what differs: an update that changes nothing leaves the DOM as it was (.kiro/specs/fluid-typing-v9). */
const setText = (element: Element, text: string): void => { if (element.textContent !== text) element.textContent = text; };
const setAttr = (element: Element, name: string, value: string): void => { if (element.getAttribute(name) !== value) element.setAttribute(name, value); };
const setHidden = (element: HTMLElement, hidden: boolean): void => { if (element.hidden !== hidden) element.hidden = hidden; };
/** One row of the message list, as shown: the list is rebuilt only when a row's shown content changes. */
interface Row { key: string; who: string; when: string; subject: string; badge: string; tone: string; current: boolean; arriving: boolean; }

/**
 * POSTMAN (.kiro/specs/os-case-v4 R6). Local, fictional mail between the two mailboxes at this desk: mara@haunt, the
 * sender (1987), and guest@haunt, the next person at this desk (now). Reply only addresses a draft; Send commits one
 * immutable delivery, and a delivery to guest arrives with its receipt. Nothing leaves this browser.
 */
export class PostmanController implements AppController {
  private readonly events = new AbortController();
  private readonly unsubscribers: Array<() => void> = [];
  private readonly menus: AppMenuBar;
  private mailbox: Mailbox;
  private selected: string | null = null;
  private confirm: Confirm = null;
  private notice: { text: string; tone: 'error' | 'info' } | null = null;
  private fresh: number | null = null;
  private editorFor: number | null = null;
  private readonly n = ++instances;
  /** What the mailbox list and the message list show now; each is rebuilt only when this changes. */
  private boxesKey = '';
  private listKey = '';
  /** What each letter canvas shows: the letter's identity and the canvas's backing size when it was drawn. */
  private readonly drawn = new WeakMap<HTMLCanvasElement, string>();

  constructor(private readonly container: HTMLElement, private readonly store: CaseStore, private readonly context: AppContext) {
    container.classList.add('postman-app');
    this.mailbox = store.mail.draft ? 'drafts' : store.mail.list().some(item => item.route === 'guest-inbox') ? 'guest' : 'recovered';
    this.menus = new AppMenuBar([
      { id: 'message', label: 'Message', items: () => [
        { id: 'reply', label: 'Reply to sender', enabled: this.selected === 'recovered' },
        { id: 'send', label: 'Send', shortcut: 'Ctrl+Enter', enabled: !!store.mail.draft },
        { id: 'discard', label: 'Discard draft', enabled: !!store.mail.draft },
      ] },
      { id: 'go', label: 'Go', items: () => BOXES.filter(box => box.id !== 'archive' || store.mail.archive().length).map(box => ({ id: `box-${box.id}`, label: box.label, enabled: true })) },
    ], item => this.command(item), 'POSTMAN menu');
    container.append(this.menus.element);
    const body = document.createElement('div');
    body.className = 'postman-body';
    body.innerHTML = `<nav class="mailboxes" aria-label="Mailboxes"><ul></ul><p class="mail-identity">guest@haunt</p></nav>
      <section class="message-list" aria-label="Messages"><h3 class="list-title"></h3><ul class="list-items"></ul><p class="list-empty"></p></section>
      <section class="reading-pane" aria-label="Message" tabindex="-1"></section>
      <p class="postman-status sr-only" role="status" aria-live="polite"></p>`;
    container.append(body);
    const options = { signal: this.events.signal };
    container.addEventListener('click', event => {
      const target = event.target as Element;
      const box = target.closest<HTMLButtonElement>('[data-box]');
      if (box) { this.go(box.dataset.box as Mailbox); return; }
      const item = target.closest<HTMLButtonElement>('[data-message]');
      if (item) { this.select(item.dataset.message!); return; }
      const button = target.closest<HTMLButtonElement>('[data-mail]');
      if (button && !button.disabled) this.command(button.dataset.mail!);
    }, options);
    container.addEventListener('input', event => {
      const field = event.target as HTMLInputElement | HTMLTextAreaElement;
      // Text fields only: a checkbox fires `input` too, and its value is the string "on" (confirmation-flow-v7, finding D).
      const name = field.dataset.field;
      if (!name || !TEXT_FIELDS.has(name)) return;
      this.confirm = null;
      this.notice = null;
      store.mail.updateDraft({ [name as 'to' | 'subject' | 'message']: field.value });
    }, options);
    container.addEventListener('change', event => {
      const box = event.target as HTMLInputElement;
      if (box.dataset.field !== 'attached') return;
      // Like any edit of the draft, (un)attaching the letter closes an open question about the draft as it was.
      this.confirm = null;
      this.notice = null;
      store.mail.updateDraft({ attached: box.checked });
    }, options);
    container.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.ctrlKey && store.mail.draft) { event.preventDefault(); this.command('send'); }
      if (event.key === 'Escape' && this.confirm) { event.preventDefault(); event.stopPropagation(); this.confirm = null; this.render(); this.focusSend(); }
    }, options);
    const resize = new ResizeObserver(() => this.drawLetters());
    resize.observe(body.querySelector('.reading-pane')!);
    this.unsubscribers.push(() => resize.disconnect());
    this.unsubscribers.push(scrollRegion(body.querySelector<HTMLElement>('.reading-pane')!, 'Message'));
    // A list of long subjects (shown whole, free-text-v8) can be taller than the column: it is then a keyboard region too.
    this.unsubscribers.push(scrollRegion(body.querySelector<HTMLElement>('.message-list')!, 'Messages'));
    this.unsubscribers.push(store.subscribe(() => this.render()));
    this.render();
  }

  // ---------- Commands ----------

  private command(command: string): void {
    const store = this.store;
    if (command.startsWith('box-')) { this.go(command.slice(4) as Mailbox); return; }
    switch (command) {
      case 'reply':
        store.reply();
        this.go('drafts', 'draft');
        this.focusField('to');
        break;
      case 'send': this.send({}); break;
      // Every answer that goes ahead carries the key of the attempt the question described, and nothing else; with no
      // question open (it closed a moment ago), an answer button does nothing rather than act as a plain Send.
      case 'send-anyway': case 'replace': case 'send-anyway-replace': if (this.confirm) this.send({ confirm: this.confirm.key }); break;
      case 'keep-editing': this.confirm = null; this.render(); this.focusField('to'); break;
      case 'discard': store.mail.discardDraft(); this.notice = { text: 'Draft discarded.', tone: 'info' }; this.go('recovered'); break;
      case 'to-mara': store.mail.updateDraft({ to: ADDRESSES.mara }); this.confirm = null; this.notice = null; this.render(); this.focusSend(); break;
      case 'to-guest': store.mail.updateDraft({ to: ADDRESSES.guest }); this.confirm = null; this.notice = null; this.render(); this.focusSend(); break;
      case 'open-canvas': store.open({ app: 'canvas' }); break;
      case 'open-draft': this.go('drafts', 'draft'); this.focusField('to'); break;
      case 'compose-from-canvas': if (store.letter.draft) store.compose(); else store.open({ app: 'canvas' }); break;
      case 'return': {
        const delivery = this.current();
        if (delivery?.receipt) store.returnToRequest(delivery.receipt.id);
        break;
      }
    }
  }

  private send(options: { confirm?: string }): void {
    const draft = this.store.mail.draft;
    if (!draft) return;
    const replacing = this.confirm?.replaces ?? null;
    const result: SendResult = this.store.send(options);
    this.confirm = null;
    this.notice = null;
    if (result.ok) {
      const delivery = result.delivery;
      this.fresh = delivery.id;
      if (delivery.route === 'returned') {
        this.notice = { text: RETURNED_LINE, tone: 'info' };
        this.go('returned', `d-${delivery.id}`);
        this.say(`${RETURNED_LINE} Nothing was delivered. Your draft is still in Drafts.`);
      } else {
        this.go('guest', `d-${delivery.id}`);
        this.say(this.store.finished ? 'Another copy delivered to guest@haunt. The job keeps the letter it accepted.'
          : delivery.complete ? 'Delivered to guest@haunt. Its receipt arrived with it.'
            : replacing ? 'Delivered to guest@haunt, marked incomplete. The complete letter it replaced is marked replaced; no receipt can finish the job until a complete letter arrives.'
              : 'Delivered to guest@haunt, marked incomplete. Its receipt cannot finish the job.');
        // Keep keyboard focus on the result: Return to the request when it applies, otherwise the delivered message.
        (this.container.querySelector<HTMLButtonElement>('[data-mail="return"]')
          ?? this.container.querySelector<HTMLButtonElement>(`[data-message="d-${delivery.id}"]`))?.focus({ preventScroll: true });
      }
      return;
    }
    switch (result.reason) {
      case 'no-recipient': this.notice = { text: 'Add a recipient: who is this letter for?', tone: 'error' }; break;
      case 'unknown-recipient': this.notice = { text: `There is no mailbox called “${draft.to.trim()}” at this desk. The two here are ${ADDRESSES.mara} and ${ADDRESSES.guest}.`, tone: 'error' }; break;
      case 'duplicate': this.notice = { text: 'This draft was already sent exactly as it is. Change the recipient or the letter to send it again.', tone: 'error' }; break;
      case 'confirm-incomplete': this.confirm = { key: result.key, missing: result.missing, replaces: result.replaces, copy: result.copy }; break;
      case 'confirm-replace': this.confirm = { key: result.key, missing: null, replaces: result.replaces, copy: false }; break;
      case 'changed': this.notice = { text: CHANGED_LINE, tone: 'info' }; break;
      case 'no-draft': break;
    }
    this.render();
    if (this.confirm) this.container.querySelector<HTMLButtonElement>('.mail-confirm button')?.focus({ preventScroll: true });
    else this.focusField('to');
    if (this.notice) this.say(this.notice.text);
  }

  private go(mailbox: Mailbox, selected: string | null = null): void {
    this.mailbox = mailbox;
    this.selected = selected ?? this.items(mailbox)[0]?.key ?? null;
    this.confirm = null;
    this.render();
  }
  private select(key: string): void { this.selected = key; this.confirm = null; this.render(); }
  private focusField(name: string): void { this.container.querySelector<HTMLElement>(`[data-field="${name}"]`)?.focus({ preventScroll: true }); }
  private focusSend(): void { this.container.querySelector<HTMLButtonElement>('[data-mail="send"]')?.focus({ preventScroll: true }); }
  private say(text: string): void { this.container.querySelector('.postman-status')!.textContent = text; }

  // ---------- Data ----------

  /** A mailbox's items, newest first. `all` and `archived` are the deliveries, when the caller already has them. */
  private items(mailbox: Mailbox, all?: Delivery[], archived?: Delivery[]): Array<{ key: string; delivery?: Delivery }> {
    const mail = this.store.mail;
    switch (mailbox) {
      case 'guest': return (all ?? mail.list().reverse()).filter(item => item.route === 'guest-inbox').map(delivery => ({ key: `d-${delivery.id}`, delivery }));
      case 'recovered': return [{ key: 'recovered' }];
      case 'drafts': return mail.draft ? [{ key: 'draft' }] : [];
      case 'sent': return (all ?? mail.list().reverse()).map(delivery => ({ key: `d-${delivery.id}`, delivery }));
      case 'returned': return (all ?? mail.list().reverse()).filter(item => item.route === 'returned').map(delivery => ({ key: `d-${delivery.id}`, delivery }));
      case 'archive': return (archived ?? mail.archive().reverse()).map(delivery => ({ key: `d-${delivery.id}`, delivery }));
    }
  }
  private current(): Delivery | null {
    if (!this.selected?.startsWith('d-')) return null;
    return this.store.mail.get(Number(this.selected.slice(2)));
  }
  private archived(delivery: Delivery): boolean { return delivery.run !== this.store.run; }

  /** One status for a delivery, in the same words everywhere POSTMAN shows it (.kiro/specs/playability-v5 R1). */
  private deliveryState(delivery: Delivery): { badge: string; tone: string; text: string } {
    const store = this.store, ack = store.ack;
    if (this.archived(delivery)) return { badge: 'Earlier session', tone: 'muted', text: 'From an earlier session at this desk. Its receipt belongs to that session and cannot finish this one.' };
    switch (store.mail.standing(delivery)) {
      case 'returned': return { badge: 'Returned', tone: 'warn', text: `${RETURNED_LINE} ${ADDRESSES.mara} is the address of the person who wrote the note, in 1987. Nothing was delivered and no receipt exists.` };
      case 'accepted': return { badge: 'Accepted', tone: 'ok', text: `Accepted by last.session${ack ? ` at ${clock(ack.at)}` : ''}. The job is closed; this is its letter.` };
      case 'copy': return { badge: 'Copy', tone: 'muted', text: 'Another copy, sent after the session finished. The job keeps the letter it accepted.' };
      // An incomplete letter's receipt never could finish the job, so "no longer" is said only of a complete one.
      case 'replaced': return { badge: 'Replaced', tone: 'muted', text: delivery.complete ? 'Replaced by a newer letter. This receipt can no longer finish the job.'
        : 'Replaced by a newer letter. This incomplete letter’s receipt cannot finish the job.' };
      default: break;
    }
    if (!delivery.complete) return { badge: 'Incomplete', tone: 'warn', text: `Incomplete: ${missingPhrases(snapshotSource(delivery.letter), delivery.missing)}. This receipt cannot finish the job.` };
    return { badge: 'Receipt', tone: 'ok', text: 'This receipt answers Mara’s job. TERMINAL can finish the session with it.' };
  }

  // ---------- Rendering ----------

  /**
   * Renders on every change of the case, and touches only what that change altered (.kiro/specs/fluid-typing-v9): a key
   * typed in Message changes nothing in the mailboxes or the list, and nothing in the attached letter.
   */
  private render(): void {
    const c = this.container, mail = this.store.mail;
    // One copy of the deliveries per render (each list() copies every delivery); every mailbox is counted from it.
    const all = mail.list().reverse(), archived = mail.archive().reverse();
    if (this.mailbox === 'archive' && !archived.length) this.mailbox = 'recovered';
    const shown = BOXES.filter(box => box.id !== 'archive' || archived.length);
    const counts = shown.map(box => box.id === 'recovered' ? 0 : this.items(box.id, all, archived).length);
    const boxesKey = shown.map((box, index) => `${box.id}:${counts[index]}:${box.id === this.mailbox}`).join('|');
    if (boxesKey !== this.boxesKey) {
      this.boxesKey = boxesKey;
      const boxes = shown.map((box, index) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.box = box.id;
        if (box.id === this.mailbox) button.setAttribute('aria-current', 'true');
        button.innerHTML = '<span class="box-label"></span><span class="box-count"></span>';
        button.querySelector('.box-label')!.textContent = box.label;
        button.querySelector('.box-count')!.textContent = counts[index] ? String(counts[index]) : '';
        if (box.note) { const note = document.createElement('small'); note.textContent = box.note; button.querySelector('.box-label')!.append(note); }
        item.append(button);
        return item;
      });
      const focusedBox = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-box]')?.dataset.box;
      c.querySelector('.mailboxes ul')!.replaceChildren(...boxes);
      if (focusedBox) c.querySelector<HTMLButtonElement>(`[data-box="${focusedBox}"]`)?.focus({ preventScroll: true });
    }
    const label = BOXES.find(box => box.id === this.mailbox)!.label;
    this.context.setSubtitle(label);
    setText(c.querySelector('.list-title')!, label);
    const items = this.items(this.mailbox, all, archived);
    if (this.selected && !items.some(item => item.key === this.selected)) this.selected = items[0]?.key ?? null;
    if (!this.selected && items.length) this.selected = items[0]!.key;
    setText(c.querySelector('.list-empty')!, items.length ? '' : this.mailbox === 'drafts' ? 'No drafts. In CANVAS, choose Compose in POSTMAN.'
      : this.mailbox === 'guest' ? 'Nothing has arrived at this desk yet.' : this.mailbox === 'returned' ? 'Nothing came back.' : 'Nothing here yet.');
    const rows = items.map(item => this.row(item.key, item.delivery));
    const listKey = JSON.stringify([this.mailbox, rows]);
    if (listKey !== this.listKey) {
      this.listKey = listKey;
      const focusedItem = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-message]')?.dataset.message;
      c.querySelector('.list-items')!.replaceChildren(...rows.map(row => this.rowElement(row)));
      if (focusedItem) c.querySelector<HTMLButtonElement>(`[data-message="${focusedItem}"]`)?.focus({ preventScroll: true });
    }
    this.renderPane();
  }

  private row(key: string, delivery?: Delivery): Row {
    const current = key === this.selected, arriving = !!delivery && delivery.id === this.fresh;
    if (key === 'recovered') return { key, who: 'Mara', when: '31 Oct 1987', subject: SUBJECT, badge: 'Unsent', tone: 'muted', current, arriving };
    if (key === 'draft') {
      const draft = this.store.mail.draft!;
      return { key, who: draft.to ? `To: ${draft.to}` : 'To: (no recipient)', when: 'Draft', subject: draft.subject || SUBJECT, badge: '', tone: '', current, arriving };
    }
    const d = delivery!, state = this.deliveryState(d);
    const who = d.route === 'guest-inbox' ? (this.mailbox === 'sent' ? `To: ${ADDRESSES.guest}` : 'Mara · via last.session') : `To: ${ADDRESSES.mara}`;
    return { key, who, when: clock(d.at), subject: d.subject, badge: state.badge, tone: state.tone, current, arriving };
  }

  private rowElement(row: Row): HTMLElement {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'message-item';
    button.dataset.message = row.key;
    if (row.current) button.setAttribute('aria-current', 'true');
    if (row.arriving) button.classList.add('is-new');
    button.innerHTML = '<span class="item-top"><span class="item-who"></span><span class="item-when"></span></span><span class="item-subject"></span><span class="item-badge"></span>';
    button.querySelector('.item-who')!.textContent = row.who;
    button.querySelector('.item-when')!.textContent = row.when;
    button.querySelector('.item-subject')!.textContent = row.subject;
    const badge = button.querySelector<HTMLElement>('.item-badge')!;
    badge.textContent = row.badge;
    badge.dataset.tone = row.tone;
    badge.hidden = !row.badge;
    item.append(button);
    return item;
  }

  private renderPane(): void {
    const pane = this.container.querySelector<HTMLElement>('.reading-pane')!;
    // A rebuilt message keeps keyboard focus on the same action.
    const focused = pane.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.mail : undefined;
    this.renderPaneContent(pane);
    if (focused && !pane.contains(document.activeElement)) pane.querySelector<HTMLElement>(`[data-mail="${focused}"]`)?.focus({ preventScroll: true });
  }

  private renderPaneContent(pane: HTMLElement): void {
    const key = this.selected;
    setAttr(pane, 'data-view', key === 'recovered' ? 'recovered' : key === 'draft' ? 'draft' : key ? 'delivery' : 'empty');
    if (key === 'draft') { this.renderDraft(pane); return; }
    this.editorFor = null;
    if (!key) { pane.innerHTML = '<p class="pane-empty">Select a message.</p>'; return; }
    if (key === 'recovered') {
      pane.innerHTML = `<div class="mail-toolbar"><button type="button" class="is-primary" data-mail="reply">${icon('reply')}<span>Reply</span></button></div>
        <header class="mail-head"><h3>${SUBJECT}</h3>
          <dl><div><dt>From</dt><dd>Mara &lt;${ADDRESSES.mara}&gt;</dd></div><div><dt>To</dt><dd class="mail-blank">(never addressed)</dd></div><div><dt>Saved</dt><dd>31 Oct 1987, 23:59 · restored with last.session</dd></div></dl></header>
        <div class="mail-body"><p class="mail-unsent">This message was never sent. The picture and the note were going to be attached.</p>
          <p class="mail-help">Finish the letter in CANVAS, then choose <strong>Compose in POSTMAN</strong>. The note says who it is for.</p>
          <button type="button" data-mail="compose-from-canvas">${this.store.letter.draft ? 'Compose with the letter from CANVAS' : 'Open CANVAS'}</button></div>`;
      return;
    }
    const delivery = this.current();
    if (!delivery) { pane.innerHTML = '<p class="pane-empty">This message is no longer here.</p>'; return; }
    const state = this.deliveryState(delivery), archived = this.archived(delivery);
    const toGuest = delivery.route === 'guest-inbox';
    const canReturn = toGuest && !archived && !!delivery.receipt && !this.store.finished;
    const head = `<header class="mail-head"><h3></h3><dl>
        <div><dt>From</dt><dd>${toGuest ? 'Mara · via last.session' : 'guest@haunt (you)'} &lt;${toGuest ? ADDRESSES.mara : ADDRESSES.guest}&gt;</dd></div>
        <div><dt>To</dt><dd>${toGuest ? `${ADDRESSES.guest} (you, at this desk)` : ADDRESSES.mara}</dd></div>
        <div><dt>${toGuest ? 'Delivered' : 'Returned'}</dt><dd>${clock(delivery.at)}</dd></div></dl></header>`;
    pane.innerHTML = `<div class="mail-receipt" data-tone="${state.tone}"><span class="receipt-icon" aria-hidden="true">${icon(toGuest ? 'receipt' : 'reply')}</span>
        <div><strong>${toGuest ? (archived ? 'Receipt · earlier session' : 'Receipt') : 'Returned'}</strong><p class="receipt-state"></p></div>
        <div class="receipt-actions">${canReturn ? '<button type="button" class="is-primary" data-mail="return">Return to the request</button>' : ''}
          ${!archived && toGuest && !delivery.complete ? '<button type="button" data-mail="open-canvas">Fix it in CANVAS</button>' : ''}
          ${!toGuest && !archived && this.store.mail.draft ? '<button type="button" data-mail="open-draft">Open the draft</button>' : ''}</div></div>
      ${head}<div class="mail-body"><p class="mail-message"></p>
        <figure class="mail-letter"><canvas class="mail-letter-canvas" role="img"></canvas><figcaption></figcaption></figure></div>`;
    pane.querySelector('.receipt-state')!.textContent = state.text;
    pane.querySelector('.mail-head h3')!.textContent = delivery.subject;
    const message = pane.querySelector<HTMLElement>('.mail-message')!;
    message.textContent = delivery.message;
    message.hidden = !delivery.message;
    const figure = pane.querySelector<HTMLElement>('.mail-letter')!;
    figure.hidden = !delivery.letter;
    if (delivery.letter) {
      figure.querySelector('figcaption')!.textContent = delivery.letter.complete ? 'The letter, as it was sent.' : 'The letter, as it was sent (incomplete).';
      if (delivery.id === this.fresh && !prefersReducedMotion()) figure.classList.add('is-arriving');
    }
    this.fresh = null;
    this.drawLetters();
  }

  /** The draft editor is built once per draft and updated in place, so typing is never interrupted by a re-render. */
  private renderDraft(pane: HTMLElement): void {
    const draft = this.store.mail.draft;
    if (!draft) { pane.innerHTML = '<p class="pane-empty">No draft.</p>'; this.editorFor = null; return; }
    const n = this.n;
    if (this.editorFor !== draft.id || !pane.querySelector('.draft-editor')) {
      pane.innerHTML = `<div class="draft-editor">
        <div class="mail-toolbar"><button type="button" class="is-primary" data-mail="send">${icon('send')}<span>Send</span></button>
          <button type="button" data-mail="discard">Discard draft</button></div>
        <p class="mail-after-end" hidden>The job already accepted your letter. Sending again delivers another copy; the accepted letter stays as it was.</p>
        <div class="mail-notice" role="alert" hidden></div>
        <div class="mail-confirm" role="alertdialog" aria-labelledby="mail-confirm-${n}" hidden><p id="mail-confirm-${n}"></p><div class="confirm-buttons"></div></div>
        <div class="draft-field"><label for="mail-to-${n}">To</label><input id="mail-to-${n}" data-field="to" autocomplete="off" spellcheck="false" maxlength="80" placeholder="Who is this for?">
          <div class="to-suggestions" aria-label="Addresses at this desk"><button type="button" data-mail="to-mara"><strong>${ADDRESSES.mara}</strong><span>Mara · last signed in 31 Oct 1987</span></button>
            <button type="button" data-mail="to-guest"><strong>${ADDRESSES.guest}</strong><span>guest · signed in now</span></button></div></div>
        <div class="draft-field"><label for="mail-subject-${n}">Subject</label><input id="mail-subject-${n}" data-field="subject" maxlength="120"></div>
        <div class="draft-field"><label for="mail-message-${n}">Message <small>optional</small></label><textarea id="mail-message-${n}" data-field="message" rows="2" maxlength="600"></textarea></div>
        <div class="draft-attachment"><label class="attach-toggle"><input type="checkbox" data-field="attached"> <span>Attach the letter from CANVAS</span></label>
          <figure class="mail-letter"><canvas class="mail-letter-canvas draft-letter" role="img"></canvas><figcaption></figcaption></figure></div>
      </div>`;
      this.editorFor = draft.id;
    }
    const set = (name: string, value: string) => {
      const field = pane.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-field="${name}"]`)!;
      if (field.value !== value && document.activeElement !== field) field.value = value;
    };
    set('to', draft.to); set('subject', draft.subject); set('message', draft.message);
    const letter = this.store.letter.draft;
    const attach = pane.querySelector<HTMLInputElement>('[data-field="attached"]')!;
    attach.checked = draft.attached && !!letter;
    if (attach.disabled !== !letter) attach.disabled = !letter;
    // The chosen address shows as pressed; the story's conclusion is not stated while the person is still choosing.
    const recipient = resolveRecipient(draft.to);
    for (const [command, who] of [['to-mara', 'mara'], ['to-guest', 'guest']] as const) {
      setAttr(pane.querySelector(`[data-mail="${command}"]`)!, 'aria-pressed', String(recipient === who));
    }
    const figure = pane.querySelector<HTMLElement>('.draft-attachment .mail-letter')!;
    setHidden(figure, !(draft.attached && letter));
    const caption = figure.querySelector('figcaption')!;
    if (letter) {
      const status = letterStatus(letter);
      setText(caption, status.complete ? 'The letter from CANVAS, as it is now. Send keeps this exact version.' : `The letter from CANVAS is incomplete: ${missingPhrases(draftSource(letter, true), status.missing)}.`);
      setAttr(caption, 'data-complete', String(status.complete));
    }
    // A question never outlives what it describes (confirmation-flow-v7 R2.2): if the attempt is not the one it asked
    // about any more (the letter changed in CANVAS, the session finished), it closes and says why. Nothing was sent.
    if (this.confirm) {
      const now = this.store.sendAttempt();
      if (!now.ok || now.attempt.key !== this.confirm.key) {
        this.notice = now.ok ? { text: now.attempt.copy && !this.confirm.copy ? FINISHED_LINE : CHANGED_LINE, tone: 'info' } : null;
        this.confirm = null;
      }
    }
    // After the end, the only question is the incomplete-copy one, and it says what this line says: while it is open the
    // line goes, so the question's buttons stay in view with POSTMAN at its minimum (confirmation-flow-v7 R6.3).
    setHidden(pane.querySelector<HTMLElement>('.mail-after-end')!, !this.store.finished || this.confirm !== null);
    const notice = pane.querySelector<HTMLElement>('.mail-notice')!;
    setHidden(notice, !this.notice || this.notice.text === RETURNED_LINE);
    setText(notice, this.notice?.text ?? '');
    setAttr(notice, 'data-tone', this.notice?.tone ?? '');
    const confirm = pane.querySelector<HTMLElement>('.mail-confirm')!;
    setHidden(confirm, !this.confirm);
    if (this.confirm) {
      const text = confirm.querySelector('p')!, buttons = confirm.querySelector('.confirm-buttons')!;
      const { missing, replaces, copy } = this.confirm;
      const words = questionWords(missing ? missingPhrases(draftSource(letter, draft.attached), missing) : null, replaces ? clock(replaces.at) : null, copy);
      if (text.textContent !== words.text) text.textContent = words.text;
      const html = words.buttons.map(([command, label, primary]) => `<button type="button" data-mail="${command}"${primary ? ' class="is-primary"' : ''}>${label}</button>`).join('');
      if (buttons.innerHTML !== html) buttons.innerHTML = html;
    }
    this.drawLetters();
  }

  /**
   * Every letter POSTMAN shows is drawn from its own data: the delivered snapshot, or the live CANVAS draft. A canvas is
   * drawn again only when that letter or the canvas's backing size changed (.kiro/specs/fluid-typing-v9): CANVAS's draft
   * is identified by its revision, which every edit, Undo and Redo increases; a delivery never changes. The size is read
   * after fitCanvas, so a canvas it resized (and so cleared) is always drawn again.
   */
  private drawLetters(): void {
    const pane = this.container.querySelector<HTMLElement>('.reading-pane')!;
    for (const canvas of pane.querySelectorAll<HTMLCanvasElement>('.mail-letter-canvas')) {
      const isDraft = canvas.classList.contains('draft-letter');
      const draft = isDraft ? this.store.letter.draft : null, delivery = isDraft ? null : this.current();
      const letter = draft ?? delivery?.letter ?? null;
      if (!letter) continue;
      const identity = draft ? `draft:${draft.run}:${draft.id}:${draft.revision}` : `delivery:${delivery!.run}:${delivery!.id}`;
      const aspect = String(LETTER_ASPECT[letter.layout]);
      if (canvas.style.aspectRatio !== aspect) canvas.style.aspectRatio = aspect;
      if (!fitCanvas(canvas)) continue;
      const key = `${identity}:${canvas.width}x${canvas.height}`;
      if (this.drawn.get(canvas) === key) continue;
      const art: LetterArt = draft ? letterArtFromDraft(draft) : letterArtFromSnapshot(delivery!.letter!);
      drawLetter(canvas.getContext('2d')!, art, canvas.width, canvas.height);
      setAttr(canvas, 'aria-label', art.lines ? `A letter with a photograph and Mara’s words: ${art.lines.join(' ')}` : 'A letter with a photograph and no words.');
      this.drawn.set(canvas, key);
    }
  }

  open(target: OpenTarget): void {
    if (target.app !== 'postman') return;
    if (target.delivery !== undefined) {
      const delivery = this.store.mail.get(target.delivery);
      if (delivery) this.go(this.archived(delivery) ? 'archive' : delivery.route === 'returned' ? 'returned' : 'guest', `d-${delivery.id}`);
    } else if (target.mailbox) this.go(target.mailbox, target.mailbox === 'drafts' ? 'draft' : null);
    if (target.focus === 'to') this.focusField('to');
    if (target.focus === 'receipt') this.container.querySelector<HTMLButtonElement>('[data-mail="return"]')?.focus({ preventScroll: true });
  }
  focusTarget(): HTMLElement | null {
    if (this.selected === 'draft') return this.container.querySelector<HTMLElement>('[data-field="to"]');
    return this.container.querySelector<HTMLButtonElement>('[data-mail="return"], [data-mail="reply"]') ?? this.container.querySelector<HTMLButtonElement>('[data-box][aria-current="true"]');
  }
  suspend(): void { this.menus.close(false); }
  resume(): void { this.render(); }
  dispose(): void { this.events.abort(); this.menus.dispose(); this.unsubscribers.forEach(unsubscribe => unsubscribe()); }
}
