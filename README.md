# 🐣 huddy

**Tamagotchi-style CLI companion for Claude Code**

[![npm](https://img.shields.io/npm/v/@7apislaz/huddy)](https://www.npmjs.com/package/@7apislaz/huddy)
[![CI](https://github.com/7apislaz/huddy/actions/workflows/ci.yml/badge.svg)](https://github.com/7apislaz/huddy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Your coding buddy lives in the Claude Code statusline — reacting to your context usage, celebrating successes, and getting sleepy when things get heavy.

![huddy demo](docs/demo/demo.gif)

---

## Requirements

- [Claude Code](https://claude.ai/code) installed
- Node.js >= 18

---

## Quick Start

```bash
npm i -g @7apislaz/huddy
huddy setup
```

Restart Claude Code — your buddy appears on the statusline!

---

## Characters

### 🌟 Brand Mascot

Meet **Peekcat** — huddy's signature character. Always hiding behind the wall, only the ears stay visible no matter what mood it's in. Default character for new installs.

```
   · ✦      
            
   ∧   ∧    
  (ㅇㅅㅇ)  
 ∪━━━━━━━∪  
   Peekcat
  (peekcat) — RARE
```

### 😺 12 More Friends

```
    __          /\_/\      .----.      .---.      (\ /)
 __(° >        ( ° ° )    ( °  ° )    ( ° ° )     ( ° °)
(  ._>  )       ( ω )     (  ω   )    >( ω )<     ( ω  )
 \__)--´        /| |\~     `----´      (___) ~    (  uu)~
  ~~~~         (_)_(_)                 _|_|_       ~~~~
  Quacky       Whiskers     Blobby     Waddle       Bun
  (duck)        (cat)       (blob)    (penguin)   (rabbit)

  /\  /\       .----.       .----.     /^\ ~    }~ .----. {
 (( °° ))     ( ° ° )      ( ° ° )   ( °  ° )     ( °  ° )
  ( >< )       ( ω )        ( ω )     ( ~~ )       ( ω  )
  /|  |\      /\/\/\/\     (      )  /\/vvv\/\    /`----´\
  \|__|/       ~~  ~~~    ~`~ ~`~ ~               ~~  ~~~~
   Hoot         Inky         Boo       Ember        Axie
   (owl)      (octopus)    (ghost)    (dragon)    (axolotl)

 q .--. p     (°) (°)
( °  w °)    ( °  w °)
 (     )~   >( _____ )<
  \____/      ( u_u )
  /|  |\        \___/
  Biscuit       Mochi
  (dog)       (hamster)
```

---

## Commands

### Setup

```bash
huddy setup
```

Registers huddy as the Claude Code statusline provider. Restart Claude Code after running.

---

### Pick your character

```bash
huddy select               # Browse all 13 characters with preview
huddy select peekcat       # Directly select a character
```

Available: `peekcat` `duck` `cat` `blob` `penguin` `rabbit` `dog` `hamster` `owl` `octopus` `ghost` `dragon` `axolotl`

---

### Random roll

```bash
huddy random
```

Randomly picks a character + color. **20% chance for rainbow** — every line gets a different color!

```
✦ Ember + 🌈 RAINBOW!
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

---

### Rename your buddy

```bash
huddy rename "Spark"    # Give your buddy a new name
```

---

### Reset state

```bash
huddy reset    # Reset happiness and counters back to defaults
```

Available colors: `red` `green` `yellow` `blue` `magenta` `cyan` `white`

Settings are saved in `~/.huddy/config.json`.

---

### Buddy info & stats

```bash
huddy info     # Show current buddy with RPG stats and happiness bar
huddy stats    # Show lifetime stats (sessions, successes, errors, first seen)
```

---

### Toggle HUD

```bash
huddy hud      # Toggle HUD on/off
```

---

### Feed your buddy

```bash
huddy feed     # Give a snack — happiness +15!
```

Happiness decays over time (−2/hr, max −20). Keep your buddy happy!

---

## HUD

Stats appear **to the right of the buddy art** on the statusline:

```
}~ .----. {    huddy#0.2.2
 ( °  ° )     ctx:45%  ses:42m
  ( ω  )      5h:12% (3h20m)  7d:5%
 /`----´\     Axie ♥85
 ~~  ~~~~
```

| Field | Description |
|-------|-------------|
| **ctx** | Context window usage — green → yellow at 70% → red at 85% |
| **ses** | How long the current session has been running |
| **5h / 7d** | Rate limit usage with time until reset |
| **name ♥** | Buddy name + happiness (0–100) — green → yellow at 40 → red below |

Toggle the HUD on/off with `huddy hud`, or use `huddy config set hud off` to disable.

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
| **working** | Active tool calls detected (last 3 min) |
| **happy** | Tool success, commits |
| **excited** | 5+ consecutive successes |
| **sad** | Errors, failures |
| **tired** | Context > 60% usage |

---

## Slash Commands (Claude Code)

Copy command files to use slash commands inside Claude Code:

```bash
mkdir -p ~/.claude/commands
cp $(npm root -g)/@7apislaz/huddy/docs/commands/*.md ~/.claude/commands/
```

| Command | Description |
|---------|-------------|
| `/huddy` | Register buddy on statusline |
| `/huddy-select` | Browse & pick character |
| `/huddy-select cat` | Directly select a character |
| `/huddy-random` | Random roll (20% rainbow!) |
| `/huddy-feed` | Give your buddy a snack (happiness +15) |
| `/huddy-info` | Show buddy info with RPG stats |
| `/huddy-stats` | Show lifetime stats |
| `/huddy-rename Spark` | Rename your buddy |
| `/huddy-reset` | Reset happiness & counters |
| `/huddy-hud` | Toggle HUD on/off |
| `/huddy-config show` | View all settings |
| `/huddy-config set color cyan` | Change a setting |
| `/huddy-lang ko` | Switch to Korean |
| `/huddy-lang en` | Switch to English |

---

## Use with oh-my-claudecode

Claude Code supports one statusline command. To run huddy alongside [oh-my-claudecode](https://github.com/7apislaz/oh-my-claudecode):

```bash
mkdir -p ~/.claude/hud
cp $(npm root -g)/@7apislaz/huddy/docs/wrapper/huddy-wrapper.mjs ~/.claude/hud/
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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
