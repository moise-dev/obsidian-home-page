<!-- omit in toc -->
# Home Page

A home tab for [Obsidian](https://obsidian.md/): pure black or your own wallpaper, a combined search-and-command bar, a New note button, and a chess line drawn fresh from your vault each day.

<!-- omit in toc -->
## Table of contents

- [The hero](#the-hero)
- [Search bar](#search-bar)
- [Line of the day](#line-of-the-day)
- [Startup behaviour](#startup-behaviour)
- [Installation](#installation)
- [Development](#development)
- [Settings](#settings)
- [License](#license)

## The hero

The Obsidian mark and a wordmark (your vault name by default), a search bar, and a New note button, sitting in the top slice of the pane. How far down they sit is a setting, so the rest of the pane is yours.

The background is pure black out of the box. Point it at an image in your vault or an `https://` URL and you get a wallpaper instead, with darkening and blur sliders.

## Search bar

One bar for two jobs. A bare query searches note names; prefix it with `!` and it searches commands instead. Both the prefix and what a bare query looks at are settings.

- `↑` / `↓` move through results, `↵` opens the selected one, `Esc` clears then blurs.
- An empty bar lists recently opened notes.

## Line of the day

If you use [Chess Repertoire](https://github.com/moise-dev/obsidian-chess-repertoire), the box below the hero draws one `chessRepertoireId` from your vault each day.

The board is not rendered until you press **Learn Chess Position**, and the source note's name stays hidden until then — otherwise the answer is on screen before the drill starts. Once revealed, the board mounts and its Train button is pressed for you, so you land straight in study mode.

The draw is stable for the calendar day and never repeats the previous line back to back. The dice button redraws immediately, and redrawing hides the board again.

Files with no code blocks are skipped using the metadata cache, so the scan does not read your whole vault.

## Startup behaviour

- **Open on startup** puts you on the home tab when the vault opens.
- **Close every other tab on startup** detaches everything else, so you always start on one clean tab.
- **Replace new tabs** turns every empty tab into the home view.

## Installation

Not in the community plugin list. Copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/sleek-home/`, then enable **Home Page** under Community plugins.

## Development

There is no build step. `main.js` is the source, written against the Obsidian API as plain CommonJS, so it is committed rather than generated — unlike a bundled plugin, where `main.js` belongs in releases and not in the repo.

```sh
npm run check                     # node --check main.js
npm run format                    # prettier
HOME_PAGE_VAULT_PLUGIN_DIR=<vault>/.obsidian/plugins/sleek-home npm run deploy
```

`deploy` copies `main.js`, `styles.css` and `manifest.json` into the vault. It leaves `data.json` alone: that is the install's own settings, including the line it drew today.

The plugin id is `sleek-home`, which is what the vault folder must be called. The repo and the display name are `Home Page`.

## Settings

| Group | What it covers |
| --- | --- |
| Behaviour | Open on startup, close other tabs, replace new tabs, hide the tab header, tab title |
| Background | Vault path or URL, darkening, blur |
| Hero | Distance from the top, mark and wordmark, wordmark text, accent colour |
| Line of the day | Show it, board size, reveal button label, start in study mode, redraw now |
| Search bar | Placeholder, command prefix, what a bare query searches, result count |
| Buttons | New note button and its label, quick buttons (`icon \| command-id \| tooltip`) |

Quick button icons are [lucide](https://lucide.dev/) names. Command ids are what you would pass to `executeCommandById` — `daily-notes`, `global-search:open`, `graph:open`, and so on.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
