import type { BuddyInstance, CharacterDef, EmotionState } from './types.js';
import { getColor, rainbowLine, bold, dim, gray } from './color.js';

// ── 레이아웃 헬퍼 ──

/** ANSI escape 코드 제거 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/** 와이드 문자 여부 (터미널 2칸 차지) */
function isWideChar(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    cp === 0x2329 || cp === 0x232a ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3040 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xac00 && cp <= 0xd7af) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe10 && cp <= 0xfe19) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) || // ﹏ 포함
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1f64f) ||
    (cp >= 0x20000 && cp <= 0x2fffd) ||
    (cp >= 0x30000 && cp <= 0x3fffd)
  );
}

/** 터미널 실제 표시 너비 계산 */
function displayWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    width += isWideChar(char.codePointAt(0) ?? 0) ? 2 : 1;
  }
  return width;
}

/**
 * ASCII 아트 줄과 정보 줄을 나란히 렌더링
 * artColWidth: 아트 컬럼 고정 너비 (기본 16 — 모든 캐릭터 최대 13 + 여유 3)
 */
export function renderSideBySide(
  coloredArtLines: string[],
  infoLines: string[],
  artColWidth: number = 16,
  gap: string = '  ',
): string {
  const maxLines = Math.max(coloredArtLines.length, infoLines.length);
  const result: string[] = [];
  for (let i = 0; i < maxLines; i++) {
    const artLine = coloredArtLines[i] ?? '';
    const infoLine = infoLines[i] ?? '';
    const rawWidth = displayWidth(stripAnsi(artLine));
    const padding = ' '.repeat(Math.max(0, artColWidth - rawWidth));
    result.push(artLine + padding + gap + infoLine);
  }
  return result.join('\n');
}

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
