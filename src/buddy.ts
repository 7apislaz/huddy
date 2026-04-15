import type { BuddyInstance, CharacterDef, RPGStats, HuddyConfig } from './types.js';
import { characters } from './characters/index.js';
import { mulberry32, hashString, randInt } from './prng.js';


/** session_id 기반으로 캐릭터 + 스탯 결정 (재현 가능) */
export function resolveBuddy(
  sessionId: string,
  config: HuddyConfig,
  charList: CharacterDef[] = characters,
): BuddyInstance {
  try {
    const seed = hashString(sessionId);
    const rng = mulberry32(seed);

    // 사용자가 캐릭터를 직접 지정한 경우
    const character = config.character
      ? charList.find((c) => c.species === config.character) ?? pickCharacter(rng, charList)
      : pickCharacter(rng, charList);

    const stats = rollStats(rng);
    const name = config.name ?? character.displayName;
    const color = config.color ?? character.colorDefault;

    return { character, name, stats, color };
  } catch {
    // 폴백: 첫 번째 캐릭터(duck) + 기본 스탯
    const fallback = charList[0] ?? characters[0];
    return {
      character: fallback,
      name: config.name ?? fallback.displayName,
      stats: { debugging: 50, patience: 50, chaos: 50, wisdom: 50, snark: 50 },
      color: config.color ?? fallback.colorDefault,
    };
  }
}

/** PRNG로 전체 캐릭터 중 랜덤 선택 */
function pickCharacter(rng: () => number, charList: CharacterDef[]): CharacterDef {
  return charList[Math.floor(rng() * charList.length)];
}

/** PRNG로 RPG 스탯 생성 (각 0~100) */
function rollStats(rng: () => number): RPGStats {
  return {
    debugging: randInt(rng, 0, 100),
    patience: randInt(rng, 0, 100),
    chaos: randInt(rng, 0, 100),
    wisdom: randInt(rng, 0, 100),
    snark: randInt(rng, 0, 100),
  };
}
