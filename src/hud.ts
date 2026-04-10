import type { HUDData, HuddyConfig } from './types.js';
import { dim, green, yellow, red } from './color.js';

/** HUD 한 줄 렌더링 — 잔량 중심 색상 표시 */
export function renderHUD(data: HUDData, config: HuddyConfig): string {
  if (!config.hudEnabled) return '';

  const parts: string[] = [];

  // 컨텍스트 사용량 — 많이 쓸수록 빨강
  if (data.contextPercent !== null) {
    const used = Math.round(data.contextPercent);
    const colorFn = used >= 85 ? red : used >= 70 ? yellow : green;
    parts.push(dim('ctx:') + colorFn(`${used}%`));
  }

  // Rate limit (5h) — 사용량 기준 색상
  if (data.rateLimit5h) {
    const used = Math.round(data.rateLimit5h.percent * 10) / 10;
    const colorFn = used >= 85 ? red : used >= 70 ? yellow : green;
    const resetStr = data.rateLimit5h.resetsAt
      ? dim(` (${formatRelativeTime(data.rateLimit5h.resetsAt)})`)
      : '';
    parts.push(dim('5h:') + colorFn(`${used}%`) + resetStr);
  }

  // Rate limit (7d) — 사용량 기준 색상
  if (data.rateLimit7d) {
    const used = Math.round(data.rateLimit7d.percent * 10) / 10;
    const colorFn = used >= 85 ? red : used >= 70 ? yellow : green;
    const resetStr = data.rateLimit7d.resetsAt
      ? dim(` (${formatRelativeTime(data.rateLimit7d.resetsAt)})`)
      : '';
    parts.push(dim('7d:') + colorFn(`${used}%`) + resetStr);
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
