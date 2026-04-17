import { readStdin, parseStdinJson, extractSessionId, normalizeContextPercent } from './stdin.js';
import { loadConfig } from './config.js';
import { resolveBuddy } from './buddy.js';
import { resolveEmotion } from './emotion.js';
import { parseTranscript } from './transcript.js';
import { renderBuddy, renderBuddyInfo, renderCharacterPreview, renderSideBySide } from './render.js';
import { buildHUDLines } from './hud.js';
import { setupStatusline, updateConfig } from './config.js';
import { characters } from './characters/index.js';
import { loadPluginCharacters } from './plugin.js';
import { loadState, saveState, updateState, DEFAULT_STATE } from './state.js';
import { computeLevel } from './level.js';
import { t } from './i18n.js';
import { checkForUpdate } from './update-check.js';
import { statSync } from 'node:fs';
import type { CharacterDef, HUDData } from './types.js';

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
async function statuslineMode(charList: CharacterDef[]): Promise<void> {
  const raw = await readStdin();
  const input = parseStdinJson(raw);
  const config = loadConfig();
  const sessionId = extractSessionId(input);

  // 버디 결정
  const buddy = resolveBuddy(sessionId, config, charList);

  // 감정 결정
  const contextPercent = normalizeContextPercent(input.context_window?.used_percentage);
  const events = input.transcript_path ? parseTranscript(input.transcript_path) : [];

  // 지속 상태 로드 → 업데이트 → 저장
  // 토큰 소모량 반영: 세션 누적 비용이 증가한 만큼 행복도가 자동으로 오름
  const prevState = loadState();
  const state = updateState(prevState, events, input.cost?.total_cost_usd);
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
    buddyName: buddy.name,
    level: computeLevel(state),
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
function handleCli(args: string[], charList: CharacterDef[]): void {
  const cmd = args[0];
  const lang = loadConfig().lang;

  switch (cmd) {
    case 'setup': {
      setupStatusline();
      console.log(t('setup_done', lang));
      const setupConfig = loadConfig();
      const setupBuddy = resolveBuddy('preview', setupConfig, charList);
      console.log(renderCharacterPreview(setupBuddy.character, setupBuddy.color));
      console.log(t('setup_restart', lang));
      break;
    }

    case 'config': {
      const sub = args[1];
      if (sub === 'show') {
        console.log(JSON.stringify(loadConfig(), null, 2));
      } else if (sub === 'set' && args[2] && args[3]) {
        updateConfig(args[2], args[3]);
        console.log(t('config_set_done', lang)(args[2], args[3]));
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
        const found = charList.find((c) => c.species === filter);
        if (!found) {
          const list = charList.map((c) => c.species).join(', ');
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
      for (const char of charList) {
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
      const picked = charList[Math.floor(Math.random() * charList.length)];
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
      const buddy = resolveBuddy('preview', config, charList);
      const state = loadState();
      const level = computeLevel(state);
      const preview = renderCharacterPreview(buddy.character, buddy.color, level);
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
        const buddy = resolveBuddy('preview', config, charList);
        const level = computeLevel({ ...state, happiness: newHappiness });
        console.log(renderCharacterPreview(buddy.character, buddy.color, level));
      }
      break;
    }

    case 'stats': {
      const state = loadState();
      const config = loadConfig();
      const buddy = resolveBuddy('preview', config, charList);
      const level = computeLevel(state);
      const preview = renderCharacterPreview(buddy.character, buddy.color, level);
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
          ? t('stats_since_today', lang)
          : t('stats_since_days', lang)(days);
        statsLines.push(t('stats_first_seen', lang)(sinceStr));
      }
      console.log(t('stats_title', lang)(`${buddy.name} LV.${level}`));
      console.log(renderSideBySide(artLines, statsLines));
      break;
    }

    case 'rename': {
      const newName = args[1];
      if (!newName) {
        console.log(t('rename_usage', lang));
        break;
      }
      updateConfig('name', newName);
      console.log(t('rename_done', lang)(newName));
      break;
    }

    case 'reset': {
      saveState({ ...DEFAULT_STATE, firstSeenAt: 0, lastSeenAt: Date.now() });
      console.log(t('reset_done', lang));
      break;
    }

    case 'hud': {
      const current = loadConfig().hudEnabled;
      const next = !current;
      updateConfig('hud', next ? 'on' : 'off');
      console.log(t(next ? 'hud_on' : 'hud_off', lang));
      break;
    }

    case 'lang': {
      const target = args[1];
      if (target !== 'ko' && target !== 'en') {
        console.log(t('lang_usage', lang));
        break;
      }
      updateConfig('lang', target);
      // 변경된 언어로 확인 메시지 출력
      console.log(t('lang_done', target)(target));
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
      console.log(t('help_rename', lang));
      console.log(t('help_reset', lang));
      console.log(t('help_hud', lang));
      console.log(t('help_lang', lang));
      break;
  }
}

/** 메인 진입점 */
export async function main(): Promise<void> {
  try {
    // 플러그인 캐릭터 로드 (빌트인 + 플러그인 병합, 원본 배열 보존)
    const pluginChars = loadPluginCharacters();
    const allCharacters = pluginChars.length > 0
      ? [...characters, ...pluginChars]
      : characters;

    const args = process.argv.slice(2);

    // CLI 서브커맨드가 있으면 CLI 모드
    if (args.length > 0) {
      handleCli(args, allCharacters);
      // CLI 모드에서만 업데이트 알림 (statusline 제외)
      const lang = loadConfig().lang;
      const latest = await checkForUpdate();
      if (latest) console.log(t('update_available', lang)(latest));
      return;
    }

    // stdin이 있으면 statusline 모드, 없으면 help
    if (process.stdin.isTTY) {
      handleCli(['--help'], allCharacters);
      return;
    }

    await statuslineMode(allCharacters);
  } catch {
    // 최상위 폴백: 어떤 에러에서도 최소 ASCII 출력
    console.log(FALLBACK_ASCII);
  }
}
