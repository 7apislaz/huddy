// 버디 레벨(XP) 시스템 — RPG 스타일 LV.xx 표시
// 레벨은 저장하지 않고 BuddyState에서 순수 함수로 계산 (단일 진실 공급원)
import type { BuddyState } from './types.js';

// XP 기여도: 성공 1건 = 1 XP, 세션 1회 = 3 XP, 토큰 비용 $0.20 = 1 XP
// (토큰은 센트 단위가 아니라 포인트 단위로, $0.10당 5배 곱해서 $0.20/XP)
const XP_PER_SESSION = 3;
const XP_PER_COST_USD = 5; // $1 spent = 5 XP

/**
 * 현재 누적 XP 계산
 * - successes: 트랜스크립트 성공 이벤트 수
 * - sessions: 30분 gap 이상으로 감지된 신규 세션 수
 * - cost: 생애 누적 비용 (만족도 계산에 반영된 부분, $0.10 단위)
 */
export function computeXp(state: BuddyState): number {
  const successes = state.totalSuccesses ?? 0;
  const sessions = state.totalSessions ?? 0;
  const cost = state.totalCostUsd ?? 0;
  return successes + sessions * XP_PER_SESSION + Math.floor(cost * XP_PER_COST_USD);
}

/**
 * XP → 레벨 계산
 * 공식: level = 1 + floor(sqrt(xp))
 * - xp 0 → LV 1
 * - xp 1 → LV 2
 * - xp 4 → LV 3
 * - xp 9 → LV 4
 * - xp 100 → LV 11
 * 초반 상승은 빠르고, 고레벨로 갈수록 완만 (RPG 감성)
 */
export function computeLevel(state: BuddyState): number {
  return 1 + Math.floor(Math.sqrt(computeXp(state)));
}

/**
 * 다음 레벨까지 남은 XP
 * 현재 레벨 L이면 다음 레벨은 xp ≥ L² 에서 발생
 */
export function xpToNextLevel(state: BuddyState): number {
  const level = computeLevel(state);
  const nextLevelXp = level * level;
  const currentXp = computeXp(state);
  return Math.max(0, nextLevelXp - currentXp);
}
