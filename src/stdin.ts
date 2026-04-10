import type { StatuslineInput } from './types.js';

/** stdin에서 JSON blob 읽기 */
export function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    // stdin이 이미 끝난 경우 (파이프 없이 실행)
    if (process.stdin.isTTY) resolve('');
  });
}

/** JSON 문자열 → StatuslineInput 파싱. 실패 시 빈 객체. */
export function parseStdinJson(raw: string): StatuslineInput {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as StatuslineInput;
  } catch {
    return {};
  }
}

/** session_id가 없을 때 transcript_path에서 UUID 추출 */
export function extractSessionId(input: StatuslineInput): string {
  if (input.session_id) return input.session_id;
  if (input.transcript_path) {
    const match = input.transcript_path.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    if (match) return match[1];
  }
  return 'default-session';
}

// context_window.used_percentage 안정화 — 2% 미만 변동 무시
let prevContextPercent: number | null = null;

export function stabilizeContextPercent(raw: number | undefined): number {
  if (raw == null) {
    return prevContextPercent ?? 0;
  }
  if (prevContextPercent !== null && Math.abs(raw - prevContextPercent) < 2) {
    return prevContextPercent;
  }
  prevContextPercent = raw;
  return raw;
}
