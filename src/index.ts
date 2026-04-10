import { readStdin, parseStdinJson, extractSessionId, stabilizeContextPercent } from './stdin.js';
import { loadConfig } from './config.js';
import { resolveBuddy } from './buddy.js';
import { resolveEmotion } from './emotion.js';
import { parseTranscript } from './transcript.js';
import { renderBuddy, renderBuddyInfo, renderCharacterPreview } from './render.js';
import { renderHUD } from './hud.js';
import { setupStatusline, updateConfig } from './config.js';
import { characters } from './characters/index.js';
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
  const emotion = resolveEmotion(contextPercent, events);

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
  };

  const hudLine = renderHUD(hudData, config);

  // stdout 출력
  console.log(buddyArt);
  if (hudLine) console.log(hudLine);
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

  switch (cmd) {
    case 'setup':
      setupStatusline();
      console.log('✓ Claude Code statusline에 huddy가 등록되었습니다.');
      console.log('  Claude Code를 재시작하면 버디가 나타납니다!');
      break;

    case 'config': {
      const sub = args[1];
      if (sub === 'show') {
        console.log(JSON.stringify(loadConfig(), null, 2));
      } else if (sub === 'set' && args[2] && args[3]) {
        const config = updateConfig(args[2], args[3]);
        console.log(`✓ ${args[2]} = ${args[3]}`);
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.log('Usage: huddy config show | huddy config set <key> <value>');
        console.log('Keys: character, name, color, hud');
      }
      break;
    }

    case 'select': {
      const filter = args[1]; // 선택적: species 이름으로 바로 선택
      if (filter) {
        const found = characters.find((c) => c.species === filter);
        if (!found) {
          console.log(`✗ '${filter}' 캐릭터를 찾을 수 없습니다.`);
          console.log(`  사용 가능: ${characters.map((c) => c.species).join(', ')}`);
          break;
        }
        const config = updateConfig('character', filter);
        console.log(`✓ ${found.displayName} 선택!`);
        console.log(renderCharacterPreview(found));
        break;
      }
      // 인자 없으면 전체 목록 표시
      const currentConfig = loadConfig();
      console.log('🎭 캐릭터를 선택하세요:\n');
      for (const char of characters) {
        const isCurrent = currentConfig.character === char.species;
        const marker = isCurrent ? ' ← current' : '';
        console.log(renderCharacterPreview(char) + marker);
        console.log('');
      }
      console.log(`사용법: huddy select <species>`);
      console.log(`예시: huddy select cat`);
      break;
    }

    case 'random': {
      // 전체 캐릭터 중 랜덤 선택
      const picked = characters[Math.floor(Math.random() * characters.length)];

      // 10% 확률로 무지개, 나머지는 색상 랜덤
      const COLORS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
      const isRainbow = Math.random() < 0.2;
      const color = isRainbow ? 'rainbow' : COLORS[Math.floor(Math.random() * COLORS.length)];

      // config에 저장
      let config = updateConfig('character', picked.species);
      config = updateConfig('color', color);

      const colorLabel = isRainbow ? '🌈 RAINBOW' : color;
      console.log(`✦ ${picked.displayName} + ${colorLabel} 뽑음!`);
      console.log(renderCharacterPreview(picked, color));
      break;
    }

    case 'info': {
      const config = loadConfig();
      const buddy = resolveBuddy('preview', config);
      console.log(renderBuddyInfo(buddy));
      break;
    }

    default:
      console.log('huddy v0.1.0 — Tamagotchi CLI companion for Claude Code');
      console.log('');
      console.log('Commands:');
      console.log('  huddy setup          Register with Claude Code statusline');
      console.log('  huddy select         Browse & pick your buddy character');
      console.log('  huddy select <name>  Directly select a character');
      console.log('  huddy config show    Show current configuration');
      console.log('  huddy config set     Update a setting');
      console.log('  huddy random         Random character + color (10% rainbow!)');
      console.log('  huddy info           Show buddy info and stats');
      break;
  }
}

/** 메인 진입점 */
export async function main(): Promise<void> {
  try {
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
