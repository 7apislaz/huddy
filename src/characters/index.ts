// 캐릭터 레지스트리 — 13종 캐릭터 관리
import type { CharacterDef } from '../types.js';
import { peekcat } from './peekcat.js';
import { duck } from './duck.js';
import { cat } from './cat.js';
import { blob } from './blob.js';
import { owl } from './owl.js';
import { dragon } from './dragon.js';
import { penguin } from './penguin.js';
import { rabbit } from './rabbit.js';
import { octopus } from './octopus.js';
import { ghost } from './ghost.js';
import { axolotl } from './axolotl.js';
import { dog } from './dog.js';
import { hamster } from './hamster.js';

// 등급 라벨 (현재는 메타데이터 — /huddy-random은 균등 확률 사용)
// Common: duck, cat, blob, penguin, rabbit, dog, hamster
// Uncommon: owl, octopus, ghost
// Rare: dragon, axolotl, peekcat
//
// peekcat은 브랜드 마스코트이자 신규 설치 시 기본 캐릭터.
// 배열 맨 앞에 두어 fallback 상황에서도 peekcat이 노출되도록 함.
export const characters: CharacterDef[] = [
  peekcat,
  duck, cat, blob, penguin, rabbit, dog, hamster,
  owl, octopus, ghost,
  dragon, axolotl,
];

export { peekcat, duck, cat, blob, owl, dragon, penguin, rabbit, octopus, ghost, axolotl, dog, hamster };
