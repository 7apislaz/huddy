import { describe, it, expect } from 'vitest';
import { resolveBuddy } from '../src/buddy.js';
import type { HuddyConfig } from '../src/types.js';

const baseConfig: HuddyConfig = { hudEnabled: true, lang: 'en' };

describe('resolveBuddy', () => {
  it('returns a valid BuddyInstance', () => {
    const buddy = resolveBuddy('session-abc', baseConfig);
    expect(buddy.character).toBeDefined();
    expect(buddy.name).toBeTruthy();
    expect(buddy.color).toBeTruthy();
    expect(buddy.stats).toBeDefined();
  });

  it('is deterministic — same sessionId produces same result', () => {
    const b1 = resolveBuddy('same-session', baseConfig);
    const b2 = resolveBuddy('same-session', baseConfig);
    expect(b1.character.species).toBe(b2.character.species);
    expect(b1.stats).toEqual(b2.stats);
  });

  it('different sessionIds can produce different characters', () => {
    const sessions = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const species = sessions.map((s) => resolveBuddy(s, baseConfig).character.species);
    const unique = new Set(species);
    // 8개 세션에서 최소 2종 이상 나와야 함
    expect(unique.size).toBeGreaterThan(1);
  });

  it('respects config.character override', () => {
    const buddy = resolveBuddy('any-session', { ...baseConfig, character: 'cat' });
    expect(buddy.character.species).toBe('cat');
  });

  it('respects config.name override', () => {
    const buddy = resolveBuddy('any-session', { ...baseConfig, name: 'Buddy' });
    expect(buddy.name).toBe('Buddy');
  });

  it('respects config.color override', () => {
    const buddy = resolveBuddy('any-session', { ...baseConfig, color: 'cyan' });
    expect(buddy.color).toBe('cyan');
  });

  it('stats are within 0–100 range', () => {
    const buddy = resolveBuddy('stats-test', baseConfig);
    const { debugging, patience, chaos, wisdom, snark } = buddy.stats;
    for (const v of [debugging, patience, chaos, wisdom, snark]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('falls back gracefully on unknown character', () => {
    const buddy = resolveBuddy('x', { ...baseConfig, character: 'nonexistent' });
    expect(buddy.character).toBeDefined();
  });
});
