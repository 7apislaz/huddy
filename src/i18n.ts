type Lang = 'ko' | 'en';

const messages = {
  // setup
  setup_done: {
    ko: '✓ Claude Code statusline에 huddy가 등록되었습니다.',
    en: '✓ huddy registered with Claude Code statusline.',
  },
  setup_restart: {
    ko: '  Claude Code를 재시작하면 버디가 나타납니다!',
    en: '  Restart Claude Code to see your buddy!',
  },

  // config
  config_usage: {
    ko: '사용법: huddy config show | huddy config set <key> <value>',
    en: 'Usage: huddy config show | huddy config set <key> <value>',
  },
  config_keys: {
    ko: '키: character, name, color, hud, lang',
    en: 'Keys: character, name, color, hud, lang',
  },

  // select
  select_prompt: {
    ko: '🎭 캐릭터를 선택하세요:\n',
    en: '🎭 Choose your character:\n',
  },
  select_current: {
    ko: ' ← 현재',
    en: ' ← current',
  },
  select_usage: {
    ko: '사용법: huddy select <species>',
    en: 'Usage: huddy select <species>',
  },
  select_example: {
    ko: '예시: huddy select cat',
    en: 'Example: huddy select cat',
  },
  select_not_found: {
    ko: (name: string, list: string) => `✗ '${name}' 캐릭터를 찾을 수 없습니다.\n  사용 가능: ${list}`,
    en: (name: string, list: string) => `✗ '${name}' not found.\n  Available: ${list}`,
  },
  select_done: {
    ko: (name: string) => `✓ ${name} 선택!`,
    en: (name: string) => `✓ ${name} selected!`,
  },

  // random
  random_result: {
    ko: (name: string, color: string) => `✦ ${name} + ${color} 뽑음!`,
    en: (name: string, color: string) => `✦ Got ${name} + ${color}!`,
  },

  // help
  help_title: {
    ko: 'huddy v0.1.0 — Claude Code용 Tamagotchi CLI 버디',
    en: 'huddy v0.1.0 — Tamagotchi CLI companion for Claude Code',
  },
  help_commands: {
    ko: '커맨드:',
    en: 'Commands:',
  },
  help_setup: {
    ko: '  huddy setup          Claude Code statusline에 등록',
    en: '  huddy setup          Register with Claude Code statusline',
  },
  help_select: {
    ko: '  huddy select         캐릭터 목록 보기',
    en: '  huddy select         Browse & pick your buddy character',
  },
  help_select_name: {
    ko: '  huddy select <name>  캐릭터 바로 선택',
    en: '  huddy select <name>  Directly select a character',
  },
  help_random: {
    ko: '  huddy random         랜덤 뽑기 (20% 무지개 당첨!)',
    en: '  huddy random         Random character + color (20% rainbow!)',
  },
  help_config_show: {
    ko: '  huddy config show    현재 설정 보기',
    en: '  huddy config show    Show current configuration',
  },
  help_config_set: {
    ko: '  huddy config set     설정 변경',
    en: '  huddy config set     Update a setting',
  },
  help_info: {
    ko: '  huddy info           버디 정보 보기',
    en: '  huddy info           Show buddy info and stats',
  },
} as const;

type MessageKey = keyof typeof messages;
type MessageValue<K extends MessageKey> = (typeof messages)[K]['ko'];

/** 언어에 맞는 메시지 반환 */
export function t<K extends MessageKey>(key: K, lang: Lang): MessageValue<K> {
  return messages[key][lang] as MessageValue<K>;
}
