// 감정 결정 엔진
// 컨텍스트 사용률, 최근 트랜스크립트 이벤트, 지속 상태를 기반으로 감정 결정

import type { EmotionState, TranscriptEvent, BuddyState } from './types.js';

// 최근 이벤트 판단 기준: 3분(180,000ms)
const RECENT_WINDOW_MS = 180_000;
// 재회 감지: 6시간 이상 미접속
const REUNION_THRESHOLD_MS = 6 * 3_600_000;

function idleState(): EmotionState {
  return { type: 'idle', intensity: 0.3, trigger: 'idle' };
}

function recentEvents(events: TranscriptEvent[], windowMs: number): TranscriptEvent[] {
  const now = Date.now();
  return events.filter((e) => now - e.timestamp <= windowMs);
}

/**
 * 감정 결정 엔진 — 우선순위 기반
 *
 * 1. contextPercent >= 80 → tired (intensity 0.8+)
 * 2. contextPercent >= 60 → tired (intensity 0.6)
 * 3. 재회 (6h+ 미접속 + happiness >= 30) → happy
 * 4. 연속 에러 5회 이상 또는 최근 에러 → sad
 * 5. 연속 성공 5회 이상 또는 최근 성공 → happy
 * 6. 행복도 < 25 → sad (누적된 피로)
 * 7. 기본 → idle
 *
 * state는 optional — 없으면 이벤트 기반으로만 동작 (하위 호환)
 */
export function resolveEmotion(
  contextPercent: number,
  events: TranscriptEvent[],
  state?: BuddyState,
): EmotionState {
  try {
    // ── 1순위: 컨텍스트 80% 이상 ──
    if (contextPercent >= 80) {
      const intensity = Math.min(1.0, 0.8 + (contextPercent - 80) / 100);
      return {
        type: 'tired',
        intensity: Math.round(intensity * 100) / 100,
        trigger: 'context>=80%',
      };
    }

    // ── 2순위: 컨텍스트 60% 이상 ──
    if (contextPercent >= 60) {
      return { type: 'tired', intensity: 0.6, trigger: 'context>=60%' };
    }

    const recent = recentEvents(events, RECENT_WINDOW_MS);

    // ── 3순위: 재회 감지 ──
    if (state) {
      const timeSinceLastSeen = Date.now() - state.lastSeenAt;
      if (timeSinceLastSeen >= REUNION_THRESHOLD_MS && state.happiness >= 30) {
        return { type: 'happy', intensity: 0.9, trigger: 'reunion' };
      }
    }

    // ── 4순위: 에러 ──
    const errorEvents = recent.filter((e) => e.type === 'error');
    const totalConsecErrors = state
      ? Math.max(errorEvents.length, state.consecutiveErrors)
      : errorEvents.length;

    if (totalConsecErrors > 0) {
      const intensity = totalConsecErrors >= 5 ? 1.0 : totalConsecErrors >= 3 ? 0.9 : 0.7;
      return {
        type: 'sad',
        intensity,
        trigger: `error x${totalConsecErrors}`,
      };
    }

    // ── 5순위: 성공 ──
    const successEvents = recent.filter((e) => e.type === 'success');
    const totalConsecSuccesses = state
      ? Math.max(successEvents.length, state.consecutiveSuccesses)
      : successEvents.length;

    if (totalConsecSuccesses > 0) {
      const intensity = totalConsecSuccesses >= 5 ? 1.0 : 0.7;
      return {
        type: 'happy',
        intensity,
        trigger: `success x${totalConsecSuccesses}`,
      };
    }

    // ── 6순위: 낮은 행복도 ──
    if (state && state.happiness < 25) {
      return { type: 'sad', intensity: 0.5, trigger: 'low-happiness' };
    }

    return idleState();
  } catch {
    return idleState();
  }
}
