import type { BuddyInstance, CharacterDef, EmotionState } from './types.js';
import { getColor, rainbowLine, bold, dim, gray } from './color.js';

/** 시간 기반 프레임 인덱스 계산 (refreshInterval 기본 5초) */
function getFrameIndex(refreshIntervalSec: number = 5): number {
  return Math.floor(Date.now() / (refreshIntervalSec * 1000)) % 4;
}

/** 버디 ASCII 아트 렌더링 */
export function renderBuddy(
  buddy: BuddyInstance,
  emotion: EmotionState,
  refreshIntervalSec: number = 5,
): string {
  try {
    const frameIndex = getFrameIndex(refreshIntervalSec);
    const frameSet = buddy.character.frames[emotion.type];
    const frame = frameSet[frameIndex];
    const isRainbow = buddy.color === 'rainbow';
    const colorFn = getColor(buddy.color);

    return frame.lines
      .map((line, i) => isRainbow ? rainbowLine(line, i) : colorFn(line))
      .join('\n');
  } catch {
    // 폴백: 최소한의 ASCII
    return [
      '  (o_o)  ',
      '  /| |\\  ',
      '   | |   ',
      '  / | \\  ',
      ' ~~~~~~  ',
    ].join('\n');
  }
}

/** 캐릭터 미리보기 (select 커맨드용) — idle 프레임 0 + 이름 */
export function renderCharacterPreview(char: CharacterDef, color?: string): string {
  const resolvedColor = color ?? char.colorDefault;
  const isRainbow = resolvedColor === 'rainbow';
  const colorFn = getColor(resolvedColor);
  const frame = char.frames.idle[0];
  const art = frame.lines
    .map((line, i) => isRainbow ? rainbowLine(line, i) : colorFn(line))
    .join('\n');
  const header = `${bold(char.displayName)} ${gray(`(${char.species})`)}`;
  return `${header}\n${art}`;
}

/** 버디 이름 + 스탯 요약 (info 커맨드용) */
export function renderBuddyInfo(buddy: BuddyInstance): string {
  const { character, name, stats } = buddy;
  const colorFn = getColor(buddy.color);

  const lines = [
    colorFn(`✦ ${name} (${character.displayName})`),
    `  Stats:`,
    `    DBG:${stats.debugging} PAT:${stats.patience} CHS:${stats.chaos}`,
    `    WIS:${stats.wisdom} SNK:${stats.snark}`,
  ];
  return lines.join('\n');
}
