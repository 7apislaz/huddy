import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { HuddyConfig } from './types.js';

const CONFIG_DIR = join(homedir(), '.huddy');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: HuddyConfig = {
  hudEnabled: true,
  lang: 'en',
};

/** ~/.huddy/config.json 로드. 없으면 기본값 반환. */
export function loadConfig(): HuddyConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/** ~/.huddy/config.json 저장 */
export function saveConfig(config: HuddyConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/** 설정값 하나 변경 */
export function updateConfig(key: string, value: string): HuddyConfig {
  const config = loadConfig();

  switch (key) {
    case 'character':
      config.character = value;
      break;
    case 'name':
      config.name = value;
      break;
    case 'color':
      config.color = value;
      break;
    case 'hud':
      config.hudEnabled = value !== 'off' && value !== 'false';
      break;
    case 'lang':
      config.lang = value === 'en' ? 'en' : 'ko';
      break;
    default:
      throw new Error(`Unknown config key: ${key}`);
  }

  saveConfig(config);
  return config;
}

/** ~/.claude/settings.json에 statusLine 등록 */
export function setupStatusline(): void {
  const claudeDir = join(homedir(), '.claude');
  const settingsPath = join(claudeDir, 'settings.json');

  let settings: Record<string, unknown> = {};

  // 기존 설정 읽기 + 백업
  if (existsSync(settingsPath)) {
    const raw = readFileSync(settingsPath, 'utf8');
    settings = JSON.parse(raw);
    // 백업 생성
    const backupPath = `${settingsPath}.bak.${Date.now()}`;
    writeFileSync(backupPath, raw, 'utf8');
  }

  // statusLine 설정 추가/업데이트
  settings.statusLine = {
    type: 'command',
    command: 'huddy',
    refreshInterval: 5,
  };

  mkdirSync(claudeDir, { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');

  // 슬래시 커맨드 설치
  installSlashCommands(claudeDir);
}

/** ~/.claude/commands/에 huddy 슬래시 커맨드 설치 */
function installSlashCommands(claudeDir: string): void {
  const commandsDir = join(claudeDir, 'commands');
  mkdirSync(commandsDir, { recursive: true });

  // 패키지의 docs/commands 디렉토리 경로 (dist/config.js 기준 ../docs/commands)
  const srcDir = fileURLToPath(new URL('../docs/commands', import.meta.url));

  if (!existsSync(srcDir)) return;

  for (const file of readdirSync(srcDir)) {
    if (!file.endsWith('.md')) continue;
    copyFileSync(join(srcDir, file), join(commandsDir, file));
  }
}
