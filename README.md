# 🐣 huddy

**Tamagotchi-style CLI companion for Claude Code**

Your coding buddy lives in the Claude Code statusline — reacting to your context usage, celebrating successes, and getting sleepy when things get heavy.

```
  /\_/\        .----.       /^\  ✦
 ( ° ° )      ( °  ° )     ( ^  ^ )
  ( ω )       (  ω   )      ( ▽▽ )>>~
  /| |\~       `----´      /\/vvv\/\
 (_)_(_)
 Whiskers      Blobby        Ember
```

## Features

- **10 Characters** — Duck, Cat, Blob, Penguin, Rabbit, Owl, Octopus, Ghost, Dragon, Axolotl
- **Rarity System** — Common / Uncommon / Rare
- **4 Emotions** — idle, happy (success), sad (error), tired (high context%)
- **RPG Stats** — Debugging, Patience, Chaos, Wisdom, Snark
- **HUD (optional)** — Context %, cost, rate limits on the statusline
- **Customization** — Pick your buddy, name, color
- **Zero dependencies** — Only 13KB, no external packages

## Quick Start

### Option 1: npm (Recommended)

```bash
npm i -g huddy
huddy setup
```

That's it! Restart Claude Code and your buddy appears.

### Option 2: npx (Try without installing)

```bash
npx huddy select    # Browse characters
npx huddy setup     # Register with Claude Code
```

### Option 3: From source

```bash
git clone https://github.com/7apislaz/huddy.git
cd huddy
npm install && npm run build
npm link
huddy setup
```

## Usage

### Pick your buddy

```bash
huddy select           # Browse all 10 characters
huddy select cat       # Pick a specific character
```

### Claude Code Slash Commands

If you copy the command files to `~/.claude/commands/`:

```
/huddy          — Register buddy on statusline
/huddy-select   — Pick your character
```

Setup slash commands:

```bash
mkdir -p ~/.claude/commands
cp docs/commands/*.md ~/.claude/commands/
```

### Use with OMC HUD (or other statusline tools)

Claude Code only supports one statusline command. To use huddy **alongside** OMC HUD or other tools, install the wrapper:

```bash
cp docs/wrapper/huddy-wrapper.mjs ~/.claude/hud/
chmod +x ~/.claude/hud/huddy-wrapper.mjs
```

Then update `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ${CLAUDE_CONFIG_DIR:-$HOME/.claude}/hud/huddy-wrapper.mjs"
  }
}
```

The wrapper runs huddy first (buddy + optional HUD), then your existing statusline tool. If huddy is not installed, it silently falls back to the existing tool only.

Toggle huddy's HUD line independently:

```bash
huddy config set hud off   # Show buddy only, keep OMC HUD
huddy config set hud on    # Show buddy + huddy HUD + OMC HUD
```

### Set your plan

```bash
huddy config set plan pro   # Pro / Max / Team / Enterprise / Free
```

This shows `[Pro]` or `[Max]` on the HUD and displays rate limits as **remaining** usage.

### Configuration

```bash
huddy config show                  # View current settings
huddy config set character owl     # Change character
huddy config set name "Hootie"     # Rename your buddy
huddy config set color cyan        # Change color
huddy config set hud off           # Hide HUD
huddy info                         # Show buddy stats
```

Settings are saved in `~/.huddy/config.json`.

## How It Works

huddy runs as a Claude Code [statusline provider](https://docs.anthropic.com/en/docs/claude-code/statusline):

```
Claude Code → statusline tick → stdin JSON
                                    ↓
huddy → parse context% / transcript → determine emotion
      → render ASCII art + HUD → stdout
                                    ↓
Claude Code → display on statusline
```

### Emotion Triggers

| Emotion | Trigger | Visual |
|---------|---------|--------|
| **idle** | Default state | Normal face, subtle animation |
| **happy** | Tool success, commits | `^` eyes, `▽` mouth, `♪` effects |
| **sad** | Errors, failures | `;` eyes, `﹏` mouth, `,` tears |
| **tired** | Context > 60% | `—` eyes, `zzZ` at > 80% |

## Characters

| Character | Rarity | Signature |
|-----------|--------|-----------|
| 🦆 Duck (Quacky) | Common | `__(° >` beak + tail |
| 🐱 Cat (Whiskers) | Common | `/\_/\` ears + `ω` mouth |
| 🟢 Blob (Blobby) | Common | `.----.` breathing animation |
| 🐧 Penguin (Waddle) | Common | `.---.` round body + `><` flippers |
| 🐰 Rabbit (Bun) | Common | `(\ /)` long ears |
| 🦉 Owl (Hoot) | Uncommon | `(( °° ))` big eyes |
| 🐙 Octopus (Inky) | Uncommon | `/\/\/\/\` tentacles |
| 👻 Ghost (Boo) | Uncommon | `` ~`~ ~`~ `` wavy bottom |
| 🐉 Dragon (Ember) | Rare | `/^\` horns + `>>~` fire |
| 🦎 Axolotl (Axie) | Rare | `}~{ ` gills |

## Roadmap

- **v0.2** — RPG stat-based dialogue / speech bubbles
- **v0.3** — Community characters, themes, growth system

## License

MIT
