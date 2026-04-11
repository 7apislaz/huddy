import { readStdin, parseStdinJson, extractSessionId, stabilizeContextPercent } from './stdin.js';
import { loadConfig } from './config.js';
import { resolveBuddy } from './buddy.js';
import { resolveEmotion } from './emotion.js';
import { parseTranscript } from './transcript.js';
import { renderBuddy, renderBuddyInfo, renderCharacterPreview, renderSideBySide } from './render.js';
import { buildHUDLines } from './hud.js';
import { setupStatusline, updateConfig } from './config.js';
import { characters } from './characters/index.js';
import { loadPluginCharacters } from './plugin.js';
import { loadState, saveState, updateState } from './state.js';
import { t } from './i18n.js';
import { statSync } from 'node:fs';
import type { HUDData } from './types.js';

// 하드코딩된 최소 폴백 (어떤 에러에서도 stdout 보장)
const FALLBACK_ASCII = [
  '  (o_o)  ',
  '  /| |\\  ',
  '   | |   ',
  '  / | \\  ',
  ' ~~~~~~  ',
].join('\n');

/** 행복도 바 렌더링 (10칸) */
function happinessBar(happiness: number): string {
  const filled = Math.round(Math.max(0, Math.min(100, happiness)) / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

/** statusline 모드: stdin JSON → ASCII+HUD → stdout */
async function statuslineMode(): Promise<void> {
  const raw = await readStdin();
  const input = parseStdinJson(raw);
  const config = loadConfig();
  const sessionId = extractSessionId(input);

  // 버디 결정
  const buddy = resolveBuddy(sessionId, config);

  // 감정 결정
  const contextPercent = stabilizeContextPercent(input.context_window?.used_percentage);
  const events = input.transcript_path ? parseTranscript(input.transcript_path) : [];

  // 지속 상태 로드 → 업데이트 → 저장
  const prevState = loadState();
  const state = updateState(prevState, events);
  saveState(state);

  const emotion = resolveEmotion(contextPercent, events, state);

  // 렌더링
  const buddyArt = renderBuddy(buddy, emotion);

  // HUD 데이터 조립
  const hudData: HUDData = {
    contextPercent: input.context_window?.used_percentage ?? null,
    rateLimit5h: input.rate_limits?.five_hour
      ? {
          percent: input.rate_limits.five_hour.used_percentage ?? 0,
          resetsAt: input.rate_limits.five_hour.resets_at
            ? new Date(input.rate_limits.five_hour.resets_at * 1000)
            : null,
        }
      : null,
    rateLimit7d: input.rate_limits?.seven_day
      ? {
          percent: input.rate_limits.seven_day.used_percentage ?? 0,
          resetsAt: input.rate_limits.seven_day.resets_at
            ? new Date(input.rate_limits.seven_day.resets_at * 1000)
            : null,
        }
      : null,
    sessionDurationMs: getSessionDuration(input.transcript_path),
    happiness: state.happiness,
  };

  // stdout 출력 — 버디 아트 좌측 + HUD 정보 우측 side-by-side
  const artLines = buddyArt.split('\n');
  const hudLines = buildHUDLines(hudData, config);
  if (hudLines.length > 0) {
    console.log(renderSideBySide(artLines, hudLines));
  } else {
    console.log(buddyArt);
  }
}

/** transcript_path의 birthtime으로 세션 지속 시간 추정 */
function getSessionDuration(transcriptPath?: string): number {
  if (!transcriptPath) return 0;
  try {
    const stat = statSync(transcriptPath);
    return Date.now() - stat.birthtimeMs;
  } catch {
    return 0;
  }
}

/** CLI 서브커맨드 처리 */
function handleCli(args: string[]): void {
  const cmd = args[0];
  const lang = loadConfig().lang;

  switch (cmd) {
    case 'setup':
      setupStatusline();
      console.log(t('setup_done', lang));
      console.log(t('setup_restart', lang));
      break;

    case 'config': {
      const sub = args[1];
      if (sub === 'show') {
        console.log(JSON.stringify(loadConfig(), null, 2));
      } else if (sub === 'set' && args[2] && args[3]) {
        updateConfig(args[2], args[3]);
        console.log(`✓ ${args[2]} = ${args[3]}`);
        console.log(JSON.stringify(loadConfig(), null, 2));
      } else {
        console.log(t('config_usage', lang));
        console.log(t('config_keys', lang));
      }
      break;
    }

    case 'select': {
      const filter = args[1];
      if (filter) {
        const found = characters.find((c) => c.species === filter);
        if (!found) {
          const list = characters.map((c) => c.species).join(', ');
          console.log(t('select_not_found', lang)(filter, list));
          break;
        }
        updateConfig('character', filter);
        console.log(t('select_done', lang)(found.displayName));
        console.log(renderCharacterPreview(found));
        break;
      }
      const currentConfig = loadConfig();
      console.log(t('select_prompt', lang));
      for (const char of characters) {
        const isCurrent = currentConfig.character === char.species;
        const marker = isCurrent ? t('select_current', lang) : '';
        console.log(renderCharacterPreview(char) + marker);
        console.log('');
      }
      console.log(t('select_usage', lang));
      console.log(t('select_example', lang));
      break;
    }

    case 'random': {
      const COLORS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
      const picked = characters[Math.floor(Math.random() * characters.length)];
      const isRainbow = Math.random() < 0.2;
      const color = isRainbow ? 'rainbow' : COLORS[Math.floor(Math.random() * COLORS.length)];

      updateConfig('character', picked.species);
      updateConfig('color', color);

      const colorLabel = isRainbow ? '🌈 RAINBOW' : color;
      console.log(t('random_result', lang)(picked.displayName, colorLabel));
      console.log(renderCharacterPreview(picked, color));
      break;
    }

    case 'info': {
      const config = loadConfig();
      const buddy = resolveBuddy('preview', config);
      const state = loadState();
      const preview = renderCharacterPreview(buddy.character, buddy.color);
      const [header, ...artLines] = preview.split('\n');
      const bar = happinessBar(state.happiness);
      const infoLines = [
        `DBG:${buddy.stats.debugging} PAT:${buddy.stats.patience} CHS:${buddy.stats.chaos}`,
        `WIS:${buddy.stats.wisdom} SNK:${buddy.stats.snark}`,
        `♥ ${bar} ${state.happiness}`,
      ];
      console.log(header);
      console.log(renderSideBySide(artLines, infoLines));
      break;
    }

    case 'feed': {
      const state = loadState();
      if (state.happiness >= 100) {
        console.log(t('feed_full', lang)(state.happiness));
      } else {
        const gained = Math.min(15, 100 - state.happiness);
        const newHappiness = state.happiness + gained;
        saveState({ ...state, happiness: newHappiness });
        console.log(t('feed_done', lang)(gained, newHappiness));
        const config = loadConfig();
        const buddy = resolveBuddy('preview', config);
        console.log(renderCharacterPreview(buddy.character, buddy.color));
      }
      break;
    }

    case 'stats': {
      const state = loadState();
      const config = loadConfig();
      const buddy = resolveBuddy('preview', config);
      const preview = renderCharacterPreview(buddy.character, buddy.color);
      const [header, ...artLines] = preview.split('\n');
      const bar = happinessBar(state.happiness);
      const statsLines: string[] = [
        t('stats_sessions', lang)(state.totalSessions),
        t('stats_happiness', lang)(bar, state.happiness),
        t('stats_successes', lang)(state.totalSuccesses ?? 0),
        t('stats_errors', lang)(state.totalErrors ?? 0),
      ];
      if (state.firstSeenAt > 0) {
        const days = Math.floor((Date.now() - state.firstSeenAt) / 86_400_000);
        const sinceStr = days === 0
          ? (lang === 'ko' ? '오늘' : 'today')
          : (lang === 'ko' ? `${days}일 전` : `${days}d ago`);
        statsLines.push(t('stats_first_seen', lang)(sinceStr));
      }
      console.log(t('stats_title', lang)(buddy.name));
      console.log(renderSideBySide(artLines, statsLines));
      break;
    }

    default:
      console.log(t('help_title', lang));
      console.log('');
      console.log(t('help_commands', lang));
      console.log(t('help_setup', lang));
      console.log(t('help_select', lang));
      console.log(t('help_select_name', lang));
      console.log(t('help_random', lang));
      console.log(t('help_config_show', lang));
      console.log(t('help_config_set', lang));
      console.log(t('help_info', lang));
      console.log(t('help_feed', lang));
      console.log(t('help_stats', lang));
      break;
  }
}

/** 메인 진입점 */
export async function main(): Promise<void> {
  try {
    // 플러그인 캐릭터 로드 (빌트인 배열에 병합)
    const pluginChars = loadPluginCharacters();
    if (pluginChars.length > 0) {
      characters.push(...pluginChars);
    }

    const args = process.argv.slice(2);

    // CLI 서브커맨드가 있으면 CLI 모드
    if (args.length > 0) {
      handleCli(args);
      return;
    }

    // stdin이 있으면 statusline 모드, 없으면 help
    if (process.stdin.isTTY) {
      handleCli(['--help']);
      return;
    }

    await statuslineMode();
  } catch {
    // 최상위 폴백: 어떤 에러에서도 최소 ASCII 출력
    console.log(FALLBACK_ASCII);
  }
}
