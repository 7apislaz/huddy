import { describe, it, expect } from 'vitest';
import { mulberry32, hashString, randInt } from '../src/prng.js';

describe('mulberry32', () => {
  it('produces deterministic output for same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different output for different seeds', () => {
    const r1 = mulberry32(1)();
    const r2 = mulberry32(2)();
    expect(r1).not.toBe(r2);
  });

  it('output is in [0, 1)', () => {
    const rng = mulberry32(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('hashString', () => {
  it('same string produces same hash', () => {
    expect(hashString('hello')).toBe(hashString('hello'));
  });

  it('different strings produce different hashes', () => {
    expect(hashString('hello')).not.toBe(hashString('world'));
  });

  it('returns a non-negative integer', () => {
    const h = hashString('test');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(h)).toBe(true);
  });

  it('empty string does not throw', () => {
    expect(() => hashString('')).not.toThrow();
  });
});

describe('randInt', () => {
  it('output is within [min, max] range', () => {
    const rng = mulberry32(999);
    for (let i = 0; i < 100; i++) {
      const v = randInt(rng, 1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });

  it('returns min when min === max', () => {
    const rng = mulberry32(1);
    expect(randInt(rng, 5, 5)).toBe(5);
  });
});
