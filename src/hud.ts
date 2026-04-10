import type { HUDData, HuddyConfig } from './types.js';
import { bold, dim, green, yellow, red, cyan } from './color.js';

/** 플랜 라벨 매핑 */
const PLAN_LABELS: Record<string, string> = {
  pro: 'Pro',
  max: 'Max',
  team: 'Team',
  enterprise: 'Enterprise',
  free: 'Free',
};

/** HUD 한 줄 렌더링 — 잔량 중심 + 플랜 인식 */
export function renderHUD(data: HUDData, config: HuddyConfig): string {
  if (!config.hudEnabled) return '';

  const parts: string[] = [];

  // 플랜 라벨
  if (config.plan) {
    const label = PLAN_LABELS[config.plan] ?? config.plan;
    parts.push(cyan(bold(`[${label}]`)));
  }

  // 컨텍스트 사용량 — 색상 코딩 (초록/노랑/빨강)
  if (config.hudElements.context && data.contextPercent !== null) {
    const pct = data.contextPercent;
    const colorFn = pct >= 85 ? red : pct >= 70 ? yellow : green;
    parts.push(dim('ctx:') + colorFn(`${pct}%`));
  }

  // Rate limit (5h) — "잔량" 중심 표시
  if (config.hudElements.rateLimit && data.rateLimit5h) {
    const remaining = Math.max(0, Math.round((100 - data.rateLimit5h.percent) * 10) / 10);
    // 잔량 기준 색상: 많이 남으면 초록, 적으면 빨강
    const colorFn = remaining <= 15 ? red : remaining <= 30 ? yellow : green;
    const resetStr = data.rateLimit5h.resetsAt
      ? dim(` (${formatRelativeTime(data.rateLimit5h.resetsAt)})`)
      : '';
    parts.push(dim('5h:') + colorFn(`${remaining}% left`) + resetStr);
  }

  // Rate limit (7d) — "잔량" 중심 표시
  if (config.hudElements.rateLimit && data.rateLimit7d) {
    const remaining = Math.max(0, Math.round((100 - data.rateLimit7d.percent) * 10) / 10);
    const colorFn = remaining <= 15 ? red : remaining <= 30 ? yellow : green;
    const resetStr = data.rateLimit7d.resetsAt
      ? dim(` (${formatRelativeTime(data.rateLimit7d.resetsAt)})`)
      : '';
    parts.push(dim('7d:') + colorFn(`${remaining}% left`) + resetStr);
  }

  // 세션 지속 시간
  if (data.sessionDurationMs > 0) {
    parts.push(dim('session:') + green(formatDuration(data.sessionDurationMs)));
  }

  // 비용 — 맨 끝에 dim으로 참고용
  if (config.hudElements.cost && data.costUsd !== null) {
    const costStr = data.costUsd < 1
      ? `$${data.costUsd.toFixed(3)}`
      : `$${data.costUsd.toFixed(2)}`;
    parts.push(dim(costStr));
  }

  if (parts.length === 0) return '';
  const separator = dim(' | ');
  return parts.join(separator);
}

/** 리셋 시간까지 남은 시간 (상대 표현) */
function formatRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'soon';
  const totalMin = Math.floor(diffMs / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

/** ms → "Xm" 또는 "XhYm" */
function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}
