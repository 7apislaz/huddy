import { describe, it, expect } from 'vitest';
import { resolveEmotion } from '../src/emotion.js';
import type { TranscriptEvent } from '../src/types.js';

const now = Date.now();

function makeEvent(type: TranscriptEvent['type'], minsAgo = 1): TranscriptEvent {
  return { type, timestamp: now - minsAgo * 60_000, detail: '' };
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
