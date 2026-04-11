# Changelog

All notable changes to huddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
