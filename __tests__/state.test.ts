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
});
