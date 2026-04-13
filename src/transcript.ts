// Transcript JSONL 파서
// Claude Code가 생성하는 트랜스크립트 파일을 읽어 이벤트 분류

import * as fs from 'node:fs';
import type { TranscriptEvent } from './types.js';

// ── 모듈 레벨 캐시 ──
// mtimeMs 기반으로 파일 변경 여부 판단. 동일하면 재파싱 생략.
interface Cache {
  mtimeMs: number;
  events: TranscriptEvent[];
}

const cache = new Map<string, Cache>();

// 성공 키워드: tool_result 컨텍스트에서 등장할 때만 success로 분류
const SUCCESS_KEYWORDS = ['commit', 'created', 'passed', 'success', 'built', 'deployed'];

/**
 * 단일 JSON 줄을 파싱해 이벤트 타입 분류
 * - error: is_error=true 또는 type=tool_error
 * - success: tool_result 컨텍스트에서 성공 키워드 등장
 * - neutral: 그 외
 */
function classifyLine(raw: string): TranscriptEvent | null {
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // JSON 파싱 실패 줄은 무시
    return null;
  }

  // 타임스탬프: 줄에 timestamp 필드가 있으면 사용, 없으면 현재 시각
  const timestamp =
    typeof obj['timestamp'] === 'number'
      ? obj['timestamp']
      : typeof obj['timestamp'] === 'string'
        ? new Date(obj['timestamp'] as string).getTime()
        : Date.now();

  // 에러 판별: is_error 플래그 또는 type=tool_error
  const isError =
    obj['is_error'] === true ||
    obj['type'] === 'tool_error';

  if (isError) {
    const detail =
      typeof obj['content'] === 'string'
        ? (obj['content'] as string).slice(0, 80)
        : 'error';
    return { type: 'error', timestamp, detail };
  }

  // working 판별: tool_use 타입 (Claude가 도구 호출 중)
  if (obj['type'] === 'tool_use') {
    const detail = typeof obj['name'] === 'string' ? obj['name'] as string : 'tool_use';
    return { type: 'working', timestamp, detail };
  }

  // 성공 판별: tool_result 컨텍스트에서 성공 키워드 확인
  // tool_result 타입이거나 content 배열 안에 tool_result가 있는 경우
  const isToolResult =
    obj['type'] === 'tool_result' ||
    (Array.isArray(obj['content']) &&
      (obj['content'] as unknown[]).some(
        (c) =>
          typeof c === 'object' &&
          c !== null &&
          (c as Record<string, unknown>)['type'] === 'tool_result',
      ));

  if (isToolResult) {
    // content 문자열 전체를 소문자로 변환해 키워드 탐색
    const contentStr = JSON.stringify(obj['content'] ?? '').toLowerCase();
    const matched = SUCCESS_KEYWORDS.find((kw) => contentStr.includes(kw));
    if (matched) {
      return { type: 'success', timestamp, detail: matched };
    }
  }

  return { type: 'neutral', timestamp, detail: '' };
}

/**
 * Transcript JSONL 파일을 파싱해 이벤트 배열 반환
 *
 * - 파일 끝에서 64KB만 읽음 (바이트 기반 tail)
 * - stat.mtimeMs 기반 캐싱: 변경 없으면 캐시 반환
 * - 첫 번째 줄이 바이트 경계에서 잘렸을 수 있으므로 버림
 * - 에러 시 빈 배열 반환 (절대 throw 하지 않음)
 */
export function parseTranscript(path: string): TranscriptEvent[] {
  try {
    // stat으로 mtime 확인
    const stat = fs.statSync(path);
    const mtimeMs = stat.mtimeMs;

    // 캐시 히트: 파일이 바뀌지 않았으면 캐시 반환
    const cached = cache.get(path);
    if (cached !== undefined && cached.mtimeMs === mtimeMs) {
      return cached.events;
    }

    // 바이트 기반 tail: 파일 끝 64KB만 읽기
    const TAIL_BYTES = 64 * 1024;
    const fileSize = stat.size;
    const readSize = Math.min(TAIL_BYTES, fileSize);
    const offset = fileSize - readSize;

    const buf = Buffer.allocUnsafe(readSize);
    const fd = fs.openSync(path, 'r');
    try {
      fs.readSync(fd, buf, 0, readSize, offset);
    } finally {
      fs.closeSync(fd);
    }

    const text = buf.toString('utf8');
    const lines = text.split('\n');

    // 첫 번째 줄은 바이트 경계에서 잘렸을 수 있으므로 버림
    // (전체 파일을 읽은 경우 offset=0이면 버리지 않아도 되지만,
    //  안전을 위해 offset>0일 때만 버림)
    const startIdx = offset > 0 ? 1 : 0;

    const events: TranscriptEvent[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      const event = classifyLine(line);
      if (event !== null) {
        events.push(event);
      }
    }

    // 캐시 갱신
    cache.set(path, { mtimeMs, events });
    return events;
  } catch {
    // 파일 없음, 권한 오류 등 모든 에러 → 빈 배열
    return [];
  }
}
