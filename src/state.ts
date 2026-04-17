// 타마고치 지속 상태 관리
// ~/.huddy/state.json에 행복도, 연속 이벤트 카운터 저장

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { BuddyState, TranscriptEvent } from './types.js';

const STATE_PATH = join(homedir(), '.huddy', 'state.json');

export const DEFAULT_STATE: BuddyState = {
  happiness: 70,
  consecutiveErrors: 0,
  consecutiveSuccesses: 0,
  lastSeenAt: 0,
  lastProcessedAt: 0,
  totalSessions: 0,
  totalErrors: 0,
  totalSuccesses: 0,
  firstSeenAt: 0,
  lastProcessedCostUsd: 0,
};

// 토큰 소모 → 만족도 환산율: $0.10마다 +1 (≈ $1.50 세션 = +15 = feed 1회)
const COST_PER_HAPPINESS_POINT = 0.10;

export function loadState(): BuddyState {
  try {
    if (!existsSync(STATE_PATH)) return { ...DEFAULT_STATE, lastSeenAt: Date.now() };
    const raw = readFileSync(STATE_PATH, 'utf8');
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE, lastSeenAt: Date.now() };
  }
}

export function saveState(state: BuddyState): void {
  try {
    const dir = join(homedir(), '.huddy');
    mkdirSync(dir, { recursive: true });
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
  } catch {
    // 저장 실패는 조용히 무시
  }
}

// 30분 이상 gap이 있으면 새 세션으로 간주
const SESSION_GAP_MS = 30 * 60_000;

/**
 * 이벤트 기반 상태 업데이트
 * - lastProcessedAt 이후의 새 이벤트만 처리 (중복 방지)
 * - 행복도 자연 감소: 시간당 -2 (최대 -20)
 * - 성공: 행복도 +5, 연속 성공 카운터 증가
 * - 에러: 행복도 -5, 연속 에러 카운터 증가
 * - 30분 이상 gap → totalSessions 증가
 * - currentCostUsd 전달 시: 세션 누적 비용 증가분만큼 행복도 자동 증가
 *   ($0.10당 +1, 세션 바뀌면 cost가 0으로 리셋되는 걸 감지해 자동 재시작)
 */
export function updateState(
  state: BuddyState,
  events: TranscriptEvent[],
  currentCostUsd?: number,
): BuddyState {
  const now = Date.now();

  // 첫 등록일
  const firstSeenAt = state.firstSeenAt === 0 ? now : state.firstSeenAt;

  // 새 세션 감지 (lastSeenAt이 0이거나 30분+ gap)
  const isNewSession = state.lastSeenAt === 0 || (now - state.lastSeenAt) > SESSION_GAP_MS;
  const totalSessions = state.totalSessions + (isNewSession ? 1 : 0);

  // 시간 경과 기반 행복도 감소
  const hoursSinceSeen = state.lastSeenAt === 0 ? 0 : (now - state.lastSeenAt) / 3_600_000;
  const decay = Math.min(20, Math.floor(hoursSinceSeen * 2));
  let happiness = Math.max(0, state.happiness - decay);

  let consecutiveErrors = state.consecutiveErrors;
  let consecutiveSuccesses = state.consecutiveSuccesses;
  let lastProcessedAt = state.lastProcessedAt;
  let totalErrors = state.totalErrors ?? 0;
  let totalSuccesses = state.totalSuccesses ?? 0;

  // lastProcessedAt 이후의 새 이벤트만 처리
  const newEvents = events.filter((e) => e.timestamp > state.lastProcessedAt);

  for (const event of newEvents) {
    if (event.type === 'error') {
      consecutiveErrors += 1;
      consecutiveSuccesses = 0;
      totalErrors += 1;
      happiness = Math.max(0, happiness - 5);
    } else if (event.type === 'success') {
      consecutiveSuccesses += 1;
      consecutiveErrors = 0;
      totalSuccesses += 1;
      happiness = Math.min(100, happiness + 5);
    }
    if (event.timestamp > lastProcessedAt) {
      lastProcessedAt = event.timestamp;
    }
  }

  // 토큰 소모 기반 행복도 증가
  // 세션이 바뀌면(cost가 줄어들면) 기준점 0으로 리셋
  // 부동소수점 오차 방지: 정수 센트로 변환해 계산
  const prevCost = state.lastProcessedCostUsd ?? 0;
  let lastProcessedCostUsd = prevCost;
  if (typeof currentCostUsd === 'number' && currentCostUsd >= 0) {
    const currentCents = Math.round(currentCostUsd * 100);
    const prevCents = Math.round(prevCost * 100);
    const pointCents = Math.round(COST_PER_HAPPINESS_POINT * 100); // 10센트
    // 새 세션 감지: 비용이 역행하면(줄어들면) 기준점 0으로 리셋
    const baselineCents = currentCents < prevCents ? 0 : prevCents;
    const deltaCents = currentCents - baselineCents;
    if (deltaCents > 0) {
      const gain = Math.floor(deltaCents / pointCents);
      if (gain > 0) {
        happiness = Math.min(100, happiness + gain);
        // 소비된 만큼만 기준점 전진 (잔액 보존)
        lastProcessedCostUsd = (baselineCents + gain * pointCents) / 100;
      } else {
        // delta가 임계점에 못 미치면 baseline 유지 (역행일 땐 0으로 갱신)
        lastProcessedCostUsd = baselineCents / 100;
      }
    } else {
      // delta 0 또는 역행 중 gain=0 케이스 → baseline 채택
      lastProcessedCostUsd = baselineCents / 100;
    }
  }

  return {
    happiness,
    consecutiveErrors,
    consecutiveSuccesses,
    lastSeenAt: now,
    lastProcessedAt,
    totalSessions,
    totalErrors,
    totalSuccesses,
    firstSeenAt,
    lastProcessedCostUsd,
  };
}
