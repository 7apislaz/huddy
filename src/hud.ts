import type { HUDData, HuddyConfig } from './types.js';
import { dim, green, yellow, red, cyan, magenta } from './color.js';
import { VERSION } from './version.js';

/** HUD 정보를 줄 목록으로 반환 (우측 패널 side-by-side 렌더링용) */
export function buildHUDLines(data: HUDData, config: HuddyConfig): string[] {
  if (!config.hudEnabled) return [];
  const lines: string[] = [];

  lines.push(cyan(`huddy#${VERSION}`));

  // ctx + session 한 줄
  {
    const parts: string[] = [];
    if (data.contextPercent !== null) {
      const used = Math.round(data.contextPercent);
      const colorFn = used >= 85 ? red : used >= 70 ? yellow : green;
      parts.push(dim('ctx:') + colorFn(`${used}%`));
    }
    if (data.sessionDurationMs > 0) {
      parts.push(dim('ses:') + green(formatDuration(data.sessionDurationMs)));
    }
    if (parts.length > 0) lines.push(parts.join(dim('  ')));
  }

  // 5h + 7d 한 줄
  {
    const parts: string[] = [];
    if (data.rateLimit5h) {
      const used = Math.round(data.rateLimit5h.percent * 10) / 10;
      const colorFn = used >= 85 ? red : used >= 70 ? yellow : green;
      const resetStr = data.rateLimit5h.resetsAt
        ? dim(`(${formatRelativeTime(data.rateLimit5h.resetsAt)})`)
        : '';
      parts.push(dim('5h:') + colorFn(`${used}%`) + (resetStr ? ' ' + resetStr : ''));
    }
    if (data.rateLimit7d) {
      const used = Math.round(data.rateLimit7d.percent * 10) / 10;
      const colorFn = used >= 85 ? red : used >= 70 ? yellow : green;
      const resetStr = data.rateLimit7d.resetsAt
        ? dim(`(${formatRelativeTime(data.rateLimit7d.resetsAt)})`)
        : '';
      parts.push(dim('7d:') + colorFn(`${used}%`) + (resetStr ? ' ' + resetStr : ''));
    }
    if (parts.length > 0) lines.push(parts.join(dim('  ')));
  }

  if (data.happiness !== null) {
    const h = Math.round(data.happiness);
    const colorFn = h >= 70 ? green : h >= 40 ? yellow : red;
    lines.push(magenta('♥') + colorFn(`${h}`));
  }

  return lines;
}

/** HUD 한 줄 렌더링 (구형 호환용 — | 구분자로 join) */
export function renderHUD(data: HUDData, config: HuddyConfig): string {
  const lines = buildHUDLines(data, config);
  if (lines.length === 0) return '';
  return lines.join(dim(' | '));
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
