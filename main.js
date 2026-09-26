'use strict';

const obsidian = require('obsidian');
const {
	Plugin,
	ItemView,
	PluginSettingTab,
	Setting,
	prepareFuzzySearch,
	setIcon,
	Notice,
	TFile,
	MarkdownRenderer,
	normalizePath,
} = obsidian;

const TRAIN_BUTTON = '[aria-label="Train this repertoire from its first move"]';
const BOARD_FENCE = /```+\s*chessRepertoire\s*\n([\s\S]*?)```+/g;

const CHESS_PLUGIN_ID = 'chess-repertoire';

/* Where Chess Repertoire puts its repertoires when its folder setting is
   empty, which is every vault that has not been into those settings. */
const CHESS_FOLDER_FALLBACK = 'Chess Repertoires';

/* Drill history sits beside each repertoire under the same id. It is not a
   line, and must not be drawn as one. */
const DRILL_SUFFIX = '.drill.json';

const VIEW_TYPE = 'sleek-home';

/* Obsidian glyph, lifted from the app itself so it renders identically. */
const OBSIDIAN_LOGO =
	'<radialGradient id="logo-bottom-left" cx="0" cy="0" gradientTransform="matrix(-59 -225 150 -39 161.4 470)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-opacity=".1"/></radialGradient><radialGradient id="logo-top-right" cx="0" cy="0" gradientTransform="matrix(50 -379 280 37 360 374.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></radialGradient><radialGradient id="logo-top-left" cx="0" cy="0" gradientTransform="matrix(69 -319 218 47 175.4 307)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></radialGradient><radialGradient id="logo-bottom-right" cx="0" cy="0" gradientTransform="matrix(-96 -163 187 -111 335.3 512.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-opacity=".3"/></radialGradient><radialGradient id="logo-top-edge" cx="0" cy="0" gradientTransform="matrix(-36 166 -112 -24 310 128.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></radialGradient><radialGradient id="logo-left-edge" cx="0" cy="0" gradientTransform="matrix(88 89 -190 187 111 220.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></radialGradient><radialGradient id="logo-bottom-edge" cx="0" cy="0" gradientTransform="matrix(9 130 -276 20 215 284)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></radialGradient><radialGradient id="logo-middle-edge" cx="0" cy="0" gradientTransform="matrix(-198 -104 327 -623 400 399.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></radialGradient><clipPath id="clip"><path d="M.2.2h512v512H.2z"/></clipPath><g clip-path="url(#clip)"><path d="M382.3 475.6c-3.1 23.4-26 41.6-48.7 35.3-32.4-8.9-69.9-22.8-103.6-25.4l-51.7-4a34 34 0 0 1-22-10.2l-89-91.7a34 34 0 0 1-6.7-37.7s55-121 57.1-127.3c2-6.3 9.6-61.2 14-90.6 1.2-7.9 5-15 11-20.3L248 8.9a34.1 34.1 0 0 1 49.6 4.3L386 125.6a37 37 0 0 1 7.6 22.4c0 21.3 1.8 65 13.6 93.2 11.5 27.3 32.5 57 43.5 71.5a17.3 17.3 0 0 1 1.3 19.2 1494 1494 0 0 1-44.8 70.6c-15 22.3-21.9 49.9-25 73.1z" fill="#6c31e3"/><path d="M165.9 478.3c41.4-84 40.2-144.2 22.6-187-16.2-39.6-46.3-64.5-70-80-.6 2.3-1.3 4.4-2.2 6.5L60.6 342a34 34 0 0 0 6.6 37.7l89.1 91.7a34 34 0 0 0 9.6 7z" fill="url(#logo-bottom-left)"/><path d="M278.4 307.8c11.2 1.2 22.2 3.6 32.8 7.6 34 12.7 65 41.2 90.5 96.3 1.8-3.1 3.6-6.2 5.6-9.2a1536 1536 0 0 0 44.8-70.6 17 17 0 0 0-1.3-19.2c-11-14.6-32-44.2-43.5-71.5-11.8-28.2-13.5-72-13.6-93.2 0-8.1-2.6-16-7.6-22.4L297.6 13.2a34 34 0 0 0-1.5-1.7 96 96 0 0 1 2 54 198.3 198.3 0 0 1-17.6 41.3l-7.2 14.2a171 171 0 0 0-19.4 71c-1.2 29.4 4.8 66.4 24.5 115.8z" fill="url(#logo-top-right)"/><path d="M278.4 307.8c-19.7-49.4-25.8-86.4-24.5-115.9a171 171 0 0 1 19.4-71c2.3-4.8 4.8-9.5 7.2-14.1 7.1-13.9 14-27 17.6-41.4a96 96 0 0 0-2-54A34.1 34.1 0 0 0 248 9l-105.4 94.8a34.1 34.1 0 0 0-10.9 20.3l-12.8 85-.5 2.3c23.8 15.5 54 40.4 70.1 80a147 147 0 0 1 7.8 24.8c28-6.8 55.7-11 82.1-8.3z" fill="url(#logo-top-left)"/><path d="M333.6 511c22.7 6.2 45.6-12 48.7-35.4a187 187 0 0 1 19.4-63.9c-25.6-55-56.5-83.6-90.4-96.3-36-13.4-75.2-9-115 .7 8.9 40.4 3.6 93.3-30.4 162.2 4 1.8 8.1 3 12.5 3.3 0 0 24.4 2 53.6 4.1 29 2 72.4 17.1 101.6 25.2z" fill="url(#logo-bottom-right)"/><g clip-rule="evenodd" fill-rule="evenodd"><path d="M254.1 190c-1.3 29.2 2.4 62.8 22.1 112.1l-6.2-.5c-17.7-51.5-21.5-78-20.2-107.6a174.7 174.7 0 0 1 20.4-72c2.4-4.9 8-14.1 10.5-18.8 7.1-13.7 11.9-21 16-33.6 5.7-17.5 4.5-25.9 3.8-34.1 4.6 29.9-12.7 56-25.7 82.4a177.1 177.1 0 0 0-20.7 72z" fill="url(#logo-top-edge)"/><path d="M194.3 293.4c2.4 5.4 4.6 9.8 6 16.5L195 311c-2.1-7.8-3.8-13.4-6.8-20-17.8-42-46.3-63.6-69.7-79.5 28.2 15.2 57.2 39 75.7 81.9z" fill="url(#logo-left-edge)"/><path d="M200.6 315.1c9.8 46-1.2 104.2-33.6 160.9 27.1-56.2 40.2-110.1 29.3-160z" fill="url(#logo-bottom-edge)"/><path d="M312.5 311c53.1 19.9 73.6 63.6 88.9 100-19-38.1-45.2-80.3-90.8-96-34.8-11.8-64.1-10.4-114.3 1l-1.1-5c53.2-12.1 81-13.5 117.3 0z" fill="url(#logo-middle-edge)"/></g></g>';

const DEFAULT_QUICK = [
	{ icon: 'file-text', command: 'daily-notes', label: 'Daily note' },
];

const DEFAULT_COMMAND_PREFIX = '!';

const DEFAULTS = {
	tabTitle: 'Home',
	showLogo: true,
	showWordmark: true,
	wordmark: '',
	placeholder: 'Search or command',
	showNewNote: true,
	newNoteLabel: 'New note',
	background: '',
	bgDim: 0.45,
	bgBlur: 0,
	accent: '',
	quickButtons: DEFAULT_QUICK,
	maxResults: 8,
	topOffset: 8,
	showBoard: true,
	boardSize: 640,
	autoStudy: true,
	learnLabel: 'Learn Chess Position',
	dailyBoard: null,
	searchScope: 'notes',
	commandPrefix: DEFAULT_COMMAND_PREFIX,
	openOnStartup: true,
	closeOtherTabsOnStartup: true,
	replaceNewTabs: true,
	hideHeader: false,
};

function clamp(n, lo, hi) {
	return Math.min(hi, Math.max(lo, n));
}

class SleekHomeView extends ItemView {
	constructor(leaf, plugin) {
		super(leaf);
		this.plugin = plugin;
		this.navigation = false;
		this.results = [];
		this.selected = 0;
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return this.plugin.settings.tabTitle || 'Home';
	}

	getIcon() {
		return 'home';
	}

	async onOpen() {
		this._closed = false;
		this._revealed = false;
		this.render();
	}

	async onClose() {
		this._closed = true;
		this.results = [];
	}

	get s() {
		return this.plugin.settings;
	}

	/* ---------------------------------------------------------------- render */

	render() {
		const s = this.s;
		const root = this.contentEl;
		root.empty();
		root.addClass('sleek-home-root');

		const wrap = root.createDiv({ cls: 'sleek-home' });
		if (s.accent) wrap.style.setProperty('--sh-accent', s.accent);
		wrap.style.setProperty('--sh-top', `${clamp(s.topOffset, 0, 45)}vh`);

		const url = this.plugin.resolveBackground();
		const bg = wrap.createDiv({ cls: 'sh-bg' });
		if (url) {
			bg.addClass('is-image');
			bg.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
			if (s.bgBlur > 0) {
				bg.style.filter = `blur(${s.bgBlur}px)`;
				bg.style.transform = `scale(${1 + s.bgBlur / 60})`;
			}
		}

		const scrim = wrap.createDiv({ cls: 'sh-scrim' });
		if (url) {
			const top = clamp(s.bgDim, 0, 1);
			const bottom = clamp(s.bgDim + 0.18, 0, 1);
			scrim.style.background = `linear-gradient(180deg, rgba(46,52,64,${top}) 0%, rgba(46,52,64,${bottom}) 100%)`;
		}

		const content = wrap.createDiv({ cls: 'sh-content' });

		if (s.showLogo || s.showWordmark) {
			const brand = content.createDiv({ cls: 'sh-brand' });
			if (s.showLogo) {
				const mark = brand.createDiv({ cls: 'sh-logo' });
				mark.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${OBSIDIAN_LOGO}</svg>`;
			}
			if (s.showWordmark) {
				brand.createDiv({
					cls: 'sh-wordmark',
					text: s.wordmark || this.app.vault.getName(),
				});
			}
		}

		const row = content.createDiv({ cls: 'sh-row' });

		const search = row.createDiv({ cls: 'sh-search' });
		const icon = search.createDiv({ cls: 'sh-search-icon' });
		setIcon(icon, 'search');

		this.inputEl = search.createEl('input', {
			cls: 'sh-input',
			attr: {
				type: 'text',
				placeholder: s.placeholder,
				spellcheck: 'false',
				autocomplete: 'off',
			},
		});

		this.resultsEl = search.createDiv({ cls: 'sh-results' });
		this.resultsEl.hide();

		if (s.showNewNote) {
			const btn = row.createEl('button', { cls: 'sh-newnote' });
			const plus = btn.createSpan({ cls: 'sh-newnote-icon' });
			setIcon(plus, 'plus');
			btn.createSpan({ text: s.newNoteLabel || 'New note' });
			btn.addEventListener('click', () => this.plugin.createNote());
		}

		const quick = (s.quickButtons || []).filter((q) => q && q.command);
		if (quick.length) {
			const bar = content.createDiv({ cls: 'sh-quick' });
			for (const q of quick) {
				const b = bar.createEl('button', {
					cls: 'sh-quick-btn',
					attr: { 'aria-label': q.label || q.command },
				});
				setIcon(b, q.icon || 'chevron-right');
				b.addEventListener('click', () => this.plugin.runCommand(q.command));
			}
		}

		if (s.showBoard) {
			this.boardEl = wrap.createDiv({ cls: 'sh-board' });
			this.boardEl.style.setProperty('--sh-board-size', `${s.boardSize}px`);
			this.renderBoard();
		}

		this.registerDomEvent(this.inputEl, 'input', () => this.onQuery());
		this.registerDomEvent(this.inputEl, 'focus', () => this.onQuery());
		this.registerDomEvent(this.inputEl, 'keydown', (e) => this.onKey(e));
		this.registerDomEvent(search, 'focusout', (e) => {
			if (!search.contains(e.relatedTarget)) this.closeResults();
		});
	}

	/* ---------------------------------------------------------------- search */

	onQuery() {
		const raw = this.inputEl.value;
		const prefix = this.s.commandPrefix || DEFAULT_COMMAND_PREFIX;
		const commandMode = raw.startsWith(prefix);
		const query = (commandMode ? raw.slice(prefix.length) : raw).trim();

		if (!query) {
			this.results = commandMode
				? this.allCommands().slice(0, this.s.maxResults)
				: this.recentFiles();
			this.selected = 0;
			return this.paintResults();
		}

		const fuzzy = prepareFuzzySearch(query);
		const scope = commandMode ? 'commands' : this.s.searchScope;
		const hits = [];

		if (scope !== 'commands') {
			for (const file of this.app.vault.getFiles()) {
				const m = fuzzy(file.basename) || fuzzy(file.path);
				if (m) hits.push({ kind: 'file', file, score: m.score + 1 });
			}
		}
		if (scope !== 'notes') {
			for (const cmd of this.allCommands()) {
				const m = fuzzy(cmd.name);
				if (m) hits.push({ ...cmd, score: m.score });
			}
		}

		hits.sort((a, b) => b.score - a.score);
		this.results = hits.slice(0, this.s.maxResults);
		this.selected = 0;
		this.paintResults();
	}

	allCommands() {
		const list =
			this.app.commands && typeof this.app.commands.listCommands === 'function'
				? this.app.commands.listCommands()
				: [];
		return list.map((c) => ({
			kind: 'command',
			id: c.id,
			name: c.name,
			icon: c.icon,
			score: 0,
		}));
	}

	recentFiles() {
		const out = [];
		for (const path of this.app.workspace.getLastOpenFiles()) {
			const f = this.app.vault.getAbstractFileByPath(path);
			if (f instanceof TFile)
				out.push({ kind: 'file', file: f, score: 0, recent: true });
			if (out.length >= this.s.maxResults) break;
		}
		return out;
	}

	paintResults() {
		const el = this.resultsEl;
		el.empty();

		if (!this.results.length) {
			el.hide();
			return;
		}
		el.show();

		this.results.forEach((r, i) => {
			const rowEl = el.createDiv({ cls: 'sh-result' });
			if (i === this.selected) rowEl.addClass('is-selected');

			const ic = rowEl.createDiv({ cls: 'sh-result-icon' });
			setIcon(ic, r.kind === 'file' ? 'file-text' : r.icon || 'terminal');

			const text = rowEl.createDiv({ cls: 'sh-result-text' });
			if (r.kind === 'file') {
				text.createDiv({ cls: 'sh-result-title', text: r.file.basename });
				const parent =
					r.file.parent && r.file.parent.path !== '/' ? r.file.parent.path : '';
				if (parent) text.createDiv({ cls: 'sh-result-sub', text: parent });
			} else {
				text.createDiv({ cls: 'sh-result-title', text: r.name });
			}

			rowEl.createDiv({
				cls: 'sh-result-kind',
				text: r.kind === 'file' ? (r.recent ? 'recent' : 'note') : 'command',
			});

			rowEl.addEventListener('mousedown', (e) => {
				e.preventDefault();
				this.activate(i);
			});
			rowEl.addEventListener('mouseenter', () => {
				this.selected = i;
				this.highlight();
			});
		});
	}

	highlight() {
		const rows = Array.from(this.resultsEl.children);
		rows.forEach((r, i) => r.toggleClass('is-selected', i === this.selected));
		const active = rows[this.selected];
		if (active) active.scrollIntoView({ block: 'nearest' });
	}

	move(delta) {
		if (!this.results.length) return;
		this.selected =
			(this.selected + delta + this.results.length) % this.results.length;
		this.highlight();
	}

	onKey(e) {
		if (e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey)) {
			e.preventDefault();
			this.move(1);
		} else if (e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey)) {
			e.preventDefault();
			this.move(-1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			this.activate(this.selected);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			if (this.inputEl.value) {
				this.inputEl.value = '';
				this.onQuery();
			} else {
				this.inputEl.blur();
				this.closeResults();
			}
		}
	}

	activate(index) {
		const r = this.results[index];
		if (!r) return;
		this.closeResults();
		this.inputEl.value = '';
		if (r.kind === 'file') {
			this.app.workspace.getLeaf(false).openFile(r.file);
		} else {
			this.plugin.runCommand(r.id);
		}
	}

	closeResults() {
		this.results = [];
		this.resultsEl.empty();
		this.resultsEl.hide();
	}

	async renderBoard() {
		const el = this.boardEl;
		if (!el) return;
		el.empty();

		if (!this.app.plugins.enabledPlugins.has('chess-repertoire')) {
			el.createDiv({
				cls: 'sh-board-empty',
				text: 'Enable the Chess Repertoire plugin to see the daily line.',
			});
			return;
		}

		el.createDiv({ cls: 'sh-board-empty', text: 'Looking for a line…' });
		const pick = await this.plugin.pickDailyBoard(false);
		if (this._closed) return;
		el.empty();

		if (!pick) {
			const folder = this.plugin.chessStorageFolder();
			el.createDiv({
				cls: 'sh-board-empty',
				text: folder
					? `No repertoires found in "${folder}".`
					: 'No repertoires found.',
			});
			return;
		}

		const head = el.createDiv({ cls: 'sh-board-head' });
		head.createSpan({ cls: 'sh-board-label', text: 'Line of the day:' });

		/* A repertoire no note has written about has only its own title to go by,
       and nowhere to be opened. */
		const label = pick.path
			? pick.path.split('/').pop().replace(/\.md$/, '')
			: pick.title || pick.id;

		if (pick.path) {
			const source = head.createEl('a', {
				cls: 'sh-board-source',
				text: label,
				attr: { href: '#' },
			});
			source.addEventListener('click', (e) => {
				e.preventDefault();
				this.app.workspace.openLinkText(pick.path, '', false);
			});
		} else {
			head.createSpan({ cls: 'sh-board-source', text: label });
		}

		head.createDiv({ cls: 'sh-board-spacer' });

		const reroll = head.createEl('button', {
			cls: 'sh-board-reroll',
			attr: { 'aria-label': 'Draw a different line' },
		});
		setIcon(reroll, 'dices');
		reroll.addEventListener('click', async () => {
			await this.plugin.pickDailyBoard(true);
			this._revealed = false;
			this.renderBoard();
		});

		/* Nothing about the position is rendered until this is pressed — otherwise
       the answer is sitting on screen before the drill begins. */
		if (!this._revealed) {
			const cta = el.createEl('button', { cls: 'sh-board-cta' });
			const badge = cta.createSpan({ cls: 'sh-board-cta-icon' });
			setIcon(badge, 'crown');
			cta.createSpan({ text: this.s.learnLabel || 'Learn Chess Position' });
			cta.addEventListener('click', () => {
				this._revealed = true;
				this.renderBoard();
			});
			return;
		}

		const body = el.createDiv({ cls: 'sh-board-body' });
		const md = [
			'```chessRepertoire',
			`chessRepertoireId: ${pick.id}`,
			`boardSize: ${this.s.boardSize}`,
			'```',
		].join('\n');

		/* Only used to resolve links out of the block; the repertoire file stands
       in when no note embeds this line. */
		const sourcePath = pick.path || pick.file || '';

		try {
			if (typeof MarkdownRenderer.render === 'function') {
				await MarkdownRenderer.render(this.app, md, body, sourcePath, this);
			} else {
				await MarkdownRenderer.renderMarkdown(md, body, sourcePath, this);
			}
		} catch (err) {
			console.error('Sleek Home: could not render the daily board', err);
			body.createDiv({
				cls: 'sh-board-empty',
				text: 'That board failed to render.',
			});
			return;
		}

		if (this.s.autoStudy) this.startStudy(body);
	}

	/* The Train button only exists once the board's React tree has mounted, and
     the plugin loads its data asynchronously, so wait for it to turn up. */
	startStudy(scope) {
		const deadline = Date.now() + 6000;
		const tick = () => {
			if (this._closed) return;
			const btn = scope.querySelector(TRAIN_BUTTON);
			if (btn) {
				if (btn.getAttribute('aria-pressed') !== 'true') btn.click();
				return;
			}
			if (Date.now() < deadline) setTimeout(tick, 120);
		};
		setTimeout(tick, 150);
	}

	focusSearch() {
		if (this.inputEl) {
			this.inputEl.focus();
			this.inputEl.select();
		}
	}
}

/* ------------------------------------------------------------------ plugin */

module.exports = class SleekHomePlugin extends Plugin {
	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE, (leaf) => new SleekHomeView(leaf, this));

		this.addRibbonIcon('home', 'Open home', () => this.activateView());

		this.addCommand({
			id: 'open',
			name: 'Open home',
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: 'focus-search',
			name: 'Open home and focus search',
			callback: async () => {
				const view = await this.activateView();
				if (view) view.focusSearch();
			},
		});

		this.addSettingTab(new SleekHomeSettingTab(this.app, this));

		this.applyHeaderClass();

		this.registerEvent(
			this.app.workspace.on('layout-change', () => this.replaceEmptyLeaves())
		);

		this.app.workspace.onLayoutReady(async () => {
			if (this.settings.openOnStartup) {
				const view = await this.activateView();
				if (view && this.settings.closeOtherTabsOnStartup)
					this.closeOtherRootTabs(view.leaf);
			}
			this.replaceEmptyLeaves();
		});
	}

	onunload() {
		document.body.removeClass('sleek-home-hide-header');
	}

	async loadSettings() {
		const saved = (await this.loadData()) || {};
		this.settings = Object.assign({}, DEFAULTS, saved);
		if (!Array.isArray(this.settings.quickButtons))
			this.settings.quickButtons = DEFAULT_QUICK;
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.applyHeaderClass();
		this.refreshViews();
	}

	applyHeaderClass() {
		document.body.toggleClass(
			'sleek-home-hide-header',
			!!this.settings.hideHeader
		);
	}

	refreshViews() {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			if (leaf.view instanceof SleekHomeView) {
				leaf.view.render();
				leaf.updateHeader && leaf.updateHeader();
			}
		}
	}

	async activateView() {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE);
		if (existing.length) {
			this.app.workspace.revealLeaf(existing[0]);
			return existing[0].view;
		}
		const leaf = this.app.workspace.getLeaf(true);
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
		return leaf.view;
	}

	closeOtherRootTabs(keep) {
		const doomed = [];
		this.app.workspace.iterateRootLeaves((leaf) => {
			if (leaf !== keep) doomed.push(leaf);
		});
		for (const leaf of doomed) leaf.detach();
	}

	replaceEmptyLeaves() {
		if (!this.settings.replaceNewTabs || this._replacing) return;
		const empties = this.app.workspace.getLeavesOfType('empty');
		if (!empties.length) return;
		this._replacing = true;
		Promise.all(
			empties.map((leaf) => leaf.setViewState({ type: VIEW_TYPE }))
		).finally(() => {
			this._replacing = false;
		});
	}

	/* The vault folder Chess Repertoire keeps its repertoires in.
     Since that plugin's 1.3.0 the folder is one of its settings, so it is asked
     for rather than assumed: `storagePath` is the folder in force right now,
     the setting behind it is the fallback, and a plugin too old to have either
     still keeps its files inside its own folder. */
	chessStorageFolder() {
		const chess = this.app.plugins.getPlugin(CHESS_PLUGIN_ID);
		if (!chess) return null;

		if (typeof chess.storagePath === 'string' && chess.storagePath.trim())
			return normalizePath(chess.storagePath.trim());

		if (chess.settings && typeof chess.settings.storageFolder === 'string')
			return normalizePath(
				chess.settings.storageFolder.trim() || CHESS_FOLDER_FALLBACK
			);

		return normalizePath(
			`${this.app.vault.configDir}/plugins/${CHESS_PLUGIN_ID}/storage`
		);
	}

	/* Every repertoire on disk, with the note that embeds it where there is one.
     The folder is the source of truth rather than the notes: a repertoire is a
     file there whether or not a block anywhere points at it, and an id in a
     block whose file has gone is not a line that can be drawn. */
	async scanBoards() {
		const folder = this.chessStorageFolder();
		if (!folder) return [];

		const adapter = this.app.vault.adapter;

		let listing;
		try {
			if (!(await adapter.exists(folder))) return [];
			listing = await adapter.list(folder);
		} catch (err) {
			console.error(`Sleek Home: could not read "${folder}"`, err);
			return [];
		}

		const notes = await this.scanNotes();
		const boards = [];

		for (const file of listing.files) {
			if (!file.endsWith('.json') || file.endsWith(DRILL_SUFFIX)) continue;

			const board = await this.readBoard(file);

			/* A repertoire with no moves in it is a board with nothing to learn,
         and every folder collects a few: one is created the moment a block is
         inserted, and the ones never filled in stay behind. */
			if (!board) continue;

			boards.push({ ...board, path: notes.get(board.id) || null });
		}

		return boards;
	}

	/* One repertoire file, or nothing when it cannot be read or holds no moves.
     Unreadable is not worth reporting: the plugin says so itself, loudly, the
     moment such a line is drawn. */
	async readBoard(file) {
		const id = file
			.split('/')
			.pop()
			.replace(/\.json$/, '');

		let data;
		try {
			data = JSON.parse(await this.app.vault.adapter.read(file));
		} catch (err) {
			return null;
		}

		if (!data || typeof data !== 'object') return null;

		const moves = Array.isArray(data.moves) ? data.moves.length : 0;
		const roots = Array.isArray(data.rootVariants) ? data.rootVariants.length : 0;
		if (!moves && !roots) return null;

		const title = data.header && data.header.title;

		return {
			id,
			file,
			title: typeof title === 'string' && title.trim() ? title.trim() : null,
		};
	}

	/* Which note embeds each repertoire, so a drawn line can be opened where it
     was written about. The metadata cache tells us which files have code blocks
     at all, so most of the vault never gets read. */
	async scanNotes() {
		const notes = new Map();

		for (const file of this.app.vault.getMarkdownFiles()) {
			const cache = this.app.metadataCache.getFileCache(file);
			if (
				cache &&
				cache.sections &&
				!cache.sections.some((sec) => sec.type === 'code')
			)
				continue;

			const text = await this.app.vault.cachedRead(file);
			if (!text.includes('chessRepertoireId')) continue;

			BOARD_FENCE.lastIndex = 0;
			let match;
			while ((match = BOARD_FENCE.exec(text)) !== null) {
				const id = (match[1].match(/chessRepertoireId:\s*(\S+)/) || [])[1];
				if (id && !notes.has(id)) notes.set(id, file.path);
			}
		}
		return notes;
	}

	/* Whether a draw still has a file behind it. Cheaper than a rescan, which is
     the point: this runs on every render of the home tab. */
	async boardExists(pick) {
		const folder = this.chessStorageFolder();
		const file = pick.file || (folder ? `${folder}/${pick.id}.json` : null);
		if (!file) return false;

		try {
			return await this.app.vault.adapter.exists(file);
		} catch (err) {
			return false;
		}
	}

	async pickDailyBoard(force) {
		const today = new Date().toLocaleDateString('en-CA');
		const current = this.settings.dailyBoard;

		/* Today's draw stands only while its file is still there. Repertoires get
       deleted, and moving the folder used to strand every id we had cached; a
       stale one renders as the plugin's error rather than as a board. */
		if (!force && current && current.date === today && current.id) {
			if (await this.boardExists(current)) return current;
		}

		const boards = await this.scanBoards();
		if (!boards.length) return null;

		/* Don't hand back the same line two draws running. */
		let pool = boards;
		if (current && current.id && boards.length > 1) {
			pool = boards.filter((b) => b.id !== current.id);
		}

		const pick = pool[Math.floor(Math.random() * pool.length)];
		this.settings.dailyBoard = {
			date: today,
			id: pick.id,
			file: pick.file,
			path: pick.path,
			title: pick.title,
		};
		await this.saveData(this.settings);
		return this.settings.dailyBoard;
	}

	resolveBackground() {
		const v = (this.settings.background || '').trim();
		if (!v) return null;
		if (/^(https?:|app:|data:|file:)/i.test(v)) return v;
		const file = this.app.vault.getAbstractFileByPath(v);
		if (file instanceof TFile)
			return this.app.vault.adapter.getResourcePath(file.path);
		return null;
	}

	runCommand(id) {
		const ok = this.app.commands.executeCommandById(id);
		if (!ok) new Notice(`Sleek Home: no command "${id}"`);
	}

	async createNote() {
		try {
			const parent = this.app.fileManager.getNewFileParent('');
			const file = await this.app.fileManager.createNewMarkdownFile(
				parent,
				'Untitled'
			);
			await this.app.workspace.getLeaf(false).openFile(file);
		} catch (err) {
			console.error('Sleek Home: falling back to core new-file command', err);
			if (!this.app.commands.executeCommandById('file-explorer:new-file')) {
				new Notice('Sleek Home: could not create a note');
			}
		}
	}
};

/* ---------------------------------------------------------------- settings */

class SleekHomeSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		const s = this.plugin.settings;
		containerEl.empty();

		const set = async (key, value) => {
			s[key] = value;
			await this.plugin.saveSettings();
		};

		new Setting(containerEl).setName('Behaviour').setHeading();

		new Setting(containerEl)
			.setName('Open on startup')
			.setDesc('Show the home tab when the vault opens.')
			.addToggle((t) =>
				t.setValue(s.openOnStartup).onChange((v) => set('openOnStartup', v))
			);

		new Setting(containerEl)
			.setName('Close every other tab on startup')
			.setDesc('Open the vault on a single home tab.')
			.addToggle((t) =>
				t
					.setValue(s.closeOtherTabsOnStartup)
					.onChange((v) => set('closeOtherTabsOnStartup', v))
			);

		new Setting(containerEl)
			.setName('Replace new tabs')
			.setDesc(
				'Every empty tab becomes the home view instead of the default new-tab page.'
			)
			.addToggle((t) =>
				t.setValue(s.replaceNewTabs).onChange((v) => set('replaceNewTabs', v))
			);

		new Setting(containerEl)
			.setName('Hide the tab header')
			.setDesc('Fully immersive — no view header above the wallpaper.')
			.addToggle((t) =>
				t.setValue(s.hideHeader).onChange((v) => set('hideHeader', v))
			);

		new Setting(containerEl).setName('Tab title').addText((t) =>
			t
				.setPlaceholder('Home')
				.setValue(s.tabTitle)
				.onChange((v) => set('tabTitle', v))
		);

		new Setting(containerEl).setName('Background').setHeading();

		new Setting(containerEl)
			.setName('Image')
			.setDesc(
				'Vault path (e.g. attachments/wall.jpg) or an https:// URL. Leave empty for pure black.'
			)
			.addText((t) =>
				t
					.setPlaceholder('attachments/wall.jpg')
					.setValue(s.background)
					.onChange((v) => set('background', v))
			);

		new Setting(containerEl)
			.setName('Darkening')
			.setDesc('How much black is laid over the image.')
			.addSlider((sl) =>
				sl
					.setLimits(0, 1, 0.05)
					.setValue(s.bgDim)
					.setDynamicTooltip()
					.onChange((v) => set('bgDim', v))
			);

		new Setting(containerEl)
			.setName('Blur')
			.setDesc('Pixels of blur on the image.')
			.addSlider((sl) =>
				sl
					.setLimits(0, 40, 1)
					.setValue(s.bgBlur)
					.setDynamicTooltip()
					.onChange((v) => set('bgBlur', v))
			);

		new Setting(containerEl).setName('Hero').setHeading();

		new Setting(containerEl)
			.setName('Distance from the top')
			.setDesc(
				'How far down the hero sits, as a percentage of the pane height. Lower leaves more room below.'
			)
			.addSlider((sl) =>
				sl
					.setLimits(0, 45, 1)
					.setValue(s.topOffset)
					.setDynamicTooltip()
					.onChange((v) => set('topOffset', v))
			);

		new Setting(containerEl)
			.setName('Show the Obsidian mark')
			.addToggle((t) =>
				t.setValue(s.showLogo).onChange((v) => set('showLogo', v))
			);

		new Setting(containerEl)
			.setName('Show the wordmark')
			.addToggle((t) =>
				t.setValue(s.showWordmark).onChange((v) => set('showWordmark', v))
			);

		new Setting(containerEl)
			.setName('Wordmark text')
			.setDesc('Leave empty to use the vault name.')
			.addText((t) =>
				t
					.setPlaceholder(this.app.vault.getName())
					.setValue(s.wordmark)
					.onChange((v) => set('wordmark', v))
			);

		new Setting(containerEl)
			.setName('Accent colour')
			.setDesc('Focus glow. Leave empty to follow the theme accent.')
			.addText((t) =>
				t
					.setPlaceholder('#8b5cf6')
					.setValue(s.accent)
					.onChange((v) => set('accent', v))
			);

		new Setting(containerEl).setName('Line of the day').setHeading();

		new Setting(containerEl)
			.setName('Show a daily board')
			.setDesc(
				"Draws one line from the Chess Repertoire plugin's folder each day and puts it below the hero."
			)
			.addToggle((t) =>
				t.setValue(s.showBoard).onChange((v) => set('showBoard', v))
			);

		new Setting(containerEl).setName('Board size').addSlider((sl) =>
			sl
				.setLimits(280, 900, 20)
				.setValue(s.boardSize)
				.setDynamicTooltip()
				.onChange((v) => set('boardSize', v))
		);

		new Setting(containerEl).setName('Reveal button label').addText((t) =>
			t
				.setPlaceholder('Learn Chess Position')
				.setValue(s.learnLabel)
				.onChange((v) => set('learnLabel', v))
		);

		new Setting(containerEl)
			.setName('Start in study mode')
			.setDesc("Presses the repertoire's Train button once the board has mounted.")
			.addToggle((t) =>
				t.setValue(s.autoStudy).onChange((v) => set('autoStudy', v))
			);

		new Setting(containerEl)
			.setName('Draw a new line now')
			.setDesc(
				s.dailyBoard && s.dailyBoard.id
					? `Currently showing ${
							s.dailyBoard.path || s.dailyBoard.title || s.dailyBoard.id
					  } (drawn ${s.dailyBoard.date}).`
					: 'Nothing drawn yet.'
			)
			.addButton((b) =>
				b.setButtonText('Redraw').onClick(async () => {
					await this.plugin.pickDailyBoard(true);
					this.plugin.refreshViews();
					this.display();
				})
			);

		new Setting(containerEl).setName('Search bar').setHeading();

		new Setting(containerEl).setName('Placeholder').addText((t) =>
			t
				.setPlaceholder('Search or command')
				.setValue(s.placeholder)
				.onChange((v) => set('placeholder', v))
		);

		new Setting(containerEl)
			.setName('Command prefix')
			.setDesc('Type this at the start of a query to search commands instead.')
			.addText((t) =>
				t
					.setPlaceholder(DEFAULT_COMMAND_PREFIX)
					.setValue(s.commandPrefix)
					.onChange((v) => set('commandPrefix', v || DEFAULT_COMMAND_PREFIX))
			);

		new Setting(containerEl)
			.setName('What a bare query searches')
			.setDesc(`Without the ${s.commandPrefix || DEFAULT_COMMAND_PREFIX} prefix.`)
			.addDropdown((d) =>
				d
					.addOptions({
						all: 'Notes and commands',
						notes: 'Notes only',
						commands: 'Commands only',
					})
					.setValue(s.searchScope)
					.onChange((v) => set('searchScope', v))
			);

		new Setting(containerEl).setName('Result count').addSlider((sl) =>
			sl
				.setLimits(3, 20, 1)
				.setValue(s.maxResults)
				.setDynamicTooltip()
				.onChange((v) => set('maxResults', v))
		);

		new Setting(containerEl).setName('Buttons').setHeading();

		new Setting(containerEl)
			.setName('Show the New note button')
			.addToggle((t) =>
				t.setValue(s.showNewNote).onChange((v) => set('showNewNote', v))
			);

		new Setting(containerEl).setName('New note label').addText((t) =>
			t
				.setPlaceholder('New note')
				.setValue(s.newNoteLabel)
				.onChange((v) => set('newNoteLabel', v))
		);

		new Setting(containerEl)
			.setName('Quick buttons')
			.setDesc(
				'One per line: icon | command-id | tooltip. Icon names come from lucide.dev.'
			)
			.addTextArea((t) => {
				t.inputEl.rows = 6;
				t.inputEl.addClass('sleek-home-textarea');
				t.setValue(
					s.quickButtons
						.map((q) => [q.icon, q.command, q.label].join(' | '))
						.join('\n')
				);
				t.onChange((v) => {
					const parsed = v
						.split('\n')
						.map((line) => line.split('|').map((p) => p.trim()))
						.filter((p) => p.length >= 2 && p[1])
						.map((p) => ({ icon: p[0], command: p[1], label: p[2] || p[1] }));
					set('quickButtons', parsed);
				});
			});
	}
}
