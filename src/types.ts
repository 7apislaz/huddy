// ── statusline API 입력 ──
// 실제 Claude Code stdin JSON 기반. 누락 필드는 graceful degradation.
export interface StatuslineInput {
  model?: { id?: string; display_name?: string };
  context_window?: {
    used_percentage?: number;
    remaining_percentage?: number;
    context_window_size?: number;
  };
  cost?: { total_cost_usd?: number; total_duration_ms?: number };
  rate_limits?: {
    five_hour?: { used_percentage?: number; resets_at?: number };
    seven_day?: { used_percentage?: number; resets_at?: number };
  };
  transcript_path?: string;
  session_id?: string;
  cwd?: string;
}

// ── 감정 시스템 ──
export type Emotion = 'idle' | 'happy' | 'excited' | 'sad' | 'tired' | 'working';

export interface EmotionState {
  type: Emotion;
  intensity: number; // 0.0 ~ 1.0
  trigger: string;
}

// ── 캐릭터 ──
export interface AsciiFrame {
  lines: string[]; // 5줄, 각 줄 최대 12자
}

// 각 감정별 4프레임: [idle1, idle2, idle3, blink]
export type FrameSet = [AsciiFrame, AsciiFrame, AsciiFrame, AsciiFrame];

export interface CharacterDef {
  species: string;
  displayName: string;
  frames: Record<Emotion, FrameSet>;
  colorDefault: string; // ANSI 색상 코드 기본값
}

// ── RPG 스탯 ──
export interface RPGStats {
  debugging: number;
  patience: number;
  chaos: number;
  wisdom: number;
  snark: number;
}

// ── 버디 인스턴스 ──
export interface BuddyInstance {
  character: CharacterDef;
  name: string;
  stats: RPGStats;
  color: string;
}

// ── HUD ──
export interface HUDData {
  contextPercent: number | null;
  rateLimit5h: { percent: number; resetsAt: Date | null } | null;
  rateLimit7d: { percent: number; resetsAt: Date | null } | null;
  sessionDurationMs: number;
  happiness: number | null;
  buddyName?: string;
}

// ── 설정 ──
export interface HuddyConfig {
  character?: string;
  name?: string;
  color?: string;
  hudEnabled: boolean;
  lang: 'ko' | 'en';
}

// ── Transcript 파싱 결과 ──
export interface TranscriptEvent {
  type: 'success' | 'error' | 'neutral' | 'working';
  timestamp: number; // unix ms
  detail: string;
}

// ── 타마고치 지속 상태 ──
export interface BuddyState {
  happiness: number;           // 0–100
  consecutiveErrors: number;
  consecutiveSuccesses: number;
  lastSeenAt: number;          // unix ms — 재회 감지용
  lastProcessedAt: number;     // 마지막으로 처리한 이벤트 타임스탬프 (중복 방지)
  totalSessions: number;
  totalErrors: number;
  totalSuccesses: number;
  firstSeenAt: number;         // unix ms — 첫 등록일
}
