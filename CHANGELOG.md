# Changelog

All notable changes to huddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.6] - 2026-04-15

### Added
- **Slash commands** — `/huddy-info`, `/huddy-stats`, `/huddy-rename`, `/huddy-reset`, `/huddy-hud`, `/huddy-config` 슬래시 커맨드 추가
- **Distribution docs** — `docs/commands/`에 모든 슬래시 커맨드 문서 포함 (npm 설치 후 `cp` 명령으로 일괄 등록 가능)

### Fixed
- `docs/commands/`에 `huddy-feed.md`만 포함되던 문제 수정 — 이제 전체 12개 커맨드 문서 배포

## [0.2.2] - 2026-04-12

### Added
- **New emotion: `excited`** — triggers at 5+ consecutive successes (distinct from `happy`); all 12 characters have dedicated frames with star eyes `★`, sparkles `✦`, and max tail/energy
- **New character: Biscuit (dog)** — floppy `q`/`p` ears, `w` nose, tongue `J` on happy/excited, wagging `~` tail; loyal and energetic
- **New character: Mochi (hamster)** — iconic `>( )<` cheek pouches, sitting front pose, round `(°)(°)` ears, arms up on happy; curls into a ball when tired

### Changed
- **HUD layout** — `ctx` and `ses` combined on one line; `5h` and `7d` combined on one line (6 lines → 4 lines); `session:` label shortened to `ses:`
- **`huddy setup`** — now displays a character preview immediately after registering, before the restart prompt

### Added (commands)
- **`huddy hud`** — toggle HUD on/off with a single command (previously required `huddy config set hud off/on`)

## [0.2.0] - 2026-04-12

### Added
- **Tamagotchi persistence** — happiness, consecutive error/success counters saved in `~/.huddy/state.json` across sessions
- **Reunion detection** — happy reaction when returning after 6+ hours away
- **State-based emotion triggers** — low happiness (<25) → sad, 5+ consecutive successes → high-intensity happy, 5+ consecutive errors → max-intensity sad
- **Custom character plugin** — add characters via `~/.huddy/characters/*.json`
- Duplicate event prevention (`lastProcessedAt` tracking)

## [0.1.0] - 2026-04-12

### Added
- 10 characters: duck, cat, blob, penguin, rabbit, owl, octopus, ghost, dragon, axolotl
- Emotion system: idle, happy, sad, tired (reacts to context usage and tool results)
- HUD statusline: context %, rate limit usage (5h/7d), session duration
- `huddy setup` — register as Claude Code statusline provider
- `huddy select [character]` — browse or directly pick a character
- `huddy random` — random character + color roll with 20% rainbow chance
- `huddy config` — show/set character, name, color, HUD visibility, language
- `huddy info` — display current buddy stats
- Korean/English i18n support (`huddy config set lang ko/en`)
- Slash command files for Claude Code (`/huddy`, `/huddy-select`, `/huddy-random`, `/huddy-lang`)
- OMC HUD wrapper for running alongside oh-my-claudecode
- Version display in HUD
