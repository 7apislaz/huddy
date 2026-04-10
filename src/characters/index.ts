// 캐릭터 레지스트리 — 모든 캐릭터를 한 곳에서 관리
import type { CharacterDef } from '../types.js';
import { duck } from './duck.js';
import { cat } from './cat.js';
import { blob } from './blob.js';
import { owl } from './owl.js';
import { dragon } from './dragon.js';

export const characters: CharacterDef[] = [duck, cat, blob, owl, dragon];
export { duck, cat, blob, owl, dragon };
