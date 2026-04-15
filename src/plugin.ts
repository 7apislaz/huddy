// 커스텀 캐릭터 플러그인 로더
// ~/.huddy/characters/*.json 파일을 읽어 캐릭터 추가

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { CharacterDef, Emotion } from './types.js';

const ALL_EMOTIONS: Emotion[] = ['idle', 'happy', 'excited', 'sad', 'tired', 'working'];

const PLUGIN_DIR = join(homedir(), '.huddy', 'characters');

/**
 * ~/.huddy/characters/ 에서 JSON 캐릭터 파일을 로드
 * 유효하지 않은 파일은 조용히 무시
 *
 * JSON 형식:
 * {
 *   "species": "mychar",
 *   "displayName": "My Char",
 *   "colorDefault": "green",
 *   "frames": {
 *     "idle":  [ {lines:[...]}, {lines:[...]}, {lines:[...]}, {lines:[...]} ],
 *     "happy": [ ... ],
 *     "sad":   [ ... ],
 *     "tired": [ ... ]
 *   }
 * }
 * 각 감정별 4프레임, 각 프레임은 5줄 배열
 */
export function loadPluginCharacters(): CharacterDef[] {
  try {
    if (!existsSync(PLUGIN_DIR)) return [];
    const files = readdirSync(PLUGIN_DIR).filter((f) => f.endsWith('.json'));
    const chars: CharacterDef[] = [];

    for (const file of files) {
      try {
        const raw = readFileSync(join(PLUGIN_DIR, file), 'utf8');
        const def = JSON.parse(raw) as Partial<CharacterDef>;

        if (
          typeof def.species === 'string' &&
          typeof def.displayName === 'string' &&
          typeof def.colorDefault === 'string' &&
          def.frames &&
          def.frames.idle?.length === 4
        ) {
          // 필수: idle 프레임. 나머지 감정은 누락 시 idle로 폴백
          for (const emotion of ALL_EMOTIONS) {
            if (!def.frames[emotion] || def.frames[emotion].length !== 4) {
              def.frames[emotion] = def.frames.idle;
            }
          }
          chars.push(def as CharacterDef);
        }
      } catch {
        // 개별 파일 파싱 실패 무시
      }
    }

    return chars;
  } catch {
    return [];
  }
}
