import { describe, it, expect } from 'vitest';
import { updateState, DEFAULT_STATE } from '../src/state.js';
import type { BuddyState, TranscriptEvent } from '../src/types.js';

function makeState(overrides: Partial<BuddyState> = {}): BuddyState {
  return { ...DEFAULT_STATE, lastSeenAt: Date.now(), ...overrides };
}

function makeEvent(type: TranscriptEvent['type'], minsAgo = 0): TranscriptEvent {
  return { type, timestamp: Date.now() - minsAgo * 60_000 + 1000, detail: '' };
}

describe('updateState', () => {
  describe('happiness decay', () => {
    it('no decay when recently seen', () => {
      const state = makeState({ happiness: 70, lastSeenAt: Date.now() - 60_000 });
      const updated = updateState(state, []);
      expect(updated.happiness).toBe(70);
    });

    it('decays after inactivity', () => {
      const state = makeState({ happiness: 70, lastSeenAt: Date.now() - 4 * 3_600_000 });
      const updated = updateState(state, []);
      expect(updated.happiness).toBeLessThan(70);
    });

    it('decay capped at 20', () => {
      const state = makeState({ happiness: 70, lastSeenAt: Date.now() - 48 * 3_600_000 });
      const updated = updateState(state, []);
      expect(updated.happiness).toBeGreaterThanOrEqual(50);
    });

    it('happiness floor is 0', () => {
      const state = makeState({ happiness: 5, lastSeenAt: Date.now() - 48 * 3_600_000 });
      const updated = updateState(state, []);
      expect(updated.happiness).toBeGreaterThanOrEqual(0);
    });
  });

  describe('event processing', () => {
    it('success increases happiness', () => {
      const state = makeState({ happiness: 50, lastProcessedAt: 0 });
      const updated = updateState(state, [makeEvent('success')]);
      expect(updated.happiness).toBe(55);
      expect(updated.consecutiveSuccesses).toBe(1);
      expect(updated.consecutiveErrors).toBe(0);
    });

    it('error decreases happiness', () => {
      const state = makeState({ happiness: 50, lastProcessedAt: 0 });
      const updated = updateState(state, [makeEvent('error')]);
      expect(updated.happiness).toBe(45);
      expect(updated.consecutiveErrors).toBe(1);
      expect(updated.consecutiveSuccesses).toBe(0);
    });

    it('success resets consecutiveErrors', () => {
      const state = makeState({ happiness: 50, consecutiveErrors: 3, lastProcessedAt: 0 });
      const updated = updateState(state, [makeEvent('success')]);
      expect(updated.consecutiveErrors).toBe(0);
      expect(updated.consecutiveSuccesses).toBe(1);
    });

    it('error resets consecutiveSuccesses', () => {
      const state = makeState({ happiness: 50, consecutiveSuccesses: 4, lastProcessedAt: 0 });
      const updated = updateState(state, [makeEvent('error')]);
      expect(updated.consecutiveSuccesses).toBe(0);
      expect(updated.consecutiveErrors).toBe(1);
    });

    it('happiness capped at 100', () => {
      const state = makeState({ happiness: 98, lastProcessedAt: 0 });
      const updated = updateState(state, [makeEvent('success'), makeEvent('success')]);
      expect(updated.happiness).toBeLessThanOrEqual(100);
    });
  });

  describe('duplicate prevention', () => {
    it('does not reprocess already-seen events', () => {
      const oldTs = Date.now() - 10_000;
      const state = makeState({ happiness: 50, lastProcessedAt: oldTs + 1 });
      const event: TranscriptEvent = { type: 'success', timestamp: oldTs, detail: '' };
      const updated = updateState(state, [event]);
      expect(updated.happiness).toBe(50); // no change
    });

    it('processes only new events', () => {
      const oldTs = Date.now() - 10_000;
      const newTs = Date.now() - 1_000;
      const state = makeState({ happiness: 50, lastProcessedAt: oldTs + 1 });
      const events: TranscriptEvent[] = [
        { type: 'success', timestamp: oldTs, detail: '' }, // old, skip
        { type: 'success', timestamp: newTs, detail: '' }, // new, process
      ];
      const updated = updateState(state, events);
      expect(updated.happiness).toBe(55);
    });
  });

  describe('lastSeenAt', () => {
    it('updates lastSeenAt to now', () => {
      const before = Date.now();
      const state = makeState({ lastSeenAt: Date.now() - 60_000 });
      const updated = updateState(state, []);
      expect(updated.lastSeenAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('token cost → happiness', () => {
    it('does nothing when cost param not provided', () => {
      const state = makeState({ happiness: 50 });
      const updated = updateState(state, []);
      expect(updated.happiness).toBe(50);
      expect(updated.lastProcessedCostUsd).toBe(0);
    });

    it('gains +1 per $0.10 of new cost', () => {
      const state = makeState({ happiness: 50, lastProcessedCostUsd: 0 });
      const updated = updateState(state, [], 0.5); // $0.50 → +5
      expect(updated.happiness).toBe(55);
      expect(updated.lastProcessedCostUsd).toBeCloseTo(0.5, 5);
    });

    it('only counts cost delta since last tick', () => {
      const state = makeState({ happiness: 50, lastProcessedCostUsd: 0.3 });
      const updated = updateState(state, [], 0.7); // delta $0.40 → +4
      expect(updated.happiness).toBe(54);
      expect(updated.lastProcessedCostUsd).toBeCloseTo(0.7, 5);
    });

    it('preserves remainder below threshold', () => {
      const state = makeState({ happiness: 50, lastProcessedCostUsd: 0 });
      // 첫 틱: $0.15 → +1, 기준점 $0.10 (잔액 $0.05 보존)
      const tick1 = updateState(state, [], 0.15);
      expect(tick1.happiness).toBe(51);
      expect(tick1.lastProcessedCostUsd).toBeCloseTo(0.10, 5);
      // 두 번째 틱: $0.25 → delta $0.15 → +1, 기준점 $0.20
      const tick2 = updateState(tick1, [], 0.25);
      expect(tick2.happiness).toBe(52);
      expect(tick2.lastProcessedCostUsd).toBeCloseTo(0.20, 5);
    });

    it('resets baseline when cost decreases (new session)', () => {
      const state = makeState({ happiness: 50, lastProcessedCostUsd: 5.0 });
      const updated = updateState(state, [], 0.2); // $5 → $0.2 = 새 세션
      expect(updated.happiness).toBe(52); // $0.20 새 세션 delta → +2
      expect(updated.lastProcessedCostUsd).toBeCloseTo(0.20, 5);
    });

    it('caps happiness at 100 from cost gains', () => {
      const state = makeState({ happiness: 95, lastProcessedCostUsd: 0 });
      const updated = updateState(state, [], 2.0); // $2.00 → +20 이지만 캡
      expect(updated.happiness).toBe(100);
    });

    it('ignores negative cost values', () => {
      const state = makeState({ happiness: 50, lastProcessedCostUsd: 0 });
      const updated = updateState(state, [], -1);
      expect(updated.happiness).toBe(50);
    });

    it('no change when delta below threshold', () => {
      const state = makeState({ happiness: 50, lastProcessedCostUsd: 0 });
      const updated = updateState(state, [], 0.05); // $0.05 < $0.10 임계점
      expect(updated.happiness).toBe(50);
      // 기준점은 유지 (0) — 다음 틱에서 누적되도록
      expect(updated.lastProcessedCostUsd).toBe(0);
    });
  });
});
