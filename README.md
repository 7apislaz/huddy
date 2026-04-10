# 🐣 huddy

**Tamagotchi-style CLI companion for Claude Code**

Your coding buddy lives in the Claude Code statusline — reacting to your context usage, celebrating successes, and getting sleepy when things get heavy.

## Quick Start

```bash
npm i -g huddy
huddy setup
```

Restart Claude Code and your buddy appears on the statusline!

---

## Characters

Pick from 10 unique buddies:

```
    __         /\_/\       .----.      .---.      (\ /)
 __(° >        ( ° ° )    ( °  ° )    ( ° ° )    ( ° °)
(  ._>  )       ( ω )     (  ω   )   >( ω )<     ( ω  )
 \__)--´        /| |\~     `----´      (___) ~    (  uu)~
  ~~~~         (_)_(_)                  _|_|_       ~~~~
  Quacky       Whiskers     Blobby      Waddle       Bun
  (duck)        (cat)        (blob)    (penguin)   (rabbit)

  /\  /\       .----.       .----.     /^\ ~     }~ .----. ~{
 (( °° ))     ( ° ° )      ( ° ° )   ( °  ° )    ( °  ° )
  ( >< )       ( ω )        ( ω )     ( ~~ )       ( ω  )
  /|  |\      /\/\/\/\     (      )  /\/vvv\/\    /`----´\
  \|__|/       ~~  ~~~    ~`~ ~`~ ~               ~~  ~~~~
   Hoot         Inky         Boo       Ember         Axie
   (owl)      (octopus)    (ghost)    (dragon)    (axolotl)
```

---

## Commands

### Setup

```bash
huddy setup
```
Register huddy with Claude Code statusline. Restart Claude Code after running.

---

### Pick your character

```bash
huddy select               # Browse all 10 characters with preview
huddy select cat           # Directly select a character
```

Available: `duck` `cat` `blob` `penguin` `rabbit` `owl` `octopus` `ghost` `dragon` `axolotl`

---

### Random roll 🎲

```bash
huddy random
```

Randomly picks a character + color. **20% chance for rainbow** 🌈 — every line gets a different color!

```
✦ Ember + 🌈 RAINBOW 뽑음!
```

---

### Configuration

```bash
huddy config show                    # View all settings
huddy config set character dragon    # Change character
huddy config set name "Ember"        # Rename your buddy
huddy config set color cyan          # Change color
huddy config set hud off             # Hide the HUD line
huddy config set lang ko             # Switch to Korean
huddy config set lang en             # Switch to English (default)
```

Available colors: `red` `green` `yellow` `blue` `magenta` `cyan` `white`

Settings are saved in `~/.huddy/config.json`.

---

### Buddy info

```bash
huddy info     # Show current buddy name, stats
```

---

## Slash Commands (Claude Code)

Copy command files to `~/.claude/commands/` to use slash commands:

```bash
mkdir -p ~/.claude/commands
cp $(npm root -g)/huddy/docs/commands/*.md ~/.claude/commands/
```

| Command | Description |
|---------|-------------|
| `/huddy` | Register buddy on statusline |
| `/huddy-select` | Browse & pick character |
| `/huddy-select cat` | Directly select a character |
| `/huddy-random` | Random roll (20% rainbow!) |
| `/huddy-lang ko` | Switch to Korean |
| `/huddy-lang en` | Switch to English |

---

## HUD

The HUD line shows usage stats with color coding:

```
ctx: 45% | 5h: 12% (3h20m) | 7d: 8% | session: 42m
```

- **ctx** — context window usage (green → yellow at 70% → red at 85%)
- **5h / 7d** — rate limit usage with time until reset
- **session** — how long the current session has been running

Hide the HUD with `huddy config set hud off`.

---

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

### Emotions

| Emotion | Trigger |
|---------|---------|
| **idle** | Default state |
| **happy** | Tool success, commits |
| **sad** | Errors, failures |
| **tired** | Context > 60% usage |

---

## Use with OMC HUD

Claude Code supports one statusline command. To run huddy alongside [oh-my-claudecode](https://github.com/7apislaz/oh-my-claudecode):

```bash
cp docs/wrapper/huddy-wrapper.mjs ~/.claude/hud/
```

Update `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ${CLAUDE_CONFIG_DIR:-$HOME/.claude}/hud/huddy-wrapper.mjs"
  }
}
```

---

## Install from Source

```bash
git clone https://github.com/7apislaz/huddy.git
cd huddy
npm install && npm run build
npm link
huddy setup
```

---

## License

MIT
