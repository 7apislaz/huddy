import type { HUDData, HuddyConfig } from './types.js';
import { bold, dim, gray, green, yellow, red, cyan } from './color.js';

/** HUD 한 줄 렌더링. OMC HUD 스타일 — 색상 코딩 + 가독성 구분자 */
export function renderHUD(data: HUDData, config: HuddyConfig): string {
  if (!config.hudEnabled) return '';

  const parts: string[] = [];

  // 컨텍스트 사용량 — 색상 코딩 (초록/노랑/빨강)
  if (config.hudElements.context && data.contextPercent !== null) {
    const pct = data.contextPercent;
    const colorFn = pct >= 85 ? red : pct >= 70 ? yellow : green;
    parts.push(`ctx:${colorFn(`${pct}%`)}`);
  }

  // 세션 비용
  if (config.hudElements.cost && data.costUsd !== null) {
    const costStr = data.costUsd < 1
      ? `$${data.costUsd.toFixed(3)}`
      : `$${data.costUsd.toFixed(2)}`;
    parts.push(dim('cost:') + costStr);
  }

  // Rate limit (5h) — 색상 코딩 + 상대 리셋 시간
  if (config.hudElements.rateLimit && data.rateLimit5h) {
    const pct = data.rateLimit5h.percent;
    const colorFn = pct >= 80 ? red : pct >= 60 ? yellow : green;
    const resetStr = data.rateLimit5h.resetsAt
      ? dim(`(${formatRelativeTime(data.rateLimit5h.resetsAt)})`)
      : '';
    parts.push(dim('5h:') + colorFn(`${pct}%`) + resetStr);
  }

  // Rate limit (7d) — 색상 코딩 + 상대 리셋 시간
  if (config.hudElements.rateLimit && data.rateLimit7d) {
    const pct = data.rateLimit7d.percent;
    const colorFn = pct >= 80 ? red : pct >= 60 ? yellow : green;
    const resetStr = data.rateLimit7d.resetsAt
      ? dim(`(${formatRelativeTime(data.rateLimit7d.resetsAt)})`)
      : '';
    parts.push(dim('7d:') + colorFn(`${pct}%`) + resetStr);
  }

  // 세션 지속 시간
  if (data.sessionDurationMs > 0) {
    parts.push(dim('session:') + green(formatDuration(data.sessionDurationMs)));
  }

  if (parts.length === 0) return '';
  const separator = dim(' | ');
  return parts.join(separator);
}

/** 리셋 시간까지 남은 시간 (상대 표현) */
function formatRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 'now';
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
