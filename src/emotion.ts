// 감정 결정 엔진
// 컨텍스트 사용률과 최근 트랜스크립트 이벤트를 기반으로 감정 상태 결정

import type { EmotionState, TranscriptEvent } from './types.js';

// 최근 이벤트 판단 기준: 3분(180,000ms)
const RECENT_WINDOW_MS = 180_000;

/**
 * idle 감정 상태 기본값
 * 에러 발생 시 또는 조건 미충족 시 반환
 */
function idleState(): EmotionState {
  return { type: 'idle', intensity: 0.3, trigger: 'idle' };
}

/**
 * 현재 시각 기준 최근 N밀리초 이내의 이벤트만 필터링
 */
function recentEvents(
  events: TranscriptEvent[],
  windowMs: number,
): TranscriptEvent[] {
  const now = Date.now();
  return events.filter((e) => now - e.timestamp <= windowMs);
}

/**
 * 감정 결정 엔진 — 우선순위 기반
 *
 * 우선순위 (높은 것이 먼저):
 * 1. contextPercent >= 80 → tired (intensity 0.8+)
 * 2. contextPercent >= 60 → tired (intensity 0.6)
 * 3. 최근 3분 내 error 이벤트 존재 → sad
 *    - 에러 3개 이상이면 intensity 0.9, 그 외 0.7
 * 4. 최근 3분 내 success 이벤트 존재 → happy (intensity 0.7)
 * 5. 그 외 → idle (intensity 0.3)
 *
 * 절대 throw 하지 않음 — 에러 시 idle 반환
 */
export function resolveEmotion(
  contextPercent: number,
  events: TranscriptEvent[],
): EmotionState {
  try {
    // ── 1순위: 컨텍스트 80% 이상 → 매우 지침 ──
    if (contextPercent >= 80) {
      // 80~100% 범위를 0.8~1.0으로 선형 보간
      const intensity = Math.min(1.0, 0.8 + (contextPercent - 80) / 100);
      return {
        type: 'tired',
        intensity: Math.round(intensity * 100) / 100,
        trigger: 'context>=80%',
      };
    }

    // ── 2순위: 컨텍스트 60% 이상 → 지침 ──
    if (contextPercent >= 60) {
      return {
        type: 'tired',
        intensity: 0.6,
        trigger: 'context>=60%',
      };
    }

    // 최근 3분 이내 이벤트만 추출
    const recent = recentEvents(events, RECENT_WINDOW_MS);

    // ── 3순위: 최근 에러 이벤트 → 슬픔 ──
    const errorEvents = recent.filter((e) => e.type === 'error');
    if (errorEvents.length > 0) {
      // 에러 3개 이상이면 더 강한 슬픔
      const intensity = errorEvents.length >= 3 ? 0.9 : 0.7;
      return {
        type: 'sad',
        intensity,
        trigger: `error x${errorEvents.length}`,
      };
    }

    // ── 4순위: 최근 성공 이벤트 → 기쁨 ──
    const successEvents = recent.filter((e) => e.type === 'success');
    if (successEvents.length > 0) {
      return {
        type: 'happy',
        intensity: 0.7,
        trigger: `success x${successEvents.length}`,
      };
    }

    // ── 5순위: 기본 → 대기 ──
    return idleState();
  } catch {
    // 예외 발생 시 안전하게 idle 반환
    return idleState();
  }
}
