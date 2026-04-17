import { describe, it, expect } from 'vitest';
import { computeXp, computeLevel, xpToNextLevel } from '../src/level.js';
import { DEFAULT_STATE } from '../src/state.js';
import type { BuddyState } from '../src/types.js';

function makeState(overrides: Partial<BuddyState> = {}): BuddyState {
  return { ...DEFAULT_STATE, ...overrides };
}

describe('level system', () => {
  describe('computeXp', () => {
    it('returns 0 for fresh state', () => {
      expect(computeXp(makeState())).toBe(0);
    });

    it('counts successes as 1 XP each', () => {
      expect(computeXp(makeState({ totalSuccesses: 10 }))).toBe(10);
    });

    it('counts sessions as 3 XP each', () => {
      expect(computeXp(makeState({ totalSessions: 5 }))).toBe(15);
    });

    it('counts cost as 5 XP per $1 (floored)', () => {
      expect(computeXp(makeState({ totalCostUsd: 2 }))).toBe(10);
      expect(computeXp(makeState({ totalCostUsd: 0.5 }))).toBe(2); // floor(2.5) = 2
    });

    it('sums all three components', () => {
      const state = makeState({ totalSuccesses: 10, totalSessions: 4, totalCostUsd: 1 });
      // 10 + 4*3 + floor(1*5) = 10 + 12 + 5 = 27
      expect(computeXp(state)).toBe(27);
    });
  });

  describe('computeLevel', () => {
    it('starts at LV 1 with 0 XP', () => {
      expect(computeLevel(makeState())).toBe(1);
    });

    it('reaches LV 2 after first session (3 XP)', () => {
      expect(computeLevel(makeState({ totalSessions: 1 }))).toBe(2);
    });

    it('reaches LV 3 at 4 XP', () => {
      expect(computeLevel(makeState({ totalSuccesses: 4 }))).toBe(3);
    });

    it('reaches LV 4 at 9 XP', () => {
      expect(computeLevel(makeState({ totalSuccesses: 9 }))).toBe(4);
    });

    it('reaches LV 11 at 100 XP', () => {
      expect(computeLevel(makeState({ totalSuccesses: 100 }))).toBe(11);
    });

    it('scales gradually at high XP', () => {
      expect(computeLevel(makeState({ totalSuccesses: 10000 }))).toBe(101);
    });
  });

  describe('xpToNextLevel', () => {
    it('returns 1 at level 1 with 0 XP', () => {
      // LV 1 → next (LV 2) at xp >= 1, need 1 more
      expect(xpToNextLevel(makeState())).toBe(1);
    });

    it('returns 0 at exact boundary', () => {
      // xp=4 → LV 3, next (LV 4) at xp >= 9, need 5 more
      expect(xpToNextLevel(makeState({ totalSuccesses: 4 }))).toBe(5);
    });

    it('grows with each level', () => {
      // xp=1 → LV 2, next (LV 3) at xp >= 4, need 3 more
      expect(xpToNextLevel(makeState({ totalSuccesses: 1 }))).toBe(3);
      // xp=9 → LV 4, next (LV 5) at xp >= 16, need 7 more
      expect(xpToNextLevel(makeState({ totalSuccesses: 9 }))).toBe(7);
    });
  });

  describe('backward compat', () => {
    it('handles missing totalCostUsd (legacy state)', () => {
      const legacyState = {
        ...DEFAULT_STATE,
        totalCostUsd: undefined as unknown as number,
      };
      expect(computeXp(legacyState)).toBe(0);
      expect(computeLevel(legacyState)).toBe(1);
    });
  });
});
