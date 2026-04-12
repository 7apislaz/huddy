import { describe, it, expect } from 'vitest';
import { resolveEmotion } from '../src/emotion.js';
import type { BuddyState, TranscriptEvent } from '../src/types.js';
import { DEFAULT_STATE } from '../src/state.js';

const now = Date.now();

function makeEvent(type: TranscriptEvent['type'], minsAgo = 1): TranscriptEvent {
  return { type, timestamp: now - minsAgo * 60_000, detail: '' };
}

function makeState(overrides: Partial<BuddyState> = {}): BuddyState {
  return { ...DEFAULT_STATE, lastSeenAt: now, ...overrides };
}

describe('resolveEmotion', () => {
  describe('tired — context threshold', () => {
    it('returns tired at 60%', () => {
      const e = resolveEmotion(60, []);
      expect(e.type).toBe('tired');
      expect(e.intensity).toBe(0.6);
    });

    it('returns tired at 80%', () => {
      const e = resolveEmotion(80, []);
      expect(e.type).toBe('tired');
      expect(e.intensity).toBeGreaterThanOrEqual(0.8);
    });

    it('clamps intensity to 1.0 at 100%', () => {
      const e = resolveEmotion(100, []);
      expect(e.type).toBe('tired');
      expect(e.intensity).toBeLessThanOrEqual(1.0);
    });

    it('tired takes priority over recent errors', () => {
      const e = resolveEmotion(65, [makeEvent('error')]);
      expect(e.type).toBe('tired');
    });
  });

  describe('sad — recent errors', () => {
    it('returns sad on single error', () => {
      const e = resolveEmotion(30, [makeEvent('error')]);
      expect(e.type).toBe('sad');
      expect(e.intensity).toBe(0.7);
    });

    it('returns higher intensity on 3+ errors', () => {
      const events = [makeEvent('error'), makeEvent('error'), makeEvent('error')];
      const e = resolveEmotion(30, events);
      expect(e.type).toBe('sad');
      expect(e.intensity).toBe(0.9);
    });

    it('ignores old errors outside 3min window', () => {
      const e = resolveEmotion(30, [makeEvent('error', 5)]);
      expect(e.type).toBe('idle');
    });
  });

  describe('happy — recent success', () => {
    it('returns happy on success', () => {
      const e = resolveEmotion(30, [makeEvent('success')]);
      expect(e.type).toBe('happy');
      expect(e.intensity).toBe(0.7);
    });

    it('sad takes priority over success', () => {
      const e = resolveEmotion(30, [makeEvent('error'), makeEvent('success')]);
      expect(e.type).toBe('sad');
    });
  });

  describe('idle — default', () => {
    it('returns idle with no events and low context', () => {
      const e = resolveEmotion(0, []);
      expect(e.type).toBe('idle');
    });

    it('returns idle at 59% context', () => {
      const e = resolveEmotion(59, []);
      expect(e.type).toBe('idle');
    });
  });
});

describe('resolveEmotion — state-based triggers', () => {
  describe('reunion', () => {
    it('returns happy after 6h+ absence with good mood', () => {
      const state = makeState({
        happiness: 70,
        lastSeenAt: now - 7 * 3_600_000,
      });
      const e = resolveEmotion(0, [], state);
      expect(e.type).toBe('happy');
      expect(e.trigger).toBe('reunion');
    });

    it('does not trigger reunion if happiness < 30', () => {
      const state = makeState({
        happiness: 20,
        lastSeenAt: now - 7 * 3_600_000,
      });
      const e = resolveEmotion(0, [], state);
      expect(e.trigger).not.toBe('reunion');
    });

    it('does not trigger reunion if seen recently', () => {
      const state = makeState({ happiness: 70, lastSeenAt: now - 3_600_000 });
      const e = resolveEmotion(0, [], state);
      expect(e.trigger).not.toBe('reunion');
    });
  });

  describe('consecutive events', () => {
    it('excited with 5+ consecutive successes', () => {
      const state = makeState({ consecutiveSuccesses: 5 });
      const e = resolveEmotion(0, [], state);
      expect(e.type).toBe('excited');
      expect(e.intensity).toBe(1.0);
    });

    it('max intensity with 5+ consecutive errors', () => {
      const state = makeState({ consecutiveErrors: 5 });
      const e = resolveEmotion(0, [], state);
      expect(e.type).toBe('sad');
      expect(e.intensity).toBe(1.0);
    });
  });

  describe('low happiness', () => {
    it('returns sad when happiness < 25 and no other triggers', () => {
      const state = makeState({ happiness: 15 });
      const e = resolveEmotion(0, [], state);
      expect(e.type).toBe('sad');
      expect(e.trigger).toBe('low-happiness');
    });

    it('tired still overrides low happiness', () => {
      const state = makeState({ happiness: 10 });
      const e = resolveEmotion(65, [], state);
      expect(e.type).toBe('tired');
    });
  });
});
