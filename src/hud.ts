import type { HUDData, HuddyConfig } from './types.js';
import { dim, gray } from './color.js';

/** HUD 한 줄 렌더링. config.hudEnabled=false면 빈 문자열. */
export function renderHUD(data: HUDData, config: HuddyConfig): string {
  if (!config.hudEnabled) return '';

  const parts: string[] = [];

  // 컨텍스트 사용량
  if (config.hudElements.context && data.contextPercent !== null) {
    const bar = makeBar(data.contextPercent);
    parts.push(`ctx:${bar} ${data.contextPercent}%`);
  }

  // 세션 비용
  if (config.hudElements.cost && data.costUsd !== null) {
    parts.push(`$${data.costUsd.toFixed(3)}`);
  }

  // Rate limit (5h)
  if (config.hudElements.rateLimit && data.rateLimit5h) {
    const resetStr = data.rateLimit5h.resetsAt
      ? ` ~${formatTime(data.rateLimit5h.resetsAt)}`
      : '';
    parts.push(`5h:${data.rateLimit5h.percent}%${resetStr}`);
  }

  // Rate limit (7d)
  if (config.hudElements.rateLimit && data.rateLimit7d) {
    parts.push(`7d:${data.rateLimit7d.percent}%`);
  }

  // 세션 지속 시간
  if (data.sessionDurationMs > 0) {
    parts.push(formatDuration(data.sessionDurationMs));
  }

  if (parts.length === 0) return '';
  return gray(dim(parts.join(' │ ')));
}

/** 프로그레스 바 (8칸) */
function makeBar(percent: number): string {
  const filled = Math.round((percent / 100) * 8);
  return '█'.repeat(filled) + '░'.repeat(8 - filled);
}

/** Date → "HH:MM" */
function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/** ms → "Xm" 또는 "Xh Ym" */
function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}
