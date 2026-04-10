import type { BuddyInstance, EmotionState } from './types.js';
import { getColor } from './color.js';

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
    const colorFn = getColor(buddy.color);

    return frame.lines.map((line) => colorFn(line)).join('\n');
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

/** 버디 이름 + 스탯 요약 (info 커맨드용) */
export function renderBuddyInfo(buddy: BuddyInstance): string {
  const { character, name, stats } = buddy;
  const colorFn = getColor(buddy.color);

  const lines = [
    colorFn(`✦ ${name} (${character.displayName})`),
    `  Rarity: ${character.rarity}`,
    `  Stats:`,
    `    DBG:${stats.debugging} PAT:${stats.patience} CHS:${stats.chaos}`,
    `    WIS:${stats.wisdom} SNK:${stats.snark}`,
  ];
  return lines.join('\n');
}
