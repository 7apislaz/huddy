// 캐릭터 레지스트리 — 10종 캐릭터 관리
import type { CharacterDef } from '../types.js';
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

// Common: duck(25%), cat(20%), blob(15%), penguin(12%), rabbit(8%)
// Uncommon: owl(7%), octopus(6%), ghost(4%)
// Rare: dragon(2%), axolotl(1%)
export const characters: CharacterDef[] = [
  duck, cat, blob, penguin, rabbit,
  owl, octopus, ghost,
  dragon, axolotl,
];

export { duck, cat, blob, owl, dragon, penguin, rabbit, octopus, ghost, axolotl };
