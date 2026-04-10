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
- **4 Emotions** — idle, happy (success), sad (error), tired (high context%)
- **HUD** — Context %, rate limits, session duration with color coding
- **Random roll** — `huddy random` picks a character + color, 20% chance for rainbow
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

### Commands

```bash
huddy setup                # Register with Claude Code statusline
huddy select               # Browse all 10 characters
huddy select cat           # Pick a specific character
huddy random               # Random character + color (20% rainbow!)
huddy info                 # Show buddy info and stats
huddy config show          # View current settings
huddy config set character owl     # Change character
huddy config set name "Hootie"     # Rename your buddy
huddy config set color cyan        # Change color
huddy config set hud off           # Hide HUD
```

Settings are saved in `~/.huddy/config.json`.

### Claude Code Slash Commands

After `huddy setup`, copy the command files to get slash commands in Claude Code:

```bash
mkdir -p ~/.claude/commands
cp node_modules/huddy/docs/commands/*.md ~/.claude/commands/
# or if installed globally:
cp $(npm root -g)/huddy/docs/commands/*.md ~/.claude/commands/
```

Then use directly in Claude Code:

```
/huddy          — Register buddy on statusline
/huddy-select   — Pick your character
/huddy-random   — Random roll (20% rainbow!)
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

Toggle huddy's HUD line independently:

```bash
huddy config set hud off   # Show buddy only, keep OMC HUD
huddy config set hud on    # Show buddy + huddy HUD + OMC HUD
```

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

### HUD Display

The HUD shows usage with color coding (green → yellow → red):

```
ctx: 45% | 5h: 12% (3h20m) | 7d: 8% | session: 42m
```

### Emotion Triggers

| Emotion | Trigger | Visual |
|---------|---------|--------|
| **idle** | Default state | Normal face, subtle animation |
| **happy** | Tool success, commits | `^` eyes, `▽` mouth, `♪` effects |
| **sad** | Errors, failures | `;` eyes, `﹏` mouth, `,` tears |
| **tired** | Context > 60% | `—` eyes, `zzZ` at > 80% |

## Characters

| Character | Signature |
|-----------|-----------|
| 🦆 Duck (Quacky) | `__(° >` beak + tail |
| 🐱 Cat (Whiskers) | `/\_/\` ears + `ω` mouth |
| 🟢 Blob (Blobby) | `.----.` breathing animation |
| 🐧 Penguin (Waddle) | `.---.` round body + `><` flippers |
| 🐰 Rabbit (Bun) | `(\ /)` long ears |
| 🦉 Owl (Hoot) | `(( °° ))` big eyes |
| 🐙 Octopus (Inky) | `/\/\/\/\` tentacles |
| 👻 Ghost (Boo) | `` ~`~ ~`~ `` wavy bottom |
| 🐉 Dragon (Ember) | `/^\` horns + `>>~` fire |
| 🦎 Axolotl (Axie) | `}~{` gills |

## Roadmap

- **v0.2** — RPG stat-based dialogue / speech bubbles
- **v0.3** — Community characters, themes, growth system

## License

MIT
